'use client';

import { AccountPageShell } from "@/components/AccountPageShell";
import { usePreferences, DistanceUnit } from "@/lib/preferences";
import { 
  Settings, 
  Bell, 
  Palette, 
  Globe, 
  Check, 
  ChevronRight,
  Info,
  Coins
} from "lucide-react";

export default function PreferencesPage() {
  const { preferences, updatePreferences, updateNotifications, mounted } = usePreferences();

  if (!mounted) {
    return (
      <AccountPageShell title="Preferences" subtext="App Personalization & Settings">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
        </div>
      </AccountPageShell>
    );
  }

  const CURRENCIES = ['AUD', 'USD', 'GBP', 'EUR', 'NZD', 'JPY'];

  return (
    <AccountPageShell 
      title="Preferences" 
      subtext="App Personalization & Settings"
    >
      <div className="space-y-8 pb-20">
        {/* General / Units Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Globe size={16} className="text-muted opacity-40" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Regional & Units</h3>
          </div>
          
          <div className="rounded-[32px] border border-border-subtle bg-card-overlay p-8 space-y-8">
            {/* Distance Units */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground opacity-80">Distance Units</p>
                  <p className="text-xs font-medium text-muted mt-0.5">Select your preferred measurement system.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <OptionButton 
                  label="Kilometres" 
                  active={preferences.distanceUnit === 'kilometres'} 
                  onClick={() => updatePreferences({ distanceUnit: 'kilometres' })}
                />
                <OptionButton 
                  label="Miles" 
                  active={preferences.distanceUnit === 'miles'} 
                  onClick={() => updatePreferences({ distanceUnit: 'miles' })}
                />
              </div>
            </div>

            <div className="border-t border-border-subtle" />

            {/* Default Currency */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Coins size={14} className="text-blue-500/40" />
                <div>
                  <p className="text-sm font-bold text-foreground opacity-80">Default Currency</p>
                  <p className="text-xs font-medium text-muted mt-0.5">Primary currency for new records and display fallbacks.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CURRENCIES.map(code => (
                  <OptionButton 
                    key={code}
                    label={code} 
                    active={preferences.defaultCurrency === code} 
                    onClick={() => updatePreferences({ defaultCurrency: code })}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Palette size={16} className="text-muted opacity-40" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Appearance</h3>
          </div>
          
          <div className="rounded-[32px] border border-border-subtle bg-card-overlay p-8 space-y-6">
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground opacity-80">Interface Theme</p>
              <p className="text-xs font-medium text-muted">Select your preferred visual mode.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <OptionButton 
                label="Dark Mode" 
                active={preferences.theme === 'dark'} 
                onClick={() => updatePreferences({ theme: 'dark' })}
              />
              <OptionButton 
                label="Light Mode" 
                active={preferences.theme === 'light'} 
                onClick={() => updatePreferences({ theme: 'light' })}
              />
            </div>

            <div className="mt-2 flex items-center gap-2 rounded-2xl bg-foreground/[0.01] border border-border-subtle p-4">
              <Info size={14} className="text-dim shrink-0" />
              <p className="text-[10px] font-medium text-muted leading-relaxed italic">
                AutoFolio preserves your theme preference across your local sessions.
              </p>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Bell size={16} className="text-muted opacity-40" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Notifications</h3>
          </div>
          
          <div className="rounded-[32px] border border-border-subtle bg-card-overlay p-8 space-y-6">
            <ToggleItem 
              label="Service Reminders" 
              description="Get alerted when maintenance intervals are approaching."
              active={preferences.notifications.reminders}
              onChange={(val) => updateNotifications({ reminders: val })}
            />
            <div className="border-t border-border-subtle" />
            <ToggleItem 
              label="System Alerts" 
              description="Important updates regarding your vehicle collection."
              active={preferences.notifications.serviceAlerts}
              onChange={(val) => updateNotifications({ serviceAlerts: val })}
            />
          </div>
        </section>

        {/* Persistence Notice */}
        <div className="flex flex-col items-center text-center px-8">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-dim mb-2">Sync Status</p>
          <p className="text-[10px] font-medium leading-relaxed text-dim max-w-xs italic">
            Preferences are currently stored locally on this device. Cloud sync for cross-device settings is coming in a future update.
          </p>
        </div>
      </div>
    </AccountPageShell>
  );
}

function OptionButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-2xl border px-5 py-4 transition-all active:scale-[0.98] ${
        active 
          ? 'border-blue-500/20 bg-blue-500/5 text-foreground' 
          : 'border-border-subtle bg-foreground/[0.01] text-muted hover:bg-card-overlay-hover hover:border-border-strong'
      }`}
    >
      <span className="text-xs font-bold">{label}</span>
      {active && <Check size={14} className="text-blue-500" />}
    </button>
  );
}

function ToggleItem({ label, description, active, onChange }: { label: string; description: string; active: boolean; onChange: (val: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <p className="text-sm font-bold text-foreground opacity-80">{label}</p>
        <p className="text-xs font-medium text-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!active)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          active ? 'bg-blue-600' : 'bg-foreground/10'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            active ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
