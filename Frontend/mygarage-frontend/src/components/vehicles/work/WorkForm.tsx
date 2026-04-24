'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createWorkJob, updateWorkJob, CreateWorkJobData, getUserVehicleWithSpecs } from '@/lib/api';
import { FormInput, FormSection, FormSelect, FormTextArea } from '@/components/ui/FormComponents';
import { Briefcase, Calendar, Tag, Paperclip, Package, Plus, X, Search, ChevronDown, AlertCircle } from 'lucide-react';
import { WorkAttachmentsDisplay } from '../WorkAttachmentsDisplay';
import { SavedPart, UserVehicleCustomSpec } from '@/types/autofolio';

interface WorkFormProps {
  vehicleId: string;
  initialData?: any;
  workJobId?: string;
}

export function WorkForm({ vehicleId, initialData, workJobId }: WorkFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Available data for linking
  const [availableParts, setAvailableParts] = useState<SavedPart[]>([]);
  const [availableSpecs, setAvailableSpecs] = useState<UserVehicleCustomSpec[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  // Selected items state
  const [selectedParts, setSelectedParts] = useState<{ savedPartId: string; quantity: number; name?: string; partNumber?: string }[]>([]);
  const [selectedSpecIds, setSelectedSpecIds] = useState<string[]>([]);

  // Search/Filter state
  const [partSearch, setPartSearch] = useState('');
  const [specSearch, setSpecSearch] = useState('');

  // Prevent duplicate fetches on mount
  const lastFetchedVehicleId = useRef<string | null>(null);

  useEffect(() => {
    async function loadMetadata() {
      if (lastFetchedVehicleId.current === vehicleId) return;
      
      try {
        const { vehicle } = await getUserVehicleWithSpecs(vehicleId);
        setAvailableParts(vehicle.savedParts || []);
        setAvailableSpecs(vehicle.customSpecs || []);
        lastFetchedVehicleId.current = vehicleId;
      } catch (err) {
        console.error('Failed to load vehicle metadata for linking:', err);
      } finally {
        setIsLoadingMetadata(false);
      }
    }
    loadMetadata();
  }, [vehicleId]);

  useEffect(() => {
    if (initialData) {
      if (initialData.parts) {
        setSelectedParts(initialData.parts.map((p: any) => ({
          savedPartId: p.savedPartId,
          quantity: p.quantity,
          name: p.savedPart?.name,
          partNumber: p.savedPart?.partNumber
        })));
      }
      if (initialData.specs) {
        setSelectedSpecIds(initialData.specs.map((s: any) => s.customSpecId));
      }
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const data: CreateWorkJobData = {
      title: formData.get('title') as string,
      status: formData.get('status') as 'planned' | 'in-progress' | 'done',
      priority: formData.get('priority') as 'low' | 'medium' | 'high',
      date: formData.get('date') ? new Date(formData.get('date') as string).toISOString() : undefined,
      notes: (formData.get('notes') as string) || undefined,
      estimate: formData.get('estimate') ? Number(formData.get('estimate')) : undefined,
      parts: selectedParts.map(p => ({ savedPartId: p.savedPartId, quantity: p.quantity })),
      specs: selectedSpecIds.map(id => ({ customSpecId: id })),
    };

    try {
      if (workJobId) {
        await updateWorkJob(vehicleId, workJobId, data);
      } else {
        await createWorkJob(vehicleId, data);
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      router.push(`/vehicles/${vehicleId}?tab=work`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save record');
      setIsSubmitting(false);
    }
  };

  const addPart = (part: SavedPart) => {
    if (selectedParts.some(p => p.savedPartId === part.id)) return;
    setSelectedParts([...selectedParts, { 
      savedPartId: part.id, 
      quantity: part.defaultQuantity, 
      name: part.name,
      partNumber: part.partNumber || undefined
    }]);
    setPartSearch('');
  };

  const removePart = (id: string) => {
    setSelectedParts(selectedParts.filter(p => p.savedPartId !== id));
  };

  const updatePartQty = (id: string, qty: number) => {
    setSelectedParts(selectedParts.map(p => 
      p.savedPartId === id ? { ...p, quantity: Math.max(1, qty) } : p
    ));
  };

  const toggleSpec = (specId: string) => {
    setSelectedSpecIds(prev => 
      prev.includes(specId) 
        ? prev.filter(id => id !== specId) 
        : [...prev, specId]
    );
  };

  const formattedDate = initialData?.date 
    ? new Date(initialData.date).toISOString().split('T')[0] 
    : '';

  const filteredParts = availableParts.filter(p => 
    !selectedParts.some(sp => sp.savedPartId === p.id) &&
    (p.name.toLowerCase().includes(partSearch.toLowerCase()) || 
     p.partNumber?.toLowerCase().includes(partSearch.toLowerCase()))
  ).slice(0, 5);

  const filteredSpecs = availableSpecs.filter(s => 
    (s.label.toLowerCase().includes(specSearch.toLowerCase()) || 
     s.group.toLowerCase().includes(specSearch.toLowerCase()))
  );

  return (
    <form onSubmit={handleSubmit} method="POST" className="space-y-10 pb-12">
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-400">
          {error}
        </div>
      )}

      {/* Job Identity */}
      <FormSection title="Job Details" icon={<Briefcase size={14} />}>
        <FormInput 
          name="title" 
          label="Job Title" 
          placeholder="e.g. Replace Brake Pads" 
          required 
          defaultValue={initialData?.title}
          disabled={isSubmitting} 
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormSelect 
            name="status" 
            label="Status" 
            disabled={isSubmitting}
            options={[
              { value: 'planned', label: 'Planned' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'done', label: 'Done' }
            ]} 
            defaultValue={initialData?.status || 'planned'}
          />
          <FormSelect 
            name="priority" 
            label="Priority" 
            disabled={isSubmitting}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }
            ]} 
            defaultValue={initialData?.priority || 'medium'}
          />
        </div>
      </FormSection>

      {/* Logistics */}
      <FormSection title="Logistics" icon={<Calendar size={14} />}>
        <div className="grid grid-cols-2 gap-4">
          <FormInput 
            name="date" 
            label="Target Date" 
            type="date" 
            defaultValue={formattedDate}
            disabled={isSubmitting} 
          />
          <FormInput 
            name="estimate" 
            label="Estimated Cost" 
            placeholder="0.00" 
            type="number" 
            step="0.01" 
            defaultValue={initialData?.estimate}
            prefix="$" 
            disabled={isSubmitting} 
          />
        </div>
      </FormSection>

      {/* Linked Hardware */}
      <FormSection title="Linked Hardware" icon={<Package size={14} />}>
        <div className="space-y-4">
          {/* Selected Parts */}
          <div className="grid gap-2">
            {selectedParts.map(part => (
              <div key={part.savedPartId} className="flex items-center justify-between rounded-2xl border border-border-subtle bg-card-overlay p-3 pl-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-foreground opacity-80 uppercase italic truncate">{part.name}</p>
                  {part.partNumber && <p className="text-[9px] font-mono text-dim">#{part.partNumber}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 bg-foreground/5 rounded-xl p-1 px-2 border border-border-subtle">
                    <button type="button" onClick={() => updatePartQty(part.savedPartId, part.quantity - 1)} className="text-muted hover:text-foreground transition-colors">
                      <X size={10} strokeWidth={3} />
                    </button>
                    <span className="text-[10px] font-black text-foreground w-4 text-center">{part.quantity}</span>
                    <button type="button" onClick={() => updatePartQty(part.savedPartId, part.quantity + 1)} className="text-muted hover:text-foreground transition-colors">
                      <Plus size={10} strokeWidth={3} />
                    </button>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removePart(part.savedPartId)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-red-500/40 hover:bg-red-500/10 hover:text-red-500 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Search/Add Part */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dim" size={14} />
              <input 
                placeholder="Link parts from collection..." 
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
                className="h-12 w-full rounded-2xl bg-foreground/5 pl-11 pr-4 text-xs font-bold text-foreground placeholder:text-dim focus:outline-none focus:ring-1 focus:ring-border-strong"
              />
            </div>
            {partSearch && (
              <div className="absolute top-full left-0 right-0 mt-2 z-10 rounded-2xl border border-border-strong bg-surface p-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
                {filteredParts.length > 0 ? filteredParts.map(part => (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => addPart(part)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-foreground/5 text-left transition-all"
                  >
                    <div>
                      <p className="text-[11px] font-bold text-foreground uppercase italic">{part.name}</p>
                      <p className="text-[9px] text-muted uppercase tracking-widest">{part.category}</p>
                    </div>
                    <Plus size={12} className="text-blue-500" />
                  </button>
                )) : (
                  <div className="p-4 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-dim">No parts found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </FormSection>

      {/* Linked Specifications */}
      <FormSection title="Reference Specs" icon={<Tag size={14} />}>
        <div className="space-y-4">
          {/* Search Specs */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dim" size={14} />
            <input 
              placeholder="Search specifications..." 
              value={specSearch}
              onChange={(e) => setSpecSearch(e.target.value)}
              className="h-12 w-full rounded-2xl bg-foreground/5 pl-11 pr-4 text-xs font-bold text-foreground placeholder:text-dim focus:outline-none focus:ring-1 focus:ring-border-strong"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedSpecIds.map(id => {
              const spec = availableSpecs.find(s => s.id === id);
              if (!spec) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleSpec(id)}
                  className="flex items-center gap-2 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all"
                >
                  {spec.label}: {spec.value} {spec.unit}
                  <X size={10} strokeWidth={3} />
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
            {filteredSpecs.length > 0 ? filteredSpecs.map(spec => {
              const isSelected = selectedSpecIds.includes(spec.id);
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => toggleSpec(spec.id)}
                  className={`flex flex-col items-start p-3 rounded-2xl border transition-all text-left ${
                    isSelected 
                      ? 'bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/20' 
                      : 'bg-foreground/[0.01] border-border-subtle hover:border-border-strong hover:bg-foreground/[0.03]'
                  }`}
                >
                  <span className="text-[8px] font-black text-dim uppercase tracking-[0.2em]">{spec.group}</span>
                  <span className="text-[10px] font-bold text-foreground opacity-80 mt-0.5">{spec.label}</span>
                  <span className="text-xs font-black text-blue-500 dark:text-blue-400 mt-1 italic">{spec.value} {spec.unit}</span>
                </button>
              )
            }) : (
              <div className="col-span-full py-10 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-dim">
                  {specSearch ? 'No matching specs found' : 'No custom specs found'}
                </p>
              </div>
            )}
          </div>
        </div>
      </FormSection>

      {/* Notes */}
      <FormSection title="Notes & Description" icon={<Tag size={14} />}>
        <FormTextArea 
          name="notes"
          label="Additional Notes"
          rows={4}
          defaultValue={initialData?.notes}
          disabled={isSubmitting}
          placeholder="Details about parts needed, specific issues, or instructions..."
        />
      </FormSection>

      {/* Attachments Section */}
      <FormSection title="Work Attachments" icon={<Paperclip size={14} />}>
        {workJobId ? (
          <div className="-mt-4">
            <WorkAttachmentsDisplay 
              vehicleId={vehicleId} 
              workJobId={workJobId} 
              attachments={initialData?.attachments || []} 
            />
          </div>
        ) : (
          <div className="group relative flex flex-col items-center justify-center rounded-[32px] border border-dashed border-border-subtle bg-foreground/[0.01] py-12 text-center transition-all hover:bg-foreground/[0.02] hover:border-border-strong">
            <div className="mb-4 relative">
              <div className="absolute -inset-4 rounded-full bg-foreground/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border-subtle bg-card-overlay text-muted group-hover:text-foreground transition-colors">
                <Paperclip size={24} strokeWidth={1.5} />
              </div>
            </div>
            <div className="space-y-2 px-6">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted">Reference Material</p>
              <p className="mx-auto max-w-[280px] text-[11px] font-medium leading-relaxed text-dim">
                You can attach parts lists, technical diagrams, and quotes once this work record is initially saved.
              </p>
            </div>
            
            <div className="mt-8 flex items-center gap-2 rounded-full bg-foreground/5 px-4 py-2 border border-border-subtle">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-dim">Save to unlock uploads</span>
            </div>
          </div>
        )}
      </FormSection>

      {/* Form Actions */}
      <footer className="grid grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
        <Link 
          href={`/vehicles/${vehicleId}?tab=work`}
          className={`flex h-14 items-center justify-center rounded-2xl border border-border-subtle bg-card-overlay text-sm font-bold text-foreground transition-all hover:bg-card-overlay-hover active:scale-[0.98] ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
        >
          Cancel
        </Link>
        <button 
          type="submit"
          disabled={isSubmitting}
          className="relative flex h-14 items-center justify-center overflow-hidden rounded-2xl bg-foreground text-sm font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : (workJobId ? "Save Changes" : "Save Job")}
        </button>
      </footer>
    </form>
  );
}
