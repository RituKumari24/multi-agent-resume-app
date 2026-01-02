export interface AgentReport {
  agentName: string;
  score: number;
  summary: string;
  details?: {
    positive?: string[];
    negative?: string[];
    observations?: string[];
  };
  prediction?: {
      retentionRisk: 'Low' | 'Medium' | 'High';
      performanceForecast: string;
  };
}

export interface FinalAnalysis {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: 'Strongly Recommend' | 'Recommend' | 'Consider' | 'Not a Fit';
  summary: string;
  conflictResolution: string;
}

export interface ParsingReport {
    summary: string;
    name: string;
    contact: string;
    skills: string[];
}

export interface AnalysisResult {
  parsing: ParsingReport;
  retrievedContext: string;
  technical: AgentReport;
  contextual: AgentReport;
  experience: AgentReport;
  cultural: AgentReport;
  consensus: FinalAnalysis;
}

export enum AgentType {
    PARSING = 'Parsing & Extraction Agent',
    KNOWLEDGE_RETRIEVAL = 'Knowledge Base Retrieval Agent',
    TECHNICAL = 'Technical Competency Agent',
    CONTEXTUAL = 'Contextual Relevance Agent',
    EXPERIENCE = 'Experience & Impact Agent',
    CULTURAL = 'Cultural/Predictive Fit Agent',
    CONSENSUS = 'Consensus Agent'
}

export interface AgentWeights {
    [AgentType.TECHNICAL]: number;
    [AgentType.CONTEXTUAL]: number;
    [AgentType.EXPERIENCE]: number;
    [AgentType.CULTURAL]: number;
}
