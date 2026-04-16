'use client';

import { useState, useEffect } from 'react';
import { Download, Loader2, CheckCircle2, FileArchive, AlertCircle } from 'lucide-react';
import { 
  exportVehicleHistory, 
  exportServiceHistory, 
  exportWorkHistory, 
  exportDocumentsZip 
} from '@/lib/api';
import { usePlan } from '@/lib/plan-context';

type ExportType = 'full' | 'service' | 'work' | 'documents';

interface ExportHistoryButtonProps {
  vehicleId: string;
  vehicleNickname: string;
  variant?: 'action' | 'minimal' | 'horizontal';
  type?: ExportType;
}

export function ExportHistoryButton({ 
  vehicleId, 
  vehicleNickname,
  variant = 'action',
  type = 'full'
}: ExportHistoryButtonProps) {
  const { plan, triggerUpgrade } = usePlan();
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (showSuccess || errorMessage) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setErrorMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, errorMessage]);

  const handleExport = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Gating check: use direct capability flags from backend limits
    const isAllowed = type === 'documents' ? plan?.canExportZip : plan?.canExportPdf;
    
    if (!isAllowed) {
      triggerUpgrade(type === 'documents' ? 'export_zip' : 'export_pdf');
      return;
    }

    if (isExporting) return;

    setIsExporting(true);
    setErrorMessage(null);
    try {
      let blob: Blob;
      let filename: string;
      
      const safeName = vehicleNickname
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      switch (type) {
        case 'service':
          blob = await exportServiceHistory(vehicleId);
          filename = `autofolio-${safeName || 'vehicle'}-service-report.pdf`;
          break;
        case 'work':
          blob = await exportWorkHistory(vehicleId);
          filename = `autofolio-${safeName || 'vehicle'}-work-report.pdf`;
          break;
        case 'documents':
          blob = await exportDocumentsZip(vehicleId);
          filename = `autofolio-${safeName || 'vehicle'}-documents.zip`;
          break;
        default:
          blob = await exportVehicleHistory(vehicleId);
          filename = `autofolio-${safeName || 'vehicle'}-report.pdf`;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setShowSuccess(true);
    } catch (err: any) {
      if (err.type === 'export_pdf' || err.type === 'export_zip') {
        setErrorMessage("This feature is available on Pro. Upgrade to continue.");
      } else if (err.type === 'documents_empty') {
        setErrorMessage("No documents available to download.");
      } else {
        setErrorMessage("Failed to download export.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const labels = {
    full: { main: 'Download Vehicle Report', loading: 'Preparing your report...', success: 'Vehicle report downloaded' },
    service: { main: 'Download Service Report', loading: 'Preparing service report...', success: 'Service report downloaded' },
    work: { main: 'Download Work Report', loading: 'Preparing work report...', success: 'Work report downloaded' },
    documents: { main: 'Download All Documents', loading: 'Preparing document bundle...', success: 'Document bundle downloaded' }
  };


  const activeLabel = labels[type];

  if (variant === 'minimal') {
    const getCompactLabel = () => {
      if (isExporting) return 'Preparing...';
      if (showSuccess) return 'Downloaded';
      if (errorMessage) {
        if (errorMessage.includes('Pro')) return 'Pro Feature';
        if (errorMessage.includes('No documents')) return 'No Files';
        return 'Error';
      }
      return activeLabel.main.replace('Download ', '');
    };

    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          title={errorMessage || showSuccess ? activeLabel.success : activeLabel.main}
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors disabled:opacity-50 ${errorMessage ? 'text-red-400' : 'text-blue-400/60 hover:text-blue-400'}`}
        >
          {isExporting ? <Loader2 size={12} className="animate-spin" /> : (type === 'documents' ? <FileArchive size={12} /> : <Download size={12} />)}
          {getCompactLabel()}
        </button>
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className={`group flex h-14 w-full items-center justify-center gap-3 rounded-2xl border transition-all active:scale-[0.98] disabled:opacity-50 ${
          showSuccess ? 'border-green-500/20 bg-green-500/5 text-green-400' : 
          errorMessage ? 'border-red-500/20 bg-red-500/5 text-red-400' : 
          'border-white/10 bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white'
        }`}
      >
        {isExporting ? <Loader2 size={16} className="animate-spin" /> : 
         showSuccess ? <CheckCircle2 size={16} /> : 
         errorMessage ? <AlertCircle size={16} /> :
         (type === 'documents' ? <FileArchive size={16} /> : <Download size={16} />)}
        <span className="text-[10px] font-black uppercase tracking-widest">
          {isExporting ? 'Preparing...' : showSuccess ? 'Downloaded' : errorMessage ? 'Failed' : activeLabel.main.replace('Download ', '')}
        </span>
      </button>
    );
  }

  return (
    <div className="relative group w-full">
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className={`group flex flex-col items-center justify-center gap-3 rounded-[24px] border py-6 w-full transition-all hover:bg-white/[0.06] hover:shadow-xl active:scale-[0.97] disabled:opacity-50 ${
          showSuccess ? 'border-green-500/20 bg-green-500/5' : 
          errorMessage ? 'border-red-500/20 bg-red-500/5' : 
          'border-white/5 bg-white/[0.02] hover:border-white/10'
        }`}
      >
        <div className={`transition-all ${
          isExporting ? 'text-blue-400' : 
          showSuccess ? 'text-green-400' : 
          errorMessage ? 'text-red-400' :
          'text-white/30 group-hover:text-white group-hover:scale-110'
        }`}>
          {isExporting ? <Loader2 size={20} className="animate-spin" /> : 
           showSuccess ? <CheckCircle2 size={20} strokeWidth={2.5} /> : 
           errorMessage ? <AlertCircle size={20} strokeWidth={2.5} /> :
           (type === 'documents' ? <FileArchive size={20} strokeWidth={2.5} /> : <Download size={20} strokeWidth={2.5} />)}
        </div>
        <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors text-center px-2 ${
          showSuccess ? 'text-green-400/80' : 
          errorMessage ? 'text-red-400/80' :
          'text-white/40 group-hover:text-white'
        }`}>
          {isExporting ? activeLabel.loading : showSuccess ? activeLabel.success : errorMessage ? errorMessage : activeLabel.main}
        </span>
      </button>
    </div>
  );
}
