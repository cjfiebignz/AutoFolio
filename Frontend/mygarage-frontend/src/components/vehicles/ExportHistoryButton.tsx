'use client';

import { useState } from 'react';
import { Download, Loader2, CheckCircle2, History, ChevronRight, FileDown, FileText } from 'lucide-react';
import { exportVehicleHistoryPdf, exportServiceHistoryPdf, exportWorkHistoryPdf } from '@/lib/api';

interface ExportHistoryButtonProps {
  vehicleId: string;
  vehicleNickname: string;
  variant?: 'minimal' | 'horizontal';
  type?: 'full' | 'service' | 'work';
}

export function ExportHistoryButton({ 
  vehicleId, 
  vehicleNickname, 
  variant = 'minimal',
  type = 'full'
}: ExportHistoryButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isExporting) return;

    setIsExporting(true);
    setError(null);
    setIsSuccess(false);

    try {
      let blob;
      let filename;
      const safeNickname = vehicleNickname.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      if (type === 'service') {
        blob = await exportServiceHistoryPdf(vehicleId);
        filename = `autofolio-${safeNickname}-service-history.pdf`;
      } else if (type === 'work') {
        blob = await exportWorkHistoryPdf(vehicleId);
        filename = `autofolio-${safeNickname}-work-log.pdf`;
      } else {
        blob = await exportVehicleHistoryPdf(vehicleId);
        filename = `autofolio-${safeNickname}-full-technical-portfolio.pdf`;
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Export failed');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const labels = {
    full: 'Portfolio',
    service: 'Service History',
    work: 'Work Log'
  };

  const icons = {
    full: <History size={14} />,
    service: <FileText size={14} />,
    work: <FileDown size={14} />
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`flex items-center gap-2 rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 border ${
          isSuccess 
            ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-500' 
            : error 
              ? 'bg-red-500/10 border-red-500/20 text-red-600'
              : 'border-border-subtle bg-card-overlay text-muted hover:border-border-strong hover:text-foreground'
        }`}
      >
        {isExporting ? (
          <Loader2 size={10} className="animate-spin" />
        ) : isSuccess ? (
          <CheckCircle2 size={10} />
        ) : (
          <Download size={10} />
        )}
        <span>{isExporting ? 'Preparing...' : isSuccess ? 'Downloaded' : `PDF ${labels[type]}`}</span>
      </button>
    );
  }

  return (
    <div className="w-full">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`group flex items-center justify-center gap-2.5 rounded-[24px] border py-3.5 w-full transition-all hover:bg-card-overlay-hover hover:shadow-premium active:scale-[0.97] disabled:opacity-50 ${
          isSuccess 
            ? 'border-green-500/30 bg-green-500/5' 
            : error
              ? 'border-red-500/30 bg-red-500/5'
              : 'border-border-subtle bg-card-overlay hover:border-border-strong'
        }`}
      >
        <div className={`shrink-0 transition-all ${
          isSuccess 
            ? 'text-green-600 dark:text-green-500' 
            : error 
              ? 'text-red-600' 
              : 'text-dim group-hover:text-foreground group-hover:scale-110'
        }`}>
          {isExporting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isSuccess ? (
            <CheckCircle2 size={18} strokeWidth={3} />
          ) : (
            <Download size={18} strokeWidth={2.5} />
          )}
        </div>
        
        <div className="min-w-0">
          <span className={`text-[9px] font-black uppercase tracking-[0.2em] block transition-colors ${
            isSuccess ? 'text-green-600 dark:text-green-500' : error ? 'text-red-600' : 'text-muted group-hover:text-foreground'
          }`}>
            {isExporting ? 'Processing Architecture...' : isSuccess ? 'Portfolio Exported' : `Export ${labels[type]}`}
          </span>
          {error && (
            <span className="text-[7px] font-bold text-red-500/60 uppercase mt-0.5 block">{error}</span>
          )}
        </div>
      </button>
    </div>
  );
}
