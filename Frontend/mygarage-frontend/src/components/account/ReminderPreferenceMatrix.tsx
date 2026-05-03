'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  getReminderPreferences, 
  updateReminderPreference 
} from '@/lib/api';
import { 
  ReminderPreferencesResponse, 
  ReminderType, 
  ReminderTiming 
} from '@/types/autofolio';
import { useSession } from 'next-auth/react';
import { Check, Loader2, AlertCircle, Info, Calendar } from 'lucide-react';

export function ReminderPreferenceMatrix() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [data, setData] = useState<ReminderPreferencesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await getReminderPreferences(userId);
      setData(res);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch reminder preferences:', err);
      setError('Failed to load notification preferences.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleToggle = async (type: ReminderType, timing: ReminderTiming, currentEnabled: boolean) => {
    if (!userId || !data) return;

    const previousData = data;
    // Optimistic update
    const updatedPreferences = data.preferences.map(p => 
      (p.type === type && p.timing === timing) ? { ...p, enabled: !currentEnabled } : p
    );
    setData({ ...data, preferences: updatedPreferences });
    
    setSaveStatus('saving');
    try {
      await updateReminderPreference(userId, { type, timing, enabled: !currentEnabled });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to update preference:', err);
      setSaveStatus('error');
      // Revert optimistic update
      setData(previousData);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const getShortLabel = (key: string, measurementSystem: string) => {
    const isImperial = measurementSystem === 'imperial';
    switch (key) {
      case 'AT_EVENT': return 'Due';
      case 'ONE_WEEK_OR_100_DISTANCE_BEFORE': return isImperial ? '1w/100mi' : '1w/100km';
      case 'TWO_WEEKS_OR_200_DISTANCE_BEFORE': return isImperial ? '2w/200mi' : '2w/200km';
      case 'ONE_MONTH_OR_1000_DISTANCE_BEFORE': return isImperial ? '1mo/1k mi' : '1mo/1k km';
      default: return key;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
        <AlertCircle size={18} />
        <p className="text-sm font-medium">{error || 'Something went wrong'}</p>
      </div>
    );
  }

  const { types, timings, measurementSystem } = data.metadata;

  return (
    <div className="space-y-6">
      {/* Header & Inline Feedback */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted opacity-40">Timing Preference</p>
        </div>
        <div className="flex items-center h-4">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-wider">
              <Loader2 size={10} className="animate-spin" />
              Saving
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 uppercase tracking-wider">
              <Check size={10} />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wider">
              <AlertCircle size={10} />
              Failed
            </span>
          )}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="-mx-8 px-8 overflow-x-auto pb-4 scrollbar-hide">
        <div className="min-w-[500px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-4 pr-4 text-[9px] font-black uppercase tracking-widest text-muted opacity-30 w-1/3">Type</th>
                {timings.map(timing => (
                  <th key={timing.key} className="text-center py-4 px-2 text-[9px] font-black uppercase tracking-widest text-muted opacity-30">
                    {getShortLabel(timing.key, measurementSystem)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {types.map(type => (
                <tr key={type.key} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="py-4 pr-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-foreground opacity-80">{type.label}</span>
                      {type.key === 'INSPECTION_EXPIRY' && (
                        <span className="text-[8px] font-medium text-blue-500/60 italic leading-none">Regional (e.g. WOF, Rego Check)</span>
                      )}
                      {!type.supportsDistance && (
                        <div className="flex items-center gap-1">
                          <Calendar size={8} className="text-muted opacity-40" />
                          <span className="text-[8px] font-black uppercase tracking-tighter text-muted opacity-30">Date Only</span>
                        </div>
                      )}
                    </div>
                  </td>
                  {timings.map(timing => {
                    const pref = data.preferences.find(p => p.type === type.key && p.timing === timing.key);
                    const isEnabled = pref?.enabled ?? false;
                    
                    return (
                      <td key={timing.key} className="py-4 px-2">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggle(type.key, timing.key, isEnabled)}
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all active:scale-90 ${
                              isEnabled 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                : 'border-border-subtle bg-foreground/[0.02] text-muted opacity-20 hover:opacity-100 hover:border-border-strong'
                            }`}
                          >
                            <Check size={14} strokeWidth={3} className={isEnabled ? 'scale-100' : 'scale-0 transition-transform'} />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend & Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-foreground/[0.02] border border-border-subtle space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40">Legend</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {timings.map(timing => (
              <div key={timing.key} className="flex items-baseline gap-1.5">
                <span className="text-[9px] font-black text-blue-500 whitespace-nowrap">{getShortLabel(timing.key, measurementSystem)}</span>
                <span className="text-[9px] font-medium text-muted opacity-60 leading-none">{timing.label.split(' before')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-foreground/[0.02] border border-border-subtle">
          <Info size={14} className="text-blue-500/60 shrink-0 mt-0.5" />
          <p className="text-[10px] font-medium text-muted leading-relaxed italic">
            Reminder preferences are being prepared for upcoming email, in-app, and push notification support.
          </p>
        </div>
      </div>
    </div>
  );
}
