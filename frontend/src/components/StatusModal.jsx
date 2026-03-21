import React from 'react';
import { CheckCircle, X } from 'lucide-react';

const StatusModal = ({ 
  isOpen, 
  onClose, 
  title = "Success", 
  message, 
  buttonText = "OK" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
            <CheckCircle size={32} strokeWidth={3} />
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
          
          <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            {message}
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusModal;
