import React from 'react';
import type { AnalysisResult } from '../types';
import AgentCard from './AgentCard';
import { AgentType } from '../types';

interface ResultsDisplayProps {
  result: AnalysisResult;
}

const CheckIcon = () => (
    <svg className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const XIcon = () => (
    <svg className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
    const { parsing, technical, contextual, experience, cultural, consensus } = result;

    const recommendationColor = {
        'Strongly Recommend': 'text-green-400 border-green-400',
        'Recommend': 'text-cyan-400 border-cyan-400',
        'Consider': 'text-yellow-400 border-yellow-400',
        'Not a Fit': 'text-red-400 border-red-400',
    };
  
    return (
    <div className="space-y-8 animate-fade-in">
        {/* Consensus Section */}
        <div className="bg-base-200 p-6 md:p-8 rounded-xl shadow-lg border border-base-300">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Final Consensus Report</h2>
            <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
                <div className="flex-shrink-0 text-center md:text-left mb-6 md:mb-0">
                    <p className="text-sm text-content-200 uppercase tracking-wider">Overall Score</p>
                    <p className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary">{consensus.overallScore}</p>
                    <p className={`text-lg font-semibold mt-2 px-3 py-1 border-2 rounded-full inline-block ${recommendationColor[consensus.recommendation]}`}>{consensus.recommendation}</p>
                </div>
                <div className="flex-grow">
                     <p className="text-content-100 mb-6">{consensus.summary}</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <h4 className="font-semibold text-white mb-2">Strengths</h4>
                            <ul className="space-y-2 text-sm">
                                {consensus.strengths.map((item, index) => <li key={index} className="flex items-start"><CheckIcon /><span>{item}</span></li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-2">Weaknesses</h4>
                             <ul className="space-y-2 text-sm">
                                {consensus.weaknesses.map((item, index) => <li key={index} className="flex items-start"><XIcon /><span>{item}</span></li>)}
                            </ul>
                        </div>
                     </div>
                </div>
            </div>
            <div className="mt-6 border-t border-base-300 pt-4">
                <h4 className="font-semibold text-white mb-2">Conflict Resolution & Justification</h4>
                <p className="text-sm text-content-200 italic">
                    {consensus.conflictResolution}
                </p>
            </div>
        </div>

        {/* Agent Grid */}
        <div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Specialized Agent Analyses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AgentCard report={technical} type={AgentType.TECHNICAL} />
                <AgentCard report={experience} type={AgentType.EXPERIENCE} />
                <AgentCard report={contextual} type={AgentType.CONTEXTUAL} />
                <AgentCard report={cultural} type={AgentType.CULTURAL} />
            </div>
        </div>
    </div>
  );
};

export default ResultsDisplay;
