
import React from 'react';

interface DeleteModalProps {
  isOpen: boolean;
  type: 'single' | 'selected' | 'all';
  count?: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, type, count, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 md:p-8 max-w-sm w-full mx-4 shadow-2xl transform transition-all scale-100">
        <h3 className="text-xl font-bold text-white mb-2">Confirm Deletion</h3>
        <p className="text-gray-400 text-sm mb-6">
          {type === 'all' 
            ? "This will permanently delete ALL generated images. This action cannot be undone."
            : type === 'selected'
              ? `Are you sure you want to delete ${count} selected images?`
              : "Are you sure you want to delete this image?"
          }
        </p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all"
          >
            Delete {type === 'all' ? 'All' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
