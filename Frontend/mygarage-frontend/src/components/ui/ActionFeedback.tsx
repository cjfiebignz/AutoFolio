'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface InlineErrorMessageProps {
  message: string | null;
  onClear: () => void;
  className?: string;
}

export function InlineErrorMessage({ message, onClear, className = "" }: InlineErrorMessageProps) {
  if (!message) return null;

  return (
    <div className={`animate-in fade-in slide-in-from-top-1 duration-300 ${className}`}>
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-center justify-between gap-3 text-red-400">
        <div className="flex items-center gap-2">
          <AlertCircle size={14} />
          <span className="text-[9px] font-bold uppercase tracking-widest leading-none">{message}</span>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }} 
          className="text-red-400/40 hover:text-red-400 transition-colors"
          type="button"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
