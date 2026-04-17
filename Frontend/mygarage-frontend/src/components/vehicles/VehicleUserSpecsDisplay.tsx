'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { UserVehicleCustomSpec } from '@/types/autofolio';
import { createCustomSpec, updateCustomSpec, deleteCustomSpec } from '@/lib/api';
import { Plus, Trash2, Edit3, Save, X, Settings2, Loader2, ChevronDown, FileText, Printer, FileDown, Check, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { VehicleViewModel } from '@/lib/mappers/vehicle';
import { usePreferences } from '@/lib/preferences';
import { usePlan } from '@/lib/plan-context';
import { ImportSpecsModal } from './ImportSpecsModal';

interface VehicleUserSpecsDisplayProps {
  vehicleId: string;
  customSpecs: UserVehicleCustomSpec[];
  vehicle: VehicleViewModel;
  currentKms?: number | null;
}

const SPEC_CATEGORIES = [
  'Engine',
  'Oil & Fluids',
  'Transmission',
  'Fuel',
  'Cooling',
  'Torque',
  'Wheels & Tyres',
  'Suspension',
  'Brakes',
  'Electrical',
  'Dimensions',
  'General'
];

const CATEGORY_LABELS: Record<string, string[]> = {
  'Engine': ['Displacement', 'Compression Ratio', 'Bore', 'Stroke', 'Redline', 'Engine Code', 'Configuration', 'Valvetrain'],
  'Oil & Fluids': ['Engine Oil Capacity', 'Recommended Oil Grade', 'Coolant Capacity', 'Brake Fluid Type', 'Power Steering Fluid', 'Differential Fluid', 'Transfer Case Fluid'],
  'Transmission': ['Transmission Type', 'Gear Oil Capacity', 'ATF Type', 'Final Drive Ratio', 'Clutch Type'],
  'Fuel': ['Fuel Type', 'Fuel Tank Capacity', 'Injector Size', 'Base Fuel Pressure', 'Octane Rating'],
  'Cooling': ['Thermostat Temp', 'Radiator Capacity', 'Coolant Mix', 'Fan Switch Temp'],
  'Torque': ['Wheel Nut Torque', 'Spark Plug Torque', 'Head Bolt Torque', 'Drain Plug Torque', 'Main Bearing Torque', 'Rod Bearing Torque'],
  'Wheels & Tyres': ['Wheel Size', 'Tyre Size', 'Offset', 'PCD', 'Centre Bore', 'Recommended Pressure', 'Speed Rating', 'Load Index'],
  'Suspension': ['Front Spring Rate', 'Rear Spring Rate', 'Ride Height', 'Damper Setting', 'Alignment Spec', 'Anti-Roll Bar Size'],
  'Brakes': ['Front Rotor Size', 'Rear Rotor Size', 'Pad Type', 'Brake Bias', 'Master Cylinder Bore'],
  'Electrical': ['Battery Size', 'Alternator Output', 'Spark Plug Gap', 'Firing Order', 'ECU Type'],
  'Dimensions': ['Wheelbase', 'Length', 'Width', 'Height', 'Kerb Weight', 'Ground Clearance', 'Turning Circle'],
  'General': ['Build Code', 'Trim', 'Market', 'Notes', 'Production Date', 'Color Code']
};

const COMMON_UNITS = [
  'L', 'mL', 'psi', 'bar', 'Nm', 'lb-ft', 'mm', 'in', 'kg', 'lb', '°C', 'ratio', 'none'
];

export function VehicleUserSpecsDisplay({ 
  vehicleId, 
  customSpecs,
  vehicle,
  currentKms
}: VehicleUserSpecsDisplayProps) {
  const router = useRouter();
  const { plan, triggerUpgrade } = usePlan();
  const [, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isRefListOpen, setIsRefListOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Feedback states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // Track expanded categories - collapsed by default
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Persistence: Load on mount
  useEffect(() => {
    const key = `autofolio_specs_expanded_${vehicleId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setExpandedCategories(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse expanded categories', e);
      }
    }
    setIsLoaded(true);
  }, [vehicleId]);

  // Persistence: Save on change
  useEffect(() => {
    if (!isLoaded) return;
    const key = `autofolio_specs_expanded_${vehicleId}`;
    localStorage.setItem(key, JSON.stringify(expandedCategories));
  }, [expandedCategories, vehicleId, isLoaded]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  // Form State for Adding
  const [formData, setFormData] = useState({
    group: SPEC_CATEGORIES[0],
    label: '',
    value: '',
    unit: '',
    notes: ''
  });
  const [customLabel, setCustomLabel] = useState('');
  const [customUnit, setCustomUnit] = useState('');

  // Form State for Editing
  const [editFormData, setEditFormData] = useState({
    group: '',
    label: '',
    value: '',
    unit: '',
    notes: ''
  });
  const [editCustomLabel, setEditCustomLabel] = useState('');
  const [editCustomUnit, setEditCustomUnit] = useState('');

  // Sync custom inputs when label/unit dropdowns change
  const isLabelCustom = formData.label === 'Custom...';
  const isUnitCustom = formData.unit === 'Custom...';

  const isEditLabelCustom = editFormData.label === 'Custom...';
  const isEditUnitCustom = editFormData.unit === 'Custom...';

  // Group specs by category
  const groupedSpecs = useMemo(() => {
    const groups: Record<string, UserVehicleCustomSpec[]> = {};
    customSpecs.forEach(spec => {
      if (!groups[spec.group]) groups[spec.group] = [];
      groups[spec.group].push(spec);
    });
    return groups;
  }, [customSpecs]);

  const selectedSpecs = useMemo(() => {
    return customSpecs.filter(s => selectedIds.includes(s.id));
  }, [customSpecs, selectedIds]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalLabel = isLabelCustom ? customLabel : formData.label;
    const finalUnit = isUnitCustom ? customUnit : (formData.unit === 'none' ? '' : formData.unit);
    
    if (!finalLabel || !formData.value) return;

    setLoadingId('adding');
    setErrorMessage(null);
    try {
      await createCustomSpec(vehicleId, {
        ...formData,
        label: finalLabel,
        unit: finalUnit
      });
      setFormData({ group: SPEC_CATEGORIES[0], label: '', value: '', unit: '', notes: '' });
      setCustomLabel('');
      setCustomUnit('');
      setIsAdding(false);
      setSuccessMessage('Spec added successfully');
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add spec');
    } finally {
      setLoadingId(null);
    }
  };

  const handleEditInit = (spec: UserVehicleCustomSpec) => {
    const isStandardLabel = CATEGORY_LABELS[spec.group]?.includes(spec.label);
    const isStandardUnit = COMMON_UNITS.includes(spec.unit || '');
    
    setEditingId(spec.id);
    setEditFormData({
      group: spec.group,
      label: isStandardLabel ? spec.label : (spec.label ? 'Custom...' : ''),
      value: spec.value,
      unit: isStandardUnit ? (spec.unit || 'none') : (spec.unit ? 'Custom...' : 'none'),
      notes: spec.notes || ''
    });
    setEditCustomLabel(isStandardLabel ? '' : spec.label);
    setEditCustomUnit(isStandardUnit ? '' : (spec.unit || ''));
  };

  const handleUpdate = async (specId: string) => {
    const finalLabel = isEditLabelCustom ? editCustomLabel : editFormData.label;
    const finalUnit = isEditUnitCustom ? editCustomUnit : (editFormData.unit === 'none' ? '' : editFormData.unit);

    setLoadingId(specId);
    setErrorMessage(null);
    try {
      await updateCustomSpec(vehicleId, specId, {
        ...editFormData,
        label: finalLabel,
        unit: finalUnit
      });
      setEditingId(null);
      setSuccessMessage('Spec updated');
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update spec');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (specId: string) => {
    setLoadingId(specId);
    setErrorMessage(null);
    try {
      await deleteCustomSpec(vehicleId, specId);
      setConfirmDeleteId(null);
      setSuccessMessage('Spec deleted');
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete spec');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-muted opacity-40" />
          <div className="space-y-0.5">
            <h3 className="text-lg font-bold tracking-tight text-foreground uppercase italic">Personal Spec Library</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-60">Personal technical reference & overrides</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setIsRefListOpen(true)}
              className="flex h-9 items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 transition-all hover:bg-blue-500/10 active:scale-95"
            >
              <FileText size={14} />
              Reference ({selectedIds.length})
            </button>
          )}
          <button 
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className={`flex h-9 items-center justify-center gap-2 rounded-xl border border-border-subtle transition-all active:scale-95 ${
              isAdding 
                ? "bg-foreground/5 text-muted px-4" 
                : "bg-card-overlay text-muted px-3 hover:bg-card-overlay-hover hover:border-border-strong hover:text-foreground"
            }`}
          >
            {isAdding ? <X size={14} /> : <Plus size={14} />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isAdding ? "Cancel" : "Add Spec"}
            </span>
          </button>
        </div>
      </div>

      {/* Transient Feedback Row */}
      {(successMessage || errorMessage) && (
        <div className="px-1 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className={`rounded-xl border p-3 flex items-center gap-3 ${
            successMessage ? 'border-green-500/20 bg-green-500/5 text-green-400' : 'border-red-500/20 bg-red-500/5 text-red-400'
          }`}>
            {successMessage ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span className="text-[10px] font-bold uppercase tracking-widest">{successMessage || errorMessage}</span>
          </div>
        </div>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleAdd} className="rounded-[32px] border border-border-strong bg-card-overlay p-6 space-y-5 shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">Category</label>
                <select 
                  value={formData.group}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value, label: '' })}
                  className="h-12 w-full rounded-2xl bg-foreground/5 border border-border-subtle px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-border-strong appearance-none"
                >
                  {SPEC_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">Spec Label</label>
                <div className="space-y-2">
                  <select 
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="h-12 w-full rounded-2xl bg-foreground/5 border border-border-subtle px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-border-strong appearance-none"
                  >
                    <option value="">Select popular label...</option>
                    {(CATEGORY_LABELS[formData.group] || []).map(l => <option key={l} value={l}>{l}</option>)}
                    <option value="Custom...">Custom...</option>
                  </select>
                  {isLabelCustom && (
                    <input 
                      placeholder="Enter custom label..."
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      className="h-12 w-full rounded-2xl bg-card-overlay border border-border-subtle px-4 text-xs font-bold text-foreground placeholder:text-muted/30 focus:outline-none focus:ring-1 focus:ring-border-strong animate-in fade-in duration-200"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">Value</label>
                <input 
                  placeholder="e.g. 10.5:1"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="h-12 w-full rounded-2xl bg-foreground/5 border border-border-subtle px-4 text-xs font-bold text-foreground placeholder:text-muted/30 focus:outline-none focus:ring-1 focus:ring-border-strong"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">Unit</label>
                <div className="space-y-2">
                  <select 
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="h-12 w-full rounded-2xl bg-foreground/5 border border-border-subtle px-4 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-border-strong appearance-none"
                  >
                    <option value="none">No unit</option>
                    {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    <option value="Custom...">Custom...</option>
                  </select>
                  {isUnitCustom && (
                    <input 
                      placeholder="e.g. bar, psi, mm"
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className="h-12 w-full rounded-2xl bg-card-overlay border border-border-subtle px-4 text-xs font-bold text-foreground placeholder:text-muted/30 focus:outline-none focus:ring-1 focus:ring-border-strong animate-in fade-in duration-200"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">Notes (Optional)</label>
              <textarea 
                placeholder="Internal technical notes, part numbers, or source links..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full min-h-[80px] rounded-2xl bg-foreground/5 border border-border-subtle p-4 text-xs font-medium text-foreground placeholder:text-muted/30 focus:outline-none focus:ring-1 focus:ring-border-strong resize-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={loadingId === 'adding'}
              className="w-full h-12 rounded-2xl bg-foreground text-[10px] font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl"
            >
              {loadingId === 'adding' ? <Loader2 size={16} className="animate-spin" /> : "Save to Library"}
            </button>
          </form>

          {/* Bulk Import Secondary Path - High-Visibility Premium Pro Treatment */}
          <div className="px-4">
            <button
              type="button"
              onClick={() => {
                if (plan?.canImportSpecCsv) {
                  setIsImportModalOpen(true);
                } else {
                  triggerUpgrade('spec_import');
                }
              }}
              className="group w-full h-14 flex items-center justify-center gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/[0.06] text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:bg-blue-500/[0.1] hover:border-blue-500/50 transition-all active:scale-[0.98] shadow-xl shadow-blue-500/[0.05]"
            >
              <Upload size={18} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              <span>Import Specs from CSV</span>
              <span className="ml-1 px-2 py-0.5 rounded-md bg-blue-500 text-[8px] font-black text-white tracking-normal shadow-sm">PRO</span>
            </button>
          </div>
        </div>
      )}

      {/* Grouped Display */}
      {customSpecs.length === 0 && !isAdding ? (
        <div className="flex flex-col items-center justify-center rounded-[40px] border border-dashed border-border-subtle bg-foreground/[0.01] py-20 text-center">
          <div className="relative mb-4 opacity-20">
            <div className="absolute -inset-4 rounded-full bg-foreground/5 blur-2xl" />
            <Settings2 size={40} strokeWidth={1} />
          </div>
          <p className="text-xs font-bold text-muted uppercase tracking-widest italic">Personal spec library is empty</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {SPEC_CATEGORIES.map(category => {
            const categorySpecs = groupedSpecs[category];
            if (!categorySpecs || categorySpecs.length === 0) return null;

            const isExpanded = expandedCategories.includes(category);
            const contentId = `spec-category-${category.replace(/\s+/g, '-').toLowerCase()}`;

            return (
              <div key={category} className="group overflow-hidden rounded-[28px] border border-border-subtle bg-card-overlay transition-all duration-500 hover:border-border-strong">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  aria-expanded={isExpanded}
                  aria-controls={contentId}
                  className="flex w-full items-center justify-between p-5 outline-none transition-colors hover:bg-foreground/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-500 ${
                      isExpanded 
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' 
                        : 'bg-foreground/5 border-border-subtle text-muted opacity-40'
                    }`}>
                      <Settings2 size={14} strokeWidth={1.5} />
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-[0.25em] transition-colors ${
                      isExpanded ? 'text-foreground' : 'text-muted group-hover:text-foreground/60'
                    }`}>
                      {category}
                    </span>
                  </div>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle bg-foreground/5 text-muted transition-all duration-500 ${
                    isExpanded ? 'rotate-180 bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' : ''
                  }`}>
                    <ChevronDown size={12} strokeWidth={3} />
                  </div>
                </button>

                <div 
                  id={contentId}
                  style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                  className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isExpanded ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div className="overflow-hidden min-h-0">
                    <div className="grid gap-2 px-5 pb-6 pt-2">
                      {categorySpecs.map(spec => {
                        const isEditing = editingId === spec.id;
                        const isLoading = loadingId === spec.id;
                        const isSelected = selectedIds.includes(spec.id);
                        const isConfirmingDelete = confirmDeleteId === spec.id;

                        if (isEditing) {
                          return (
                            <div key={spec.id} className="rounded-[24px] border border-border-strong bg-card-overlay p-5 space-y-4 animate-in fade-in duration-200 shadow-2xl">
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">Category</label>
                                <select 
                                  value={editFormData.group}
                                  onChange={(e) => setEditFormData({ ...editFormData, group: e.target.value, label: '' })}
                                  className="h-10 w-full rounded-xl bg-foreground/5 px-3 text-xs font-bold text-foreground border border-border-subtle focus:border-border-strong focus:outline-none appearance-none"
                                >
                                  {SPEC_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">Label</label>
                                  <div className="space-y-2">
                                    <select 
                                      value={editFormData.label}
                                      onChange={(e) => setEditFormData({ ...editFormData, label: e.target.value })}
                                      className="h-10 w-full rounded-xl bg-foreground/5 px-3 text-xs font-bold text-foreground border border-border-subtle focus:border-border-strong focus:outline-none appearance-none"
                                    >
                                      <option value="">Select popular label...</option>
                                      {(CATEGORY_LABELS[editFormData.group] || []).map(l => <option key={l} value={l}>{l}</option>)}
                                      <option value="Custom...">Custom...</option>
                                    </select>
                                    {isEditLabelCustom && (
                                      <input 
                                        value={editCustomLabel}
                                        onChange={(e) => setEditCustomLabel(e.target.value)}
                                        className="h-10 w-full rounded-xl bg-card-overlay border border-border-subtle px-3 text-xs font-bold text-foreground focus:outline-none animate-in fade-in duration-200"
                                        placeholder="Enter custom label..."
                                      />
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">Value</label>
                                  <input 
                                    value={editFormData.value}
                                    onChange={(e) => setEditFormData({ ...editFormData, value: e.target.value })}
                                    className="h-10 w-full rounded-xl bg-foreground/5 px-3 text-xs font-bold text-foreground border border-border-subtle focus:border-border-strong focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">Notes</label>
                                <textarea 
                                  value={editFormData.notes}
                                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                  className="w-full min-h-[60px] rounded-xl bg-foreground/5 p-3 text-xs font-medium text-foreground border border-border-subtle focus:border-border-strong focus:outline-none resize-none"
                                  placeholder="Spec notes..."
                                />
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex-1 space-y-1.5">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40 ml-1">Unit</label>
                                  <div className="space-y-2">
                                    <select 
                                      value={editFormData.unit}
                                      onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                                      className="h-10 w-full rounded-xl bg-foreground/5 px-3 text-xs font-bold text-foreground border border-border-subtle focus:border-border-strong focus:outline-none appearance-none"
                                    >
                                      <option value="none">No unit</option>
                                      {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                      <option value="Custom...">Custom...</option>
                                    </select>
                                    {isEditUnitCustom && (
                                      <input 
                                        value={editCustomUnit}
                                        onChange={(e) => setEditCustomUnit(e.target.value)}
                                        className="h-10 w-full rounded-xl bg-card-overlay border border-border-subtle px-3 text-xs font-bold text-foreground focus:outline-none animate-in fade-in duration-200"
                                        placeholder="Custom unit..."
                                      />
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-end h-full pt-5 gap-2">
                                  <button 
                                    type="button"
                                    onClick={() => handleUpdate(spec.id)}
                                    disabled={isLoading}
                                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-foreground text-background hover:opacity-90 transition-colors disabled:opacity-50 shadow-lg"
                                  >
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => setEditingId(null)}
                                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-foreground/5 text-muted hover:bg-foreground/10 transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={spec.id} 
                            onClick={() => toggleSelection(spec.id)}
                            className={`group flex items-center justify-between rounded-2xl border transition-all hover:shadow-lg cursor-pointer p-4 ${
                              isSelected 
                                ? 'border-blue-500/30 bg-blue-500/[0.03] dark:bg-blue-500/[0.01] shadow-inner' 
                                : 'border-border-subtle bg-foreground/[0.01] hover:bg-foreground/[0.03] hover:border-border-strong'
                            } ${isConfirmingDelete ? 'border-red-500/30 bg-red-500/5' : ''}`}
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              {/* Checkbox Affordance */}
                              {!isConfirmingDelete && (
                                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]' 
                                    : 'border-border-subtle bg-foreground/5 text-transparent group-hover:border-border-strong'
                                }`}>
                                  <Check size={12} strokeWidth={4} />
                                </div>
                              )}

                              <div className="min-w-0 space-y-0.5">
                                <p className={`text-[10px] font-bold uppercase tracking-widest truncate transition-colors ${
                                  isSelected ? 'text-blue-600 dark:text-blue-400 opacity-80' : 'text-muted opacity-40'
                                }`}>
                                  {spec.label}
                                </p>
                                <div className="flex items-baseline gap-2">
                                  <p className="text-sm font-black text-foreground italic">
                                    {spec.value} <span className="text-[10px] not-italic text-muted font-bold ml-0.5 uppercase">{spec.unit}</span>
                                  </p>
                                  {spec.notes && (
                                    <span className="text-[8px] font-bold text-muted opacity-20 uppercase tracking-tighter truncate max-w-[100px]">
                                      • {spec.notes}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              {isConfirmingDelete ? (
                                <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
                                  <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(spec.id); }}
                                    disabled={isLoading}
                                    className="flex h-8 px-3 items-center justify-center rounded-lg bg-red-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg"
                                  >
                                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : "Delete"}
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-muted hover:bg-foreground/10"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleEditInit(spec); }}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground transition-all"
                                    title="Edit Spec"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(spec.id); }}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/5 text-red-500/40 hover:bg-red-500/10 hover:text-red-500 transition-all"
                                    title="Delete Spec"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ReferenceListModal 
        isOpen={isRefListOpen} 
        onClose={() => setIsRefListOpen(false)} 
        selectedSpecs={selectedSpecs}
        onRemove={toggleSelection}
        vehicle={vehicle}
        currentKms={currentKms}
      />

      <ImportSpecsModal 
        vehicleId={vehicleId}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </section>
  );
}

function ReferenceListModal({ 
  isOpen, 
  onClose, 
  selectedSpecs, 
  onRemove,
  vehicle,
  currentKms
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  selectedSpecs: UserVehicleCustomSpec[];
  onRemove: (id: string) => void;
  vehicle: VehicleViewModel;
  currentKms?: number | null;
}) {
  const [mounted, setMounted] = useState(false);
  const { formatDistance } = usePreferences();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted || !isOpen) return null;

  // Group selected specs for display
  const grouped = SPEC_CATEGORIES.reduce((acc, cat) => {
    const specs = selectedSpecs.filter(s => s.group === cat);
    if (specs.length > 0) acc[cat] = specs;
    return acc;
  }, {} as Record<string, UserVehicleCustomSpec[]>);

  return createPortal(
    <div 
      id="spec-reference-portal"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 print:static print:p-0 print:block"
    >
      {/* Print-only CSS for isolation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Force white background and black text on the whole page */
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide everything except the portal */
          body > *:not(#spec-reference-portal) {
            display: none !important;
          }

          /* Reset portal container for print */
          #spec-reference-portal {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Ensure document is clean and respects margins */
          .print-document {
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            width: calc(100% - 40px) !important;
            max-width: none !important;
            position: static !important;
            overflow: visible !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }

          .print-document * {
            color: black !important;
            border-color: #000 !important;
            box-sizing: border-box !important;
          }

          /* Explicitly hide common portal artifacts */
          .backdrop-blur-xl, .bg-black\\/90 {
            display: none !important;
          }
        }
      `}} />

      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl print:hidden" onClick={onClose} />
      
      <div className="print-document relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[40px] border border-border-strong bg-surface shadow-3xl print:rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle p-8 print:hidden">
          <div>
            <h3 className="text-2xl font-black italic tracking-tight text-foreground uppercase">Reference List</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted opacity-40 mt-1">Quick-access technical specs</p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-10 custom-scrollbar print:overflow-visible print:p-0">
          {/* Print Header (Only visible in print) */}
          <div className="hidden print:block border-b-4 border-black pb-6 mb-10">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-black leading-none">{vehicle.nickname}</h1>
            <p className="text-sm font-bold uppercase tracking-widest mt-3 text-black/80">
              {vehicle.year} {vehicle.make} {vehicle.model}
              {currentKms !== undefined && currentKms !== null && (
                <span className="ml-2 pl-2 border-l border-black/20">
                  {formatDistance(currentKms)}
                </span>
              )}
            </p>
          </div>

          {Object.entries(grouped).map(([category, specs]) => (
            <div key={category} className="space-y-4 print:break-inside-avoid print:space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 print:bg-black" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted opacity-40 print:text-black/40 print:text-[10px] print:tracking-[0.2em]">
                  {category}
                </h4>
              </div>
              
              <div className="grid gap-2 print:gap-1">
                {specs.map(spec => (
                  <div key={spec.id} className="flex items-center justify-between group rounded-2xl border border-border-subtle bg-foreground/[0.01] p-4 print:border-none print:bg-transparent print:rounded-none print:p-0 print:block">
                    {/* On-screen layout */}
                    <div className="min-w-0 space-y-0.5 print:hidden">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted opacity-40">{spec.label}</p>
                      <p className="text-base font-black text-foreground italic">
                        {spec.value} <span className="text-[10px] not-italic text-muted font-bold ml-0.5 uppercase">{spec.unit}</span>
                      </p>
                    </div>

                    {/* Print-only layout: simple row format */}
                    <div className="hidden print:flex items-baseline justify-between text-sm border-b border-black/5 pb-1 pr-2">
                      <span className="font-medium text-black/60 shrink">{spec.label}</span>
                      <div className="flex-1 mx-2 border-b border-dotted border-black/10 min-w-[20px]" />
                      <span className="font-black italic text-black shrink-0 whitespace-nowrap text-right">
                        {spec.value} <span className="text-[10px] not-italic font-bold ml-0.5 uppercase">{spec.unit}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(spec.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-foreground/5 text-muted hover:bg-red-500/10 hover:text-red-500 transition-all print:hidden"
                      title="Remove from list"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {selectedSpecs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40 print:hidden">
              <FileText size={48} strokeWidth={1} className="mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">No specs selected</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border-subtle bg-foreground/[0.01] p-8 flex items-center gap-4 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex h-14 items-center justify-center gap-3 rounded-2xl border border-border-subtle bg-card-overlay text-[10px] font-black uppercase tracking-widest text-foreground transition-all hover:bg-card-overlay-hover active:scale-[0.98]"
          >
            <Printer size={18} />
            Print List
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex h-14 items-center justify-center gap-3 rounded-2xl bg-foreground text-[10px] font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] shadow-2xl"
          >
            <FileDown size={18} />
            Export PDF (via Print)
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
