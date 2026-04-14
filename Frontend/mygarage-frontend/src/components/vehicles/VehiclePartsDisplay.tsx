'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { SavedPart, PartPreset } from '@/types/autofolio';
import { createSavedPart, updateSavedPart, deleteSavedPart, createPartPreset, updatePartPreset, deletePartPreset, generateShoppingList, exportShoppingListPdf } from '@/lib/api';
import { 
  Plus, Trash2, Edit3, X, Package, Loader2, ChevronDown, 
  ShoppingCart, Printer, FileDown, Check, Store, Tag, Banknote, 
  Layers, ClipboardList, CheckCircle2, AlertCircle,
  ExternalLink, PlusCircle
} from 'lucide-react';
import { VehicleViewModel } from '@/lib/mappers/vehicle';
import { mapPresetItemsToDto } from '@/lib/mappers/parts';

interface VehiclePartsDisplayProps {
  vehicleId: string;
  savedParts: SavedPart[];
  partPresets: PartPreset[];
  vehicle: VehicleViewModel;
}

const PART_CATEGORIES = [
  'Service / Maintenance',
  'Engine',
  'Brakes',
  'Suspension',
  'Steering',
  'Drivetrain',
  'Electrical',
  'Cooling',
  'Fuel System',
  'Body / Exterior',
  'Interior',
  'Wheels / Tyres',
  'Other'
];

export function VehiclePartsDisplay({ 
  vehicleId, 
  savedParts,
  partPresets,
  vehicle
}: VehiclePartsDisplayProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Record<string, number>>({}); // id -> quantity
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isCreatePresetModalOpen, setIsCreatePresetModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PartPreset | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Service / Maintenance']);

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

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const toggleSelection = (id: string, defaultQty: number = 1) => {
    setSelectedIds(prev => {
      const newSelections = { ...prev };
      if (newSelections[id]) {
        delete newSelections[id];
      } else {
        newSelections[id] = defaultQty;
      }
      return newSelections;
    });
  };

  const updateSelectedQuantity = (id: string, qty: number) => {
    setSelectedIds(prev => ({
      ...prev,
      [id]: Math.max(1, qty)
    }));
  };

  const clearSelection = () => setSelectedIds({});

  // Form State
  const [formData, setFormData] = useState({
    category: PART_CATEGORIES[0],
    name: '',
    partNumber: '',
    description: '',
    preferredBrand: '',
    supplier: '',
    purchaseUrl: '',
    lastPrice: '',
    defaultQuantity: '1',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      category: PART_CATEGORIES[0],
      name: '',
      partNumber: '',
      description: '',
      preferredBrand: '',
      supplier: '',
      purchaseUrl: '',
      lastPrice: '',
      defaultQuantity: '1',
      notes: ''
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEditInit = (part: SavedPart) => {
    setFormData({
      category: part.category,
      name: part.name,
      partNumber: part.partNumber || '',
      description: part.description || '',
      preferredBrand: part.preferredBrand || '',
      supplier: part.supplier || '',
      purchaseUrl: part.purchaseUrl || '',
      lastPrice: part.lastPrice ? part.lastPrice.toString() : '',
      defaultQuantity: part.defaultQuantity.toString(),
      notes: part.notes || ''
    });
    setEditingId(part.id);
    setIsAdding(true);
    // Ensure category is expanded
    if (!expandedCategories.includes(part.category)) {
      setExpandedCategories(prev => [...prev, part.category]);
    }
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const actionId = editingId ? editingId : 'adding';
    setLoadingId(actionId);
    setErrorMessage(null);

    const payload = {
      ...formData,
      lastPrice: formData.lastPrice ? parseFloat(formData.lastPrice) : null,
      defaultQuantity: parseInt(formData.defaultQuantity) || 1,
      purchaseUrl: formData.purchaseUrl || null,
      partNumber: formData.partNumber || null,
      preferredBrand: formData.preferredBrand || null,
      supplier: formData.supplier || null,
      notes: formData.notes || null,
      description: formData.description || null
    };

    try {
      if (editingId) {
        await updateSavedPart(vehicleId, editingId, payload);
        setSuccessMessage('Part updated successfully');
      } else {
        await createSavedPart(vehicleId, payload);
        setSuccessMessage('Part saved successfully');
      }
      resetForm();
      startTransition(() => router.refresh());
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save part');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (partId: string) => {
    setLoadingId(partId);
    setErrorMessage(null);
    try {
      await deleteSavedPart(vehicleId, partId);
      setConfirmDeleteId(null);
      setSuccessMessage('Part deleted');
      // If deleted part was selected, remove it
      setSelectedIds(prev => {
        if (!prev[partId]) return prev;
        const newSelected = { ...prev };
        delete newSelected[partId];
        return newSelected;
      });
      startTransition(() => router.refresh());
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete part');
    } finally {
      setLoadingId(null);
    }
  };

  const groupedParts = useMemo(() => {
    const groups: Record<string, SavedPart[]> = {};
    savedParts.forEach(part => {
      if (!groups[part.category]) groups[part.category] = [];
      groups[part.category].push(part);
    });
    return groups;
  }, [savedParts]);

  const handleApplyPreset = (preset: PartPreset) => {
    const newSelections = { ...selectedIds };
    preset.items.forEach(item => {
      newSelections[item.savedPartId] = item.quantity;
    });
    setSelectedIds(newSelections);
    setIsPresetModalOpen(false);
    setSuccessMessage(`Applied preset: ${preset.name}`);
  };

  const handleCreatePreset = async (name: string, notes?: string) => {
    setLoadingId('creating_preset');
    try {
      const items = mapPresetItemsToDto(Object.entries(selectedIds).map(([savedPartId, quantity]) => ({
        savedPartId,
        quantity
      })));
      await createPartPreset(vehicleId, { name, notes, items });
      setSuccessMessage('Preset created successfully');
      setIsCreatePresetModalOpen(false);
      clearSelection();
      startTransition(() => router.refresh());
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create preset');
    } finally {
      setLoadingId(null);
    }
  };

  const selectedCount = Object.keys(selectedIds).length;

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="space-y-5 px-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-white/20" />
            <div className="space-y-0.5">
              <h3 className="text-lg font-bold tracking-tight text-white/90 uppercase italic">Parts Collection</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Your verified hardware & consumables</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => setIsPresetModalOpen(true)}
              className="flex h-9 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all hover:bg-white/10 active:scale-95"
            >
              <Layers size={14} />
              Presets
            </button>
            
            <button 
              type="button"
              onClick={() => isAdding ? resetForm() : setIsAdding(true)}
              className={`flex h-9 items-center justify-center gap-2 rounded-xl border transition-all active:scale-95 ${
                isAdding 
                  ? "border-white/20 bg-white/10 text-white px-4" 
                  : "border-white/10 bg-white/5 text-white/60 px-3 hover:bg-white/10"
              }`}
            >
              {isAdding ? <X size={14} /> : <Plus size={14} />}
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isAdding ? "Cancel" : "Add Part"}
              </span>
            </button>
          </div>
        </div>

        {/* Contextual Selection Row */}
        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-500">
            <button
              type="button"
              onClick={clearSelection}
              className="flex h-9 items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/10 active:scale-95"
            >
              Clear ({selectedCount})
            </button>
            <button
              type="button"
              onClick={() => setIsCreatePresetModalOpen(true)}
              className="flex h-9 items-center justify-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 text-[10px] font-black uppercase tracking-widest text-purple-400 transition-all hover:bg-purple-500/10 active:scale-95"
            >
              <PlusCircle size={14} />
              Create Preset
            </button>
            <button
              type="button"
              onClick={() => setIsShoppingListOpen(true)}
              className="flex h-9 items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 text-[10px] font-black uppercase tracking-widest text-blue-400 transition-all hover:bg-blue-500/10 active:scale-95 shadow-lg shadow-blue-500/5"
            >
              <ShoppingCart size={14} />
              Shop ({selectedCount})
            </button>
          </div>
        )}
      </div>

      {/* Feedback Row */}
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

      {/* Add/Edit Part Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 space-y-5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-white/5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
              {editingId ? <Edit3 size={14} /> : <Plus size={14} />}
              {editingId ? "Edit Part Details" : "New Part Registration"}
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="h-12 w-full rounded-2xl bg-black/40 px-4 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none"
              >
                {PART_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Part Name</label>
              <input 
                placeholder="e.g. Oil Filter"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12 w-full rounded-2xl bg-black/40 px-4 text-xs font-bold text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Part Number</label>
              <input 
                placeholder="e.g. 15601-BZ010"
                value={formData.partNumber}
                onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                className="h-12 w-full rounded-2xl bg-black/40 px-4 text-xs font-bold text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Preferred Brand</label>
              <input 
                placeholder="e.g. Toyota Genuine, Bosch"
                value={formData.preferredBrand}
                onChange={(e) => setFormData({ ...formData, preferredBrand: e.target.value })}
                className="h-12 w-full rounded-2xl bg-black/40 px-4 text-xs font-bold text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Supplier</label>
              <input 
                placeholder="e.g. Local Dealership"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="h-12 w-full rounded-2xl bg-black/40 px-4 text-xs font-bold text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Purchase URL (Optional)</label>
              <input 
                placeholder="https://..."
                value={formData.purchaseUrl}
                onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })}
                className="h-12 w-full rounded-2xl bg-black/40 px-4 text-xs font-bold text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Price Estimate (Last Price)</label>
              <input 
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.lastPrice}
                onChange={(e) => setFormData({ ...formData, lastPrice: e.target.value })}
                className="h-12 w-full rounded-2xl bg-black/40 px-4 text-xs font-bold text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Default Qty</label>
              <input 
                type="number"
                min="1"
                value={formData.defaultQuantity}
                onChange={(e) => setFormData({ ...formData, defaultQuantity: e.target.value })}
                className="h-12 w-full rounded-2xl bg-black/40 px-4 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Notes / Description</label>
            <textarea 
              placeholder="Technical specs, fitment notes, or alternative part numbers..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full min-h-[80px] rounded-2xl bg-black/40 p-4 text-xs font-medium text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button 
              type="submit" 
              disabled={loadingId !== null}
              className="flex-1 h-12 rounded-2xl bg-white text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
            >
              {(loadingId === 'adding' || (loadingId !== null && loadingId === editingId)) ? <Loader2 size={16} className="animate-spin" /> : (editingId ? "Update Part" : "Save Part to Collection")}
            </button>
            <button 
              type="button" 
              onClick={resetForm}
              className="px-6 h-12 rounded-2xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Parts List */}
      {savedParts.length === 0 && !isAdding ? (
        <div className="flex flex-col items-center justify-center rounded-[40px] border border-dashed border-white/5 bg-white/[0.01] py-20 text-center">
          <div className="relative mb-4 opacity-20">
            <div className="absolute -inset-4 rounded-full bg-white/5 blur-2xl" />
            <Package size={40} strokeWidth={1} />
          </div>
          <p className="text-xs font-bold text-white/20 uppercase tracking-widest">No parts in your collection</p>
          <p className="mt-2 text-[10px] text-white/10 font-medium max-w-[200px] leading-relaxed">
            Start adding essential parts like filters, pads, and fluids to build your technical blueprint.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {PART_CATEGORIES.map(category => {
            const parts = groupedParts[category];
            if (!parts || parts.length === 0) return null;

            const isExpanded = expandedCategories.includes(category);

            return (
              <div key={category} className="group overflow-hidden rounded-[28px] border border-white/5 bg-white/[0.01] transition-all duration-500 hover:border-white/10">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="flex w-full items-center justify-between p-5 outline-none transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-500 ${
                      isExpanded 
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                        : 'bg-white/5 border-white/5 text-white/20'
                    }`}>
                      <Tag size={14} strokeWidth={1.5} />
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-[0.25em] transition-colors ${
                      isExpanded ? 'text-white' : 'text-white/40 group-hover:text-white/60'
                    }`}>
                      {category}
                    </span>
                  </div>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border border-white/5 bg-white/5 text-white/20 transition-all duration-500 ${
                    isExpanded ? 'rotate-180 bg-blue-500/10 border-blue-500/20 text-blue-400' : ''
                  }`}>
                    <ChevronDown size={12} strokeWidth={3} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 grid gap-2">
                    {parts.map(part => {
                      const isSelected = !!selectedIds[part.id];
                      const isPartLoading = loadingId === part.id;
                      const isConfirmingDelete = confirmDeleteId === part.id;

                      return (
                        <div 
                          key={part.id}
                          onClick={() => !isConfirmingDelete && toggleSelection(part.id, part.defaultQuantity)}
                          className={`group flex items-center justify-between rounded-2xl border transition-all hover:shadow-lg cursor-pointer p-4 ${
                            isSelected 
                              ? 'border-blue-500/30 bg-blue-500/[0.03] shadow-inner' 
                              : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
                          } ${isConfirmingDelete ? 'border-red-500/30 bg-red-500/5' : ''}`}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-500 text-white' 
                                : 'border-white/10 bg-white/5 text-transparent'
                            }`}>
                              <Check size={12} strokeWidth={4} />
                            </div>

                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-black italic transition-colors ${isSelected ? 'text-white' : 'text-white/90'}`}>
                                  {part.name}
                                </p>
                                {part.preferredBrand && (
                                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[8px] font-black uppercase text-white/30 border border-white/5">
                                    {part.preferredBrand}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                {part.partNumber && (
                                  <div className="flex items-center gap-1">
                                    <ClipboardList size={10} className="text-white/20" />
                                    <span className="text-[10px] font-mono text-white/40">{part.partNumber}</span>
                                  </div>
                                )}
                                {part.supplier && (
                                  <div className="flex items-center gap-1">
                                    <Store size={10} className="text-white/20" />
                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">{part.supplier}</span>
                                  </div>
                                )}
                                {part.purchaseUrl && (
                                  <a 
                                    href={part.purchaseUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 text-blue-400/60 hover:text-blue-400 transition-colors"
                                  >
                                    <ExternalLink size={10} />
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">Purchase Link</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(part.id); }}
                                  disabled={isPartLoading}
                                  className="flex h-8 px-3 items-center justify-center rounded-lg bg-red-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg"
                                >
                                  {isPartLoading ? <Loader2 size={12} className="animate-spin" /> : "Confirm Delete"}
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleEditInit(part); }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/20 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                                  title="Edit Part"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(part.id); }}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/5 text-red-500/20 hover:bg-red-500/10 hover:text-red-400 transition-all"
                                  title="Delete Part"
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
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Shopping List Modal */}
      <ShoppingListModal 
        isOpen={isShoppingListOpen}
        onClose={() => setIsShoppingListOpen(false)}
        selectedIds={selectedIds}
        onRemove={(id) => toggleSelection(id)}
        onUpdateQty={updateSelectedQuantity}
        vehicleId={vehicleId}
        vehicle={vehicle}
      />

      {/* Preset Modal */}
      <PresetModal 
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        presets={partPresets}
        onApply={handleApplyPreset}
        onEdit={(preset) => {
          setEditingPreset(preset);
          setIsPresetModalOpen(false);
        }}
        onDelete={(id) => {
          setLoadingId(id);
          deletePartPreset(vehicleId, id)
            .then(() => {
              setSuccessMessage('Preset deleted');
              startTransition(() => router.refresh());
            })
            .catch(err => setErrorMessage(err.message))
            .finally(() => setLoadingId(null));
        }}
        loadingId={loadingId}
      />

      {/* Edit Preset Modal */}
      <EditPresetModal 
        isOpen={editingPreset !== null}
        onClose={() => setEditingPreset(null)}
        preset={editingPreset}
        onSave={async (presetId, data) => {
          setLoadingId('updating_preset');
          try {
            await updatePartPreset(vehicleId, presetId, data);
            setSuccessMessage('Preset updated successfully');
            setEditingPreset(null);
            startTransition(() => router.refresh());
          } catch (err: any) {
            setErrorMessage(err.message || 'Failed to update preset');
            throw err;
          } finally {
            setLoadingId(null);
          }
        }}
        loading={loadingId === 'updating_preset'}
        savedParts={savedParts}
      />

      {/* Create Preset Modal */}
      <CreatePresetModal
        isOpen={isCreatePresetModalOpen}
        onClose={() => setIsCreatePresetModalOpen(false)}
        onSave={handleCreatePreset}
        loading={loadingId === 'creating_preset'}
        selectedCount={selectedCount}
      />
    </section>
  );
}

function ShoppingListModal({ 
  isOpen, 
  onClose, 
  selectedIds,
  onRemove,
  onUpdateQty,
  vehicleId,
  vehicle
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  selectedIds: Record<string, number>;
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  vehicleId: string;
  vehicle: VehicleViewModel;
}) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [shoppingList, setShoppingList] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && Object.keys(selectedIds).length > 0) {
      setLoading(true);
      setError(null);
      const items = Object.entries(selectedIds).map(([savedPartId, quantity]) => ({
        savedPartId,
        quantity
      }));
      
      generateShoppingList(vehicleId, { items })
        .then(data => setShoppingList(data))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else if (!isOpen) {
      // Clear data on close to ensure fresh load next time
      setShoppingList(null);
      setError(null);
      setExportError(null);
    }
  }, [isOpen, selectedIds, vehicleId]);

  if (!mounted || !isOpen) return null;

  const handlePrint = () => window.print();

  const handleExportPdf = async () => {
    if (!shoppingList) return;
    setIsExporting(true);
    setExportError(null);

    const items = Object.entries(selectedIds).map(([savedPartId, quantity]) => ({
      savedPartId,
      quantity
    }));

    try {
      const blob = await exportShoppingListPdf(vehicleId, { items });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeNickname = vehicle.nickname.toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.setAttribute('download', `${safeNickname}-shopping-list.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.message || 'Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 print:static print:p-0 print:block print-container">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl print:hidden" onClick={onClose} />
      
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[40px] border border-white/10 bg-[#0b0b0c] shadow-3xl print:shadow-none print:border-none print:bg-white print:rounded-none print:max-h-none print:overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-8 print:hidden">
          <div>
            <h3 className="text-2xl font-black italic tracking-tight text-white uppercase">Shopping List</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mt-1">Backend Verified Hardware Blueprint</p>
          </div>
          <button onClick={onClose} className="h-12 w-12 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Compact Print Header */}
        <div className="hidden print:flex items-start justify-between p-6 border-b-2 border-black/10">
          <div>
            <h1 className="text-xl font-black uppercase italic tracking-tight text-black">Shopping List</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-0.5">Automotive Hardware Blueprint</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-black uppercase text-black">{vehicle.nickname}</p>
            <p className="text-[9px] font-bold uppercase text-black/60 tracking-tighter">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
            <p className="text-[8px] font-medium text-black/40 mt-1">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-8 custom-scrollbar print:overflow-visible print:p-6 print:space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={40} className="animate-spin text-blue-500" />
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/20">Syncing with Backend...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <AlertCircle size={40} className="text-red-500/50" />
              <p className="text-sm font-bold text-red-400 uppercase tracking-widest">Generation Failed</p>
              <p className="text-xs text-white/40">{error}</p>
            </div>
          ) : shoppingList ? (
            <div className="space-y-8 print:space-y-4">
              {/* Item Table for Print */}
              <div className="hidden print:block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th className="py-2 text-[9px] font-black uppercase tracking-widest text-black/40 w-12 text-center">Qty</th>
                      <th className="py-2 text-[9px] font-black uppercase tracking-widest text-black/40 px-3">Item Details</th>
                      <th className="py-2 text-[9px] font-black uppercase tracking-widest text-black/40 text-right w-24">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shoppingList.items.map((item: any) => (
                      <tr key={item.partId} className="border-b border-black/5">
                        <td className="py-3 text-[11px] font-black text-center">{item.quantity}</td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black italic uppercase">{item.name}</span>
                            <div className="flex flex-wrap gap-x-2 mt-0.5 opacity-60">
                              {item.partNumber && <span className="text-[8px] font-mono">#{item.partNumber}</span>}
                              {item.brand && <span className="text-[8px] font-bold uppercase">{item.brand}</span>}
                              {item.supplier && <span className="text-[8px] font-bold uppercase text-black/40">[{item.supplier}]</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-[11px] font-black text-right">
                          {item.estimatedCost !== null ? `$${item.estimatedCost.toFixed(2)}` : "---"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Grid for Screen */}
              <div className="grid gap-3 print:hidden">
                {shoppingList.items.map((item: any) => (
                  <div key={item.partId} className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                    <div className="flex items-center gap-6 min-w-0">
                      <div className="flex flex-col items-center gap-1">
                        <button 
                          onClick={() => onUpdateQty(item.partId, item.quantity + 1)}
                          className="h-6 w-6 flex items-center justify-center rounded-md bg-white/5 text-white/40 hover:bg-white/10"
                        >
                          <Plus size={12} />
                        </button>
                        <span className="text-xs font-black text-white">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQty(item.partId, item.quantity - 1)}
                          className="h-6 w-6 flex items-center justify-center rounded-md bg-white/5 text-white/40 hover:bg-white/10"
                        >
                          <X size={10} />
                        </button>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-black text-white italic">{item.name}</p>
                          {item.purchaseUrl && (
                            <a href={item.purchaseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {item.partNumber && (
                            <span className="text-[10px] font-mono text-white/40"># {item.partNumber}</span>
                          )}
                          {item.brand && (
                            <span className="text-[10px] font-bold uppercase text-white/20">{item.brand}</span>
                          )}
                          {item.supplier && (
                            <span className="text-[10px] font-bold uppercase text-white/20">From: {item.supplier}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      {item.estimatedCost !== null ? (
                        <p className="text-sm font-black text-white">
                          ${item.estimatedCost.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-[10px] font-bold text-white/10 italic">No Pricing</p>
                      )}
                      <button
                        onClick={() => onRemove(item.partId)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 text-white/10 hover:bg-red-500/10 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Section */}
              <div className="rounded-[32px] border border-white/5 bg-white/[0.01] p-8 space-y-4 print:border-none print:p-0 print:bg-transparent print:space-y-1">
                <div className="flex items-center justify-between print:justify-end print:gap-8 border-t border-black/10 print:pt-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/40 print:text-black/40 print:text-[10px]">Estimated Total</span>
                  <div className="text-right">
                    <p className="text-3xl font-black italic text-white print:text-black print:text-xl leading-none">
                      {shoppingList.totalEstimatedCost !== null ? `$${shoppingList.totalEstimatedCost.toFixed(2)}` : "---"}
                    </p>
                  </div>
                </div>
                {shoppingList.hasIncompletePricing && (
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-yellow-500/50 uppercase tracking-tighter mt-1 print:text-black/40 print:text-[7px]">
                      * Pricing information is incomplete
                    </p>
                  </div>
                )}
              </div>

              {exportError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3 text-red-400 print:hidden">
                  <AlertCircle size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{exportError}</span>
                </div>
              )}
            </div>

          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
              <ShoppingCart size={48} strokeWidth={1} className="mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">List is empty</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/5 bg-white/[0.01] p-8 flex items-center gap-4 print:hidden">
          <button
            onClick={handlePrint}
            disabled={loading || isExporting || !shoppingList}
            className="flex-1 flex h-14 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all disabled:opacity-30"
          >
            <Printer size={18} />
            Print List
          </button>
          <button
            onClick={handleExportPdf}
            disabled={loading || isExporting || !shoppingList}
            className="flex-1 flex h-14 items-center justify-center gap-3 rounded-2xl bg-white text-[10px] font-black uppercase tracking-widest text-black hover:bg-white/90 transition-all shadow-2xl disabled:opacity-30"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
            {isExporting ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function PresetModal({ 
  isOpen, 
  onClose, 
  presets, 
  onApply,
  onEdit,
  onDelete,
  loadingId
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  presets: PartPreset[];
  onApply: (preset: PartPreset) => void;
  onEdit: (preset: PartPreset) => void;
  onDelete: (id: string) => void;
  loadingId: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative flex flex-col w-full max-w-lg max-h-[80vh] overflow-hidden rounded-[40px] border border-white/10 bg-[#0b0b0c] shadow-3xl">
        <div className="flex items-center justify-between border-b border-white/5 p-8">
          <div>
            <h3 className="text-xl font-black italic tracking-tight text-white uppercase">Part Presets</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mt-1">Saved Hardware Groupings</p>
          </div>
          <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
          {presets.map(preset => (
            <div 
              key={preset.id}
              className="group rounded-3xl border border-white/5 bg-white/[0.02] p-6 hover:border-white/10 hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <h4 className="text-base font-black italic text-white">{preset.name}</h4>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    {preset.items.length} items included
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApply(preset)}
                    className="flex h-9 px-4 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] font-black uppercase tracking-widest text-purple-400 hover:bg-purple-500/20 active:scale-95 transition-all"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => onEdit(preset)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/20 hover:bg-white/10 hover:text-white transition-all"
                    title="Edit Preset"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(preset.id)}
                    disabled={loadingId !== null}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/5 text-red-500/20 hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-50"
                  >
                    {loadingId === preset.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {preset.items.map(item => (
                  <span key={item.id} className="px-2 py-1 rounded-lg bg-black/40 border border-white/5 text-[9px] font-bold text-white/30 uppercase">
                    {item.savedPart?.name || 'Unknown Part'} (x{item.quantity})
                  </span>
                ))}
              </div>
            </div>
          ))}

          {presets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
              <Layers size={40} strokeWidth={1} className="mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">No presets defined</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function EditPresetModal({
  isOpen,
  onClose,
  preset,
  onSave,
  loading,
  savedParts
}: {
  isOpen: boolean;
  onClose: () => void;
  preset: PartPreset | null;
  onSave: (presetId: string, data: { name: string; notes?: string | null; items: { savedPartId: string; quantity: number }[] }) => void;
  loading: boolean;
  savedParts: SavedPart[];
}) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ savedPartId: string; quantity: number; name?: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && preset) {
      setName(preset.name);
      setNotes(preset.notes || '');
      setLocalError(null);
      setItems(preset.items.map(item => ({
        savedPartId: item.savedPartId,
        quantity: item.quantity,
        name: item.savedPart?.name
      })));
    }
  }, [isOpen, preset]);

  if (!isOpen || !preset) return null;

  const updateQty = (id: string, qty: number) => {
    setItems(prev => prev.map(item => 
      item.savedPartId === id ? { ...item, quantity: Math.max(1, qty) } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.savedPartId !== id));
  };

  const addItem = (part: SavedPart) => {
    if (items.some(i => i.savedPartId === part.id)) return;
    setItems(prev => [...prev, { savedPartId: part.id, quantity: part.defaultQuantity, name: part.name }]);
    setSearchQuery('');
  };

  const filteredParts = savedParts.filter(part => 
    !items.some(i => i.savedPartId === part.id) &&
    part.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const handleSave = async () => {
    if (!name || items.length === 0) return;
    setLocalError(null);
    
    // Strip UI-only properties before sending to backend
    const cleanItems = mapPresetItemsToDto(items);

    try {
      await onSave(preset.id, { name, notes, items: cleanItems });
    } catch (err: any) {
      setLocalError(err.message || 'Failed to update preset');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative flex flex-col w-full max-w-xl max-h-[85vh] overflow-hidden rounded-[40px] border border-white/10 bg-[#0b0b0c] shadow-3xl">
        <div className="flex items-center justify-between border-b border-white/5 p-8">
          <div>
            <h3 className="text-xl font-black italic tracking-tight text-white uppercase">Edit Preset</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mt-1">Refine Hardware Grouping</p>
          </div>
          <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {localError && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{localError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Preset Name</label>
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 w-full rounded-2xl bg-black/40 px-4 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Notes (Optional)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[60px] rounded-2xl bg-black/40 p-4 text-xs font-medium text-white resize-none focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Included Parts ({items.length})</h4>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.savedPartId} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-3 pl-4">
                  <span className="text-xs font-bold text-white italic">{item.name || 'Unknown Part'}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateQty(item.savedPartId, item.quantity - 1)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10"
                      >
                        <X size={12} />
                      </button>
                      <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQty(item.savedPartId, item.quantity + 1)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.savedPartId)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-red-500/40 hover:bg-red-500/10 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Preset is empty</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Add More Parts</h4>
            <div className="relative">
              <input 
                placeholder="Search collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-2xl bg-black/40 px-4 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              {searchQuery && filteredParts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 z-10 rounded-2xl border border-white/10 bg-black p-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
                  {filteredParts.map(part => (
                    <button
                      key={part.id}
                      onClick={() => addItem(part)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-left transition-all"
                    >
                      <span className="text-[11px] font-bold text-white">{part.name}</span>
                      <PlusCircle size={14} className="text-blue-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 p-8 flex gap-3">
          <button 
            onClick={handleSave}
            disabled={loading || !name || items.length === 0}
            className="flex-1 h-12 rounded-2xl bg-white text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-30"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
          </button>
          <button 
            onClick={onClose}
            className="px-6 h-12 rounded-2xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


function CreatePresetModal({
  isOpen,
  onClose,
  onSave,
  loading,
  selectedCount
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, notes?: string) => void;
  loading: boolean;
  selectedCount: number;
}) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[40px] border border-white/10 bg-[#0b0b0c] p-8 shadow-3xl">
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-black italic tracking-tight text-white uppercase">New Preset</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Creating grouping for {selectedCount} items</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Preset Name</label>
              <input 
                placeholder="e.g. Minor Service Pack"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 w-full rounded-2xl bg-black/40 px-4 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-1">Notes (Optional)</label>
              <textarea 
                placeholder="Description of when to use this preset..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[80px] rounded-2xl bg-black/40 p-4 text-xs font-medium text-white resize-none focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => onSave(name, notes)}
              disabled={loading || !name}
              className="flex-1 h-12 rounded-2xl bg-white text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-30"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Create Preset"}
            </button>
            <button 
              onClick={onClose}
              className="px-6 h-12 rounded-2xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
