
import React, { useEffect, useState } from 'react';

export type ToastType = 'error' | 'success' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to allow animation entry
    const enterTimer = setTimeout(() => setIsVisible(true), 10);
    
    const exitTimer = setTimeout(() => {
      setIsVisible(false);
      // Wait for exit animation to finish before unmounting
      setTimeout(onClose, 300);
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [duration, onClose]);

  const bgColors = {
    error: 'bg-red-900/90 border-red-500',
    success: 'bg-green-900/90 border-green-500',
    info: 'bg-blue-900/90 border-blue-500'
  };

  const icons = {
    error: (
      <svg className="w-5 h-5 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  return (
    <div 
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-6 py-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'} ${bgColors[type]} min-w-[300px] max-w-md`}
    >
      <div className="shrink-0">{icons[type]}</div>
      <p className="text-sm font-medium text-white flex-1">{message}</p>
      <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className="text-white/50 hover:text-white transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
