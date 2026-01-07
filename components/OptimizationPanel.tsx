
import React, { useState, useEffect } from 'react';

interface OptimizationPanelProps {
  reason: string | null;
  sources?: { title: string; uri: string }[];
  onDismiss: () => void;
}

const OptimizationPanel: React.FC<OptimizationPanelProps> = ({ reason, sources, onDismiss }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-expand when reason changes
  useEffect(() => {
    if (reason) setIsExpanded(true);
  }, [reason]);

  if (!reason) return null;

  return (
    <div className="bg-charcoal/95 backdrop-blur-xl border border-green-500/20 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ease-out origin-bottom mt-2">
      {/* Header - Always visible */}
      <div 
        className="flex items-center justify-between p-3 md:p-4 cursor-pointer hover:bg-white/5 border-b border-white/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></div>
          <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Optimization Active</span>
          {sources && sources.length > 0 && (
            <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
              {sources.length} Sources
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="text-[10px] uppercase font-bold text-gray-500 hover:text-white px-2 py-1"
          >
            Dismiss
          </button>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Collapsible Content */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 pt-2 bg-black/20">
          <div className="mb-4">
            <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Enhancement Strategy</h4>
            <p className="text-sm text-gray-300 leading-relaxed font-light">{reason}</p>
          </div>

          {sources && sources.length > 0 && (
            <div>
              <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Verified Grounding
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sources.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-green-500/30 transition-all"
                  >
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-green-400 transition-colors shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-200 font-medium truncate group-hover:text-green-300 transition-colors">{source.title}</p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        <span className="truncate">{new URL(source.uri).hostname}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptimizationPanel;
