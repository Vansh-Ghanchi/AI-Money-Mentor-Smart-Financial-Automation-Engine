import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ isOpen, message = "Processing..." }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="font-medium text-slate-600 dark:text-slate-300">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
