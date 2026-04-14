'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WorkJobViewModel } from "@/lib/mappers/work";
import { 
  ChevronDown, Briefcase, Trash2, Plus, Edit3, Play, 
  CheckCircle2, RotateCcw, Calendar, Printer, FileDown, 
  Package, Tag, AlertCircle, X, Loader2
} from 'lucide-react';
import { deleteWorkJob, updateWorkJob, exportWorkJobPdf } from '@/lib/api';
import { WorkAttachmentsDisplay } from './WorkAttachmentsDisplay';
import { TabIntroBlurb } from '../ui/TabIntroBlurb';
import { LifetimeCostSummary } from "@/types/autofolio";
import { formatCurrency } from "@/lib/date-utils";
import { ExportHistoryButton } from './ExportHistoryButton';

export function VehicleWorkDisplay({ 
  vehicleId, 
  vehicleNickname,
  workItems,
  costSummary
}: { 
  vehicleId: string;
  vehicleNickname: string;
  workItems: WorkJobViewModel[];
  costSummary: LifetimeCostSummary | null;
}) {
  const displayCurrency = costSummary?.preferredCurrencyDisplay ?? 'AUD';
  const doneCost = costSummary?.totalDoneWorkCost ?? 0;
  const predictedCost = costSummary?.totalPredictedWorkCost ?? 0;

  return (
    <div className="space-y-12">
      {/* Tab Header & Action */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">Work Log</h2>
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400/50">Planned Repairs & Upgrades</p>
            <div className="h-1 w-1 rounded-full bg-white/10" />
            <ExportHistoryButton vehicleId={vehicleId} vehicleNickname={vehicleNickname} variant="minimal" type="work" />
          </div>
        </div>
        <Link 
          href={`/vehicles/${vehicleId}/work/new`}
          className="flex h-11 items-center justify-center gap-2.5 rounded-2xl bg-white px-6 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] shadow-xl"
        >
          <Plus size={14} strokeWidth={3} />
          Add Item
        </Link>
      </div>

      {/* Intro Blurb */}
      <TabIntroBlurb 
        tab="work" 
        title="Project Planner" 
        description="Track upcoming modifications, pending repairs, and future upgrades in your vehicle's technical pipeline." 
      />

      {/* Main Work Content */}
      <div className="space-y-4 sm:space-y-6">
        {workItems.length === 0 ? (
          <EmptyWorkState vehicleId={vehicleId} />
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {workItems.map((item) => (
              <WorkCard 
                key={item.id} 
                item={item} 
                vehicleId={vehicleId} 
                displayCurrency={displayCurrency}
              />
            ))}
          </div>
        )}
      </div>


      {/* Summary / Stats */}
      {workItems.length > 0 && (
        <div className="rounded-[40px] border border-white/5 bg-white/[0.01] p-12 text-center shadow-2xl backdrop-blur-md relative overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 mb-10">Project Progress</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-20">
            <StatItem label="Done Cost" value={formatCurrency(doneCost, displayCurrency)} />
            <div className="hidden sm:block w-px h-12 bg-white/5" />
            <StatItem label="Predicted Cost" value={formatCurrency(predictedCost, displayCurrency)} highlight="blue" />
          </div>
        </div>
      )}
    </div>
  );
}

function WorkCard({ 
  item, 
  vehicleId,
  displayCurrency
}: { 
  item: WorkJobViewModel, 
  vehicleId: string,
  displayCurrency: string
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const toggleExpand = () => setIsExpanded(!isExpanded);
  const contentId = `work-content-${item.id}`;

  const handleExportJobCard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExporting) return;

    setIsExporting(true);
    setErrorMessage(null);

    try {
      const blob = await exportWorkJobPdf(vehicleId, item.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.setAttribute('download', `job-card-${safeTitle}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to export job card');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdating || isPending || isDeleting) return;
    
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await deleteWorkJob(vehicleId, item.id);
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete record');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleStatusUpdate = async (e: React.MouseEvent, newStatus: 'planned' | 'in-progress' | 'done') => {
    e.stopPropagation();
    if (isUpdating || isPending || isDeleting) return;
    
    setIsUpdating(true);
    setErrorMessage(null);
    try {
      await updateWorkJob(vehicleId, item.id, { status: newStatus });
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const linkedPartsCount = item.parts?.length || 0;
  const linkedSpecsCount = item.specs?.length || 0;

  return (
    <div 
      className={`group relative overflow-hidden rounded-[32px] border transition-all duration-500 hover:shadow-2xl ${
        isExpanded 
          ? 'border-white/15 bg-white/[0.04] shadow-3xl ring-1 ring-white/10' 
          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
      } ${isDeleting || isUpdating ? 'opacity-50 grayscale pointer-events-none' : ''}`}
    >
      {/* Clickable Summary Area */}
      <button 
        type="button"
        onClick={toggleExpand}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className="w-full text-left p-5 sm:p-7 flex items-center justify-between gap-4 outline-none transition-colors group-focus-visible:bg-white/5"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Status Indicator / Icon */}
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-500 ${
            isExpanded 
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
              : 'bg-white/5 border-white/5 text-white/20 group-hover:text-white/40'
          }`}>
            <Briefcase size={18} strokeWidth={1.5} />
          </div>
          
          <div className="min-w-0 flex-1 space-y-1">
             <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1.5 pr-2">
                <h3 className={`text-[17px] font-black italic tracking-tight uppercase truncate transition-colors leading-tight ${
                  isExpanded ? 'text-white' : 'text-white/80 group-hover:text-white'
                }`}>
                  {item.title}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge status={item.status} />
                  {item.priority && <PriorityBadge priority={item.priority} />}
                </div>
             </div>
             <div className="flex items-center gap-3">
                {item.date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={10} className="text-white/20" />
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em]">{item.date}</p>
                  </div>
                )}
                {(linkedPartsCount > 0 || linkedSpecsCount > 0) && (
                  <>
                    <div className="h-1 w-1 rounded-full bg-white/10" />
                    <div className="flex items-center gap-2">
                      {linkedPartsCount > 0 && (
                        <span className="flex items-center gap-1 text-[8px] font-black uppercase text-white/20">
                          <Package size={8} /> {linkedPartsCount}
                        </span>
                      )}
                      {linkedSpecsCount > 0 && (
                        <span className="flex items-center gap-1 text-[8px] font-black uppercase text-white/20">
                          <Tag size={8} /> {linkedSpecsCount}
                        </span>
                      )}
                    </div>
                  </>
                )}
                <div className="h-1 w-1 rounded-full bg-white/10" />
                <div className="flex items-center gap-1.5">
                   <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em]">UUID: {item.id.substring(0, 8)}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-8 shrink-0">
          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/10 mb-0.5 sm:block hidden">
              {item.status === 'done' ? 'Final Cost' : 'Est. Cost'}
            </p>
            <p className={`text-base sm:text-xl font-black tracking-tighter leading-none transition-colors ${isExpanded ? 'text-blue-400' : 'text-white'}`}>
              {formatCurrency(item.rawEstimate || 0, displayCurrency)}
            </p>
          </div>
          
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/5 bg-white/5 text-white/20 transition-all duration-500 group-hover:border-white/10 group-hover:text-white/40 ${
            isExpanded ? 'rotate-180 bg-blue-500/10 border-blue-500/20 text-blue-400' : ''
          }`}>
            <ChevronDown size={14} strokeWidth={3} />
          </div>
        </div>
      </button>

      {/* Inline Error Feedback */}
      {errorMessage && (
        <div className="px-6 pb-2 sm:px-8 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-center justify-between gap-3 text-red-400">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} />
              <span className="text-[9px] font-bold uppercase tracking-widest">{errorMessage}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setErrorMessage(null); }} className="text-red-400/40 hover:text-red-400 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Expanded Details Area */}
      <div 
        id={contentId}
        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
        className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isExpanded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="px-6 pb-8 sm:px-8 sm:pb-10 space-y-10 border-t border-white/5 pt-8">
            {/* Detailed Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <DetailBox label="Work Status" value={item.status.replace('-', ' ')} highlight={item.status === 'done' ? 'green' : 'blue'} />
                <DetailBox label="Priority" value={item.priority} highlight={item.priority === 'high' ? 'white' : undefined} />
                <DetailBox label="Planned Date" value={item.date || 'TBC'} />
                <DetailBox label="Estimated Cost" value={formatCurrency(item.rawEstimate || 0, displayCurrency)} highlight="white" />
            </div>

            {/* Content & Actions Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-10">
                <div className="space-y-10">
                  {item.notes && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/15 ml-1">Job Description</p>
                      <div className="rounded-[28px] bg-white/[0.01] border border-white/5 p-7 relative overflow-hidden shadow-inner">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20" />
                        <p className="text-[13px] font-medium leading-relaxed text-white/60 italic">
                          “{item.notes}”
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Linked Parts Section */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/15 ml-1">Linked Parts</p>
                    {item.parts && item.parts.length > 0 ? (
                      <div className="grid gap-2">
                        {item.parts.map((part) => (
                          <div key={part.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.01] p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-blue-500/5 flex items-center justify-center border border-blue-500/10">
                                <Package size={14} className="text-blue-400/60" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-white/80 uppercase">{part.savedPart?.name || 'Unknown Part'}</p>
                                {part.savedPart?.partNumber && (
                                  <p className="text-[9px] font-mono text-white/20 mt-0.5">#{part.savedPart.partNumber}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-white/60">x{part.quantity}</p>
                              {part.lineTotalSnapshot !== null && (
                                <p className="text-[10px] font-bold text-white/20 mt-0.5">
                                  {formatCurrency(Number(part.lineTotalSnapshot), displayCurrency)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/5 bg-white/[0.01] p-6 text-center">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/10">No hardware linked</p>
                      </div>
                    )}
                  </div>

                  {/* Linked Specs Section */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/15 ml-1">Reference Specifications</p>
                    {item.specs && item.specs.length > 0 ? (
                      <div className="grid gap-2">
                        {item.specs.map((spec) => (
                          <div key={spec.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.01] p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-purple-500/5 flex items-center justify-center border border-purple-500/10">
                                <Tag size={14} className="text-purple-400/60" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{spec.customSpec?.group || 'Custom Spec'}</p>
                                <p className="text-xs font-black text-white/80 uppercase mt-0.5">{spec.customSpec?.label}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-blue-400 italic">
                                {spec.customSpec?.value} <span className="text-[10px] not-italic text-blue-400/40 ml-0.5">{spec.customSpec?.unit}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/5 bg-white/[0.01] p-6 text-center">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/10">No reference specs linked</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/15 ml-1">Attachments</p>
                    <WorkAttachmentsDisplay 
                      vehicleId={vehicleId} 
                      workJobId={item.id} 
                      attachments={item.attachments || []} 
                    />
                  </div>
                </div>

                {/* Sidebar Quick Actions */}
                <div className="space-y-6">
                  <div className="rounded-3xl bg-white/5 p-7 space-y-5 shadow-xl">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20">Work Management</p>
                      <div className="grid grid-cols-1 gap-3">
                        {/* Status Toggles */}
                        <div className="grid grid-cols-1 gap-2 pb-2">
                          {item.status === 'planned' && (
                            <button
                              onClick={(e) => handleStatusUpdate(e, 'in-progress')}
                              disabled={isUpdating || isPending}
                              className="flex h-11 items-center justify-center gap-3 rounded-xl bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                            >
                              {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                              Start Project
                            </button>
                          )}
                          {item.status === 'in-progress' && (
                            <button
                              onClick={(e) => handleStatusUpdate(e, 'done')}
                              disabled={isUpdating || isPending}
                              className="flex h-11 items-center justify-center gap-3 rounded-xl bg-green-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                            >
                              {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                              Mark Completed
                            </button>
                          )}
                          {item.status === 'done' && (
                            <button
                              onClick={(e) => handleStatusUpdate(e, 'in-progress')}
                              disabled={isUpdating || isPending}
                              className="flex h-11 items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 transition-all disabled:opacity-50"
                            >
                              {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                              Reopen Project
                            </button>
                          )}
                        </div>

                        <div className="h-px bg-white/5 my-1" />

                        <Link 
                          href={`/vehicles/${vehicleId}/work/${item.id}/edit`}
                          onClick={handleEdit}
                          className="flex h-11 items-center justify-center gap-3 rounded-xl bg-white text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.95] shadow-lg"
                        >
                          <Edit3 size={14} />
                          Edit Job
                        </Link>
                        
                        <button 
                          type="button"
                          onClick={handleDelete}
                          disabled={isPending || isDeleting || isUpdating}
                          className={`flex h-11 items-center justify-center gap-3 rounded-xl transition-all disabled:opacity-50 ${
                            confirmDelete 
                              ? 'bg-red-500 text-white animate-pulse' 
                              : 'bg-red-500/10 text-red-500/60 border border-red-500/10 hover:bg-red-500/20 hover:text-red-500'
                          } text-[10px] font-black uppercase tracking-widest`}
                        >
                          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          {confirmDelete ? 'Confirm Delete' : 'Delete'}
                        </button>
                        {confirmDelete && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                            className="text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 text-center"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                  </div>

                  {/* Export Staging */}
                  <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-7 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20">Documentation</p>
                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="group/btn relative">
                        <button 
                          disabled 
                          className="w-full flex h-10 items-center justify-center gap-2.5 rounded-xl border border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/20 cursor-not-allowed transition-all"
                        >
                          <Printer size={14} />
                          Print Job Card
                        </button>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity">
                          <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">Coming Soon</span>
                        </div>
                      </div>
                      <div className="group/btn relative">
                        <button 
                          onClick={handleExportJobCard}
                          disabled={isExporting || isUpdating || isDeleting || isPending}
                          className="w-full flex h-10 items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                        >
                          {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                          {isExporting ? 'Generating...' : 'Export PDF'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="px-7 py-5 rounded-3xl border border-white/5 flex items-center justify-between bg-white/[0.01]">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">UUID Reference</p>
                      <p className="text-[9px] font-mono text-white/10 uppercase tracking-tighter">{item.id.substring(0, 8)}</p>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'planned' | 'in-progress' | 'done' }) {
  const styles = {
    'planned': 'bg-white/5 text-white/40 ring-white/10',
    'in-progress': 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
    'done': 'bg-green-500/10 text-green-400 ring-green-500/20'
  };
  
  return (
    <span className={`rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.1em] ring-1 ring-inset ${styles[status]}`}>
      {status.replace('-', ' ')}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: 'low' | 'medium' | 'high' }) {
  const styles = {
    'low': 'text-white/20',
    'medium': 'text-yellow-500/60',
    'high': 'text-red-500/60'
  };

  return (
    <div className={`flex items-center gap-2 text-[7px] font-black uppercase tracking-[0.15em] ${styles[priority]}`}>
      <div className={`h-1 w-1 rounded-full ${priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : priority === 'medium' ? 'bg-yellow-500' : 'bg-white/20'}`} />
      {priority}
    </div>
  );
}

function DetailBox({ label, value, highlight }: { label: string; value: string; highlight?: 'blue' | 'green' | 'white' }) {
  const highlightStyles = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    white: 'text-white'
  };

  return (
    <div className="rounded-2xl bg-white/[0.01] border border-white/5 p-5 space-y-2 flex flex-col justify-center min-h-[80px]">
       <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/15 leading-none">{label}</p>
       <p className={`text-sm font-black italic tracking-tight uppercase truncate leading-tight ${highlight ? highlightStyles[highlight] : 'text-white/60'}`}>
         {value}
       </p>
    </div>
  );
}

function EmptyWorkState({ vehicleId }: { vehicleId: string }) {
  return (
    <div className="group relative flex flex-col items-center justify-center rounded-[40px] border border-dashed border-white/10 bg-white/[0.01] py-32 text-center transition-all hover:bg-white/[0.02]">
      <div className="mb-8 relative">
        <div className="absolute -inset-4 rounded-full bg-white/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[32px] border border-white/10 bg-white/5 text-white/10 group-hover:text-white/30 transition-colors shadow-2xl">
          <Briefcase size={40} strokeWidth={1} />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white/60 uppercase italic tracking-tight">No work items found</h3>
      <p className="mx-auto mt-2 max-w-[240px] text-sm font-medium leading-relaxed text-white/20 mb-10">
        Plan your next upgrade, track pending repairs, or record custom technical jobs.
      </p>
      <Link 
        href={`/vehicles/${vehicleId}/work/new`}
        className="flex h-14 items-center justify-center rounded-2xl bg-white px-10 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] shadow-2xl"
      >
        Add First Item
      </Link>
    </div>
  );
}

function StatItem({ label, value, highlight }: { label: string; value: string; highlight?: 'blue' }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 leading-none">{label}</p>
      <p className={`text-3xl font-black italic tracking-tighter leading-none ${highlight === 'blue' ? 'text-blue-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
