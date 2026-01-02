
import React from 'react';

interface InputFormProps {
  jobDescription: string;
  setJobDescription: (value: string) => void;
  resumeText: string;
  setResumeText: (value: string) => void;
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({
  jobDescription,
  setJobDescription,
  resumeText,
  setResumeText,
  resumeFile,
  setResumeFile,
  onAnalyze,
  isLoading,
}) => {

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type === 'application/pdf' && file.size < 5 * 1024 * 1024) { // 5MB limit
        setResumeFile(file);
        setResumeText(''); // Clear text input when file is selected
      } else {
        alert('Please select a PDF file under 5MB.');
        event.target.value = '';
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResumeText(e.target.value);
    if (e.target.value) {
        setResumeFile(null); // Clear file input when text is entered
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 bg-base-200 p-6 md:p-8 rounded-xl shadow-lg border border-base-300">
      <div>
        <label htmlFor="job-description" className="block text-sm font-medium text-content-200 mb-2">
          Job Description
        </label>
        <textarea
          id="job-description"
          rows={12}
          className="w-full bg-base-100 border border-base-300 rounded-md shadow-sm p-3 focus:ring-brand-primary focus:border-brand-primary transition duration-150 ease-in-out text-sm placeholder-content-200/50"
          placeholder="Paste the full job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
            <label htmlFor="resume-text" className="block text-sm font-medium text-content-200">
            Resume
            </label>
            <label htmlFor="resume-upload" className="cursor-pointer text-sm font-medium text-brand-primary hover:text-brand-secondary transition-colors">
                Upload PDF
                <input id="resume-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} disabled={isLoading} />
            </label>
        </div>
        
        {resumeFile ? (
            <div className="w-full h-[258px] bg-base-100 border border-base-300 rounded-md shadow-sm p-3 flex flex-col items-center justify-center text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-content-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-semibold text-content-100 break-all">{resumeFile.name}</p>
                <p className="text-xs text-content-200 mt-1">{(resumeFile.size / 1024).toFixed(2)} KB</p>
                <button 
                    onClick={() => setResumeFile(null)} 
                    className="mt-4 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40 px-3 py-1 rounded-full transition-colors"
                    disabled={isLoading}
                >
                    Clear File
                </button>
            </div>
        ) : (
            <textarea
            id="resume-text"
            rows={12}
            className="w-full bg-base-100 border border-base-300 rounded-md shadow-sm p-3 focus:ring-brand-primary focus:border-brand-primary transition duration-150 ease-in-out text-sm placeholder-content-200/50"
            placeholder="Paste resume text or upload a PDF..."
            value={resumeText}
            onChange={handleTextChange}
            disabled={isLoading}
            />
        )}
      </div>
      <div className="md:col-span-2">
        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="w-full flex items-center justify-center bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-base-100 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            'Run Multi-Agent Analysis'
          )}
        </button>
      </div>
    </div>
  );
};

export default InputForm;
