import React from 'react';
import type { AgentReport } from '../types';
import ScoreGauge from './ScoreGauge';

interface AgentCardProps {
  report: AgentReport;
  type: string;
}

const AgentCard: React.FC<AgentCardProps> = ({ report, type }) => {
  const { score, summary, details, prediction } = report;

  const DetailList = ({ title, items, icon }: { title: string; items?: string[]; icon: React.ReactNode }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mt-3">
        <h4 className="text-xs font-semibold text-content-200 flex items-center">{icon}{title}</h4>
        <ul className="list-disc list-inside pl-2 mt-1 space-y-1 text-xs text-content-100">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  const PositiveIcon = <svg className="h-3.5 w-3.5 mr-1.5 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
  const NegativeIcon = <svg className="h-3.5 w-3.5 mr-1.5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
  const ObservationIcon = <svg className="h-3.5 w-3.5 mr-1.5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


  return (
    <div className="bg-base-200 p-4 rounded-lg shadow-lg border border-base-300 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white pr-2">{type}</h3>
        <ScoreGauge score={score} />
      </div>
      <p className="text-sm text-content-200 mt-3 flex-grow">{summary}</p>

      {prediction && (
        <div className="mt-4 border-t border-base-300 pt-3 text-xs space-y-2">
            <div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-content-200">Retention Risk:</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full ${
                        prediction.retentionRisk === 'Low' ? 'bg-green-500/20 text-green-400' :
                        prediction.retentionRisk === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                    }`}>
                        {prediction.retentionRisk}
                    </span>
                </div>
            </div>
             <div>
                <p className="text-content-100"><span className="font-semibold text-content-200">Performance Forecast:</span> {prediction.performanceForecast}</p>
            </div>
        </div>
      )}
      
      {details && (
        <div className={`mt-4 ${!prediction ? 'border-t border-base-300 pt-3' : ''}`}>
            <DetailList title="Positives" items={details.positive} icon={PositiveIcon} />
            <DetailList title="Gaps" items={details.negative} icon={NegativeIcon} />
            <DetailList title="Observations" items={details.observations} icon={ObservationIcon} />
        </div>
      )}
    </div>
  );
};

export default AgentCard;
