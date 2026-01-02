import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, AgentReport, FinalAnalysis, ParsingReport, AgentWeights } from '../types';
import { AgentType } from '../types';

// if (!process.env.API_KEY) {
//     throw new Error("API_KEY environment variable not set");
// }

// if (!import.meta.env.VITE_API_KEY) {
//     throw new Error("VITE_API_KEY environment variable not set");
// }

// const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

// Use a safe access pattern for VITE_API_KEY; cast import.meta to any to avoid the TypeScript error when ImportMeta.env is not declared.
const VITE_API_KEY = (import.meta as any).env?.VITE_API_KEY;

if (!VITE_API_KEY) {
    throw new Error("VITE_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: VITE_API_KEY });

// Constants for retry logic
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000; // 1 second
const MAX_DELAY_MS = 10000; // 10 seconds

// Helper function to retry API calls with exponential backoff
async function retryWithExponentialBackoff<T>(
    fn: () => Promise<T>,
    fnName: string,
    maxRetries: number = MAX_RETRIES
): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            
            // Check if error is retryable (503, 429, or network errors)
            const isRetryable = error?.status === 503 || 
                              error?.status === 429 || 
                              error?.code === 'UNAVAILABLE' ||
                              error?.code === 'RESOURCE_EXHAUSTED' ||
                              error?.message?.includes('overloaded');
            
            if (!isRetryable || attempt === maxRetries - 1) {
                throw error;
            }
            
            // Calculate exponential backoff with jitter
            const delayMs = Math.min(
                INITIAL_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000,
                MAX_DELAY_MS
            );
            
            console.warn(
                `[${fnName}] Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${Math.round(delayMs)}ms...`,
                error?.message
            );
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    
    throw lastError || new Error(`Max retries exceeded for ${fnName}`);
}

// Helper to convert File to a base64 string for the API
async function fileToGenerativePart(file: File) {
    const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to read file as base64 string"));
            }
        };
        reader.onerror = (err) => {
            reject(err);
        };
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type
        }
    };
}

async function extractTextFromPdf(file: File): Promise<string> {
    try {
        const filePart = await fileToGenerativePart(file);
        return await retryWithExponentialBackoff(
            async () => {
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: {
                        parts: [
                            filePart,
                            { text: "Extract all text from this resume PDF. Maintain the structure and formatting as much as possible." }
                        ]
                    },
                });
                return response.text;
            },
            "extractTextFromPdf"
        );
    } catch (error) {
        console.error("Error extracting text from PDF:", error);
        throw new Error("Failed to extract text from the provided PDF file. The file might be corrupted or in an unsupported format.");
    }
}

// Schemas for structured responses
const parsingSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A one-sentence summary of the candidate's professional profile." },
        name: { type: Type.STRING, description: "The full name of the candidate." },
        contact: { type: Type.STRING, description: "The primary contact information (email or phone)." },
        skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of key skills extracted." },
    },
    required: ['summary', 'name', 'contact', 'skills']
};

const knowledgeRetrievalSchema = {
    type: Type.OBJECT,
    properties: {
        retrievedContext: { type: Type.STRING, description: "A summary of relevant context retrieved from simulated knowledge bases (Technical Ontology, Company Policy, Historical Success Metrics) to aid evaluation agents." },
    },
    required: ['retrievedContext']
};

const agentReportSchema = {
    type: Type.OBJECT,
    properties: {
        agentName: { type: Type.STRING },
        score: { type: Type.INTEGER, description: "A score from 0 to 100." },
        summary: { type: Type.STRING, description: "A concise summary of the findings." },
        details: {
            type: Type.OBJECT,
            properties: {
                positive: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Positive points observed." },
                negative: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Negative points or gaps found." },
                observations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Neutral observations or key extractions." },
            },
        },
    },
    required: ['agentName', 'score', 'summary']
};

const culturalAgentReportSchema = {
    type: Type.OBJECT,
    properties: {
        agentName: { type: Type.STRING },
        score: { type: Type.INTEGER, description: "A score from 0 to 100 based on predictive fit." },
        summary: { type: Type.STRING, description: "A concise summary of the predictive analysis." },
        details: { type: Type.OBJECT, properties: { positive: { type: Type.ARRAY, items: { type: Type.STRING } }, negative: { type: Type.ARRAY, items: { type: Type.STRING } }, observations: { type: Type.ARRAY, items: { type: Type.STRING } } } },
        prediction: {
            type: Type.OBJECT,
            properties: {
                retentionRisk: { type: Type.STRING, enum: ['Low', 'Medium', 'High'], description: "Predicted risk of the candidate leaving within 2 years." },
                performanceForecast: { type: Type.STRING, description: "A forecast of the candidate's potential long-term performance and success." },
            },
            required: ['retentionRisk', 'performanceForecast']
        }
    },
    required: ['agentName', 'score', 'summary', 'prediction']
};

const finalAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        overallScore: { type: Type.INTEGER, description: "The final aggregated score from 0 to 100." },
        summary: { type: Type.STRING, description: "A final, holistic summary of the candidate's profile." },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendation: { type: Type.STRING, enum: ['Strongly Recommend', 'Recommend', 'Consider', 'Not a Fit'] },
        conflictResolution: { type: Type.STRING, description: "An explanation of how conflicting scores from different agents were resolved, referencing the provided weights and negotiation protocols." }
    },
    required: ['overallScore', 'summary', 'strengths', 'weaknesses', 'recommendation', 'conflictResolution']
};

// Determines role type and assigns weights to agents
async function determineRoleTypeAndWeights(jd: string): Promise<{ roleType: string, weights: AgentWeights }> {
    const prompt = `Analyze the following job description and classify it into one of the following categories: 'Technical/Engineering', 'Sales/Marketing', 'Management/Leadership', 'Administrative/Support'. Based on the category, provide a weighting distribution for different evaluation agents. For example, technical roles should heavily weight the Technical agent.

Job Description:
${jd}

Return ONLY a JSON object with the format: {"roleType": "...", "weights": {"Technical Competency Agent": 0.5, "Contextual Relevance Agent": 0.2, "Experience & Impact Agent": 0.2, "Cultural/Predictive Fit Agent": 0.1}}. The weights must sum to 1.0.`;
    
    try {
        const response = await retryWithExponentialBackoff(
            async () => {
                return await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        temperature: 0.1,
                    }
                });
            },
            "determineRoleTypeAndWeights"
        );
        const json = JSON.parse(response.text.trim());
        if (json.weights && typeof json.roleType === 'string') {
            return json as { roleType: string, weights: AgentWeights };
        }
        throw new Error("Invalid format for role type and weights.");
    } catch (e) {
        console.error("Failed to determine role type and weights, using default.", e);
        return {
            roleType: 'General',
            weights: {
                [AgentType.TECHNICAL]: 0.25,
                [AgentType.CONTEXTUAL]: 0.25,
                [AgentType.EXPERIENCE]: 0.25,
                [AgentType.CULTURAL]: 0.25,
            }
        };
    }
}

const getPromptAndSchema = (
    agentType: AgentType, 
    resume: string, 
    jd: string, 
    dependencies?: {
        parsedResume?: ParsingReport;
        retrievedContext?: string;
        agentReports?: object;
        weights?: AgentWeights;
    }
) => {
    const commonInstructions = "Analyze the provided inputs. Return your analysis ONLY in the specified JSON format.";
    switch (agentType) {
        case AgentType.PARSING:
            return {
                prompt: `You are a Parsing & Extraction Agent. Your task is to accurately extract key information from the resume into a structured JSON format. Do not score or evaluate, only extract. Here is the resume:\n\n${resume}`,
                schema: parsingSchema
            };
        case AgentType.KNOWLEDGE_RETRIEVAL:
             return {
                prompt: `You are a Knowledge Base Retrieval Agent. Based on the job description and parsed resume, simulate retrieving highly relevant context from three internal knowledge bases:
1.  **Technical Skill Ontology**: Identify core technical skills and suggest related or more advanced skills that are valued.
2.  **Internal Company Policy Index**: Extract key cultural values or working styles (e.g., 'emphasis on async communication', 'quarterly innovation sprints').
3.  **Historical Success Metrics**: Based on the role's seniority, infer what kind of past achievements have led to success (e.g., 'For senior roles, metrics showing leadership and revenue impact are critical.').
Synthesize these three points into a concise context summary. ${commonInstructions}

JOB DESCRIPTION:
${jd}

PARSED RESUME DATA:
${JSON.stringify(dependencies?.parsedResume, null, 2)}`,
                schema: knowledgeRetrievalSchema
            };
        case AgentType.TECHNICAL:
            return {
                prompt: `You are a Technical Competency Agent. Your sole focus is to assess hard skills, tools, programming languages, certifications, and technical experience from the resume against the job description. Be objective and strict.
ADDITIONAL CONTEXT FROM KNOWLEDGE BASE:
${dependencies?.retrievedContext}
${commonInstructions}\n\nJOB DESCRIPTION:\n${jd}\n\nRESUME:\n${resume}`,
                schema: agentReportSchema
            };
        case AgentType.CONTEXTUAL:
            return {
                prompt: `You are a Contextual Relevance Agent. Your task is to evaluate how well the candidate's experience aligns with the company culture, values, and specific nuances mentioned in the job description and the retrieved context.
ADDITIONAL CONTEXT FROM KNOWLEDGE BASE:
${dependencies?.retrievedContext}
${commonInstructions}\n\nJOB DESCRIPTION:\n${jd}\n\nRESUME:\n${resume}`,
                schema: agentReportSchema
            };
        case AgentType.EXPERIENCE:
            return {
                prompt: `You are an Experience & Impact Agent. Your job is to analyze the depth, quality, and impact of the candidate's work experience, informed by the retrieved context about what success looks like. Look for quantified achievements and career progression.
ADDITIONAL CONTEXT FROM KNOWLEDGE BASE:
${dependencies?.retrievedContext}
${commonInstructions}\n\nJOB DESCRIPTION:\n${jd}\n\nRESUME:\n${resume}`,
                schema: agentReportSchema
            };
        case AgentType.CULTURAL:
            return {
                prompt: `You are a Cultural/Predictive Fit Agent. Your goal is to move beyond simple keyword matching and act as a predictive hiring analyst. Based on the resume, job description, and internal context, forecast the candidate's long-term success.
- Analyze career progression, tenure, and language to infer soft skills and behavioral traits.
- Predict the candidate's retention risk (Low, Medium, High).
- Provide a forecast for their potential performance and alignment with a collaborative, forward-thinking company culture.

INTERNAL CONTEXT:
${dependencies?.retrievedContext}
${commonInstructions}\n\nJOB DESCRIPTION:\n${jd}\n\nRESUME:\n${resume}`,
                schema: culturalAgentReportSchema
            };
        case AgentType.CONSENSUS:
            return {
                prompt: `You are the final Consensus Agent. You have received reports from multiple specialized agents. Your task is to synthesize these reports into a single, final recommendation. Your decision must be guided by the following weights, determined by the job type:
WEIGHTS:
${JSON.stringify(dependencies?.weights, null, 2)}

NEGOTIATION PROTOCOL:
Your primary task is to resolve conflicts between agent scores using a 'Peer Review' protocol. Explicitly identify the most significant conflict (e.g., 'High technical score vs. Low contextual fit'). In your 'conflictResolution' field, explain how you used the weights and a holistic view to resolve this discrepancy and arrive at a final, justified score.

Here are the agent reports:\n\n${JSON.stringify(dependencies?.agentReports, null, 2)}\n\nProvide your final analysis in the specified JSON format.`,
                schema: finalAnalysisSchema
            };
    }
};

async function runAgent<T>(
    agentType: AgentType, 
    resume: string, 
    jd: string, 
    dependencies?: object
): Promise<T> {
    const { prompt, schema } = getPromptAndSchema(agentType, resume, jd, dependencies);
    try {
        const response = await retryWithExponentialBackoff(
            async () => {
                return await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: schema,
                        temperature: 0.2,
                    },
                });
            },
            `runAgent(${agentType})`
        );

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as T;

    } catch (error) {
        console.error(`Error running agent: ${agentType}`, error);
        throw new Error(`The ${agentType} failed to produce a valid analysis.`);
    }
}

export const analyzeResume = async (resumeText: string, resumeFile: File | null, jd: string): Promise<AnalysisResult> => {
    
    let effectiveResumeText = resumeText;
    if (resumeFile) {
        effectiveResumeText = await extractTextFromPdf(resumeFile);
    }
    
    // Step 1: Parse the resume
    const parsing = await runAgent<ParsingReport>(AgentType.PARSING, effectiveResumeText, jd);

    // Step 2: Retrieve knowledge context and determine role weights in parallel
    const [knowledgeResult, roleInfo] = await Promise.all([
        runAgent<{ retrievedContext: string }>(AgentType.KNOWLEDGE_RETRIEVAL, effectiveResumeText, jd, { parsedResume: parsing }),
        determineRoleTypeAndWeights(jd)
    ]);
    const { retrievedContext } = knowledgeResult;
    const { weights } = roleInfo;

    // Step 3: Run specialized evaluation agents in parallel, with retrieved context
    const [technical, contextual, experience, cultural] = await Promise.all([
        runAgent<AgentReport>(AgentType.TECHNICAL, effectiveResumeText, jd, { retrievedContext }),
        runAgent<AgentReport>(AgentType.CONTEXTUAL, effectiveResumeText, jd, { retrievedContext }),
        runAgent<AgentReport>(AgentType.EXPERIENCE, effectiveResumeText, jd, { retrievedContext }),
        runAgent<AgentReport>(AgentType.CULTURAL, effectiveResumeText, jd, { retrievedContext })
    ]);

    // Step 4: Run the consensus agent with all prior results and dynamic weights
    const agentReports = { technical, contextual, experience, cultural };
    const consensus = await runAgent<FinalAnalysis>(AgentType.CONSENSUS, effectiveResumeText, jd, { agentReports, weights });

    return { parsing, retrievedContext, technical, contextual, experience, cultural, consensus };
};
