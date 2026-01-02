
import React, { useState } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import Loader from './components/Loader';
import { analyzeResume } from './services/geminiService';
import type { AnalysisResult } from './types';

const App: React.FC = () => {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [resumeText, setResumeText] = useState<string>('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!jobDescription.trim() || (!resumeText.trim() && !resumeFile)) {
      setError('Please provide a job description and a resume (either text or PDF file).');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeResume(resumeText, resumeFile, jobDescription);
      setAnalysisResult(result);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during analysis. Please check the console for details.';
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-content-200 mb-8 max-w-3xl mx-auto">
            This tool uses a simulated Multi-Agent System to provide a holistic analysis of a candidate's resume against a job description. Paste the details below or upload a PDF to begin.
          </p>
          <InputForm
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            resumeText={resumeText}
            setResumeText={setResumeText}
            resumeFile={resumeFile}
            setResumeFile={setResumeFile}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />
          
          {isLoading && <Loader />}
          
          {error && (
            <div className="mt-8 text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Analysis Failed: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {analysisResult && !isLoading && (
            <div className="mt-8">
              <ResultsDisplay result={analysisResult} />
            </div>
          )}
        </div>
      </main>
      <footer className="text-center p-4 text-content-200 text-sm mt-8">
        <p>Powered by Gemini API. Designed for illustrative purposes.</p>
      </footer>
    </div>
  );
};

export default App;
