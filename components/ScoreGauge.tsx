
import React from 'react';

interface ScoreGaugeProps {
  score: number;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const sqSize = 40;
  const strokeWidth = 5;
  const radius = (sqSize - strokeWidth) / 2;
  const viewBox = `0 0 ${sqSize} ${sqSize}`;
  const dashArray = radius * Math.PI * 2;
  const dashOffset = dashArray - (dashArray * score) / 100;

  let colorClass = 'text-green-500';
  if (score < 50) {
    colorClass = 'text-red-500';
  } else if (score < 75) {
    colorClass = 'text-yellow-500';
  }

  return (
    <div className="relative">
      <svg
        width={sqSize}
        height={sqSize}
        viewBox={viewBox}
        className="transform -rotate-90"
      >
        <circle
          className="text-base-300"
          cx={sqSize / 2}
          cy={sqSize / 2}
          r={radius}
          strokeWidth={`${strokeWidth}px`}
          stroke="currentColor"
          fill="transparent"
        />
        <circle
          className={`${colorClass} transition-all duration-500`}
          cx={sqSize / 2}
          cy={sqSize / 2}
          r={radius}
          strokeWidth={`${strokeWidth}px`}
          stroke="currentColor"
          fill="transparent"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${colorClass}`}>
        {score}
      </span>
    </div>
  );
};

export default ScoreGauge;
