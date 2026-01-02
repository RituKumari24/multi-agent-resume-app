
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center my-12 text-center">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-brand-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-t-4 border-brand-primary rounded-full animate-spin"></div>
      </div>
      <h3 className="text-xl font-semibold mt-6 tracking-wider text-white">Engaging AI Agents...</h3>
      <p className="text-content-200 mt-2 max-w-sm">
        Specialized agents are now evaluating the resume. This may take a moment.
      </p>
    </div>
  );
};

export default Loader;
