'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Cpu, 
  Clock, 
  History, 
  RotateCcw, 
  Play, 
  AlertCircle, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  FastForward,
  Info,
  Globe,
  LayoutDashboard,
  RefreshCw,
  Bell
} from 'lucide-react';
import { AccountPageShell } from '@/components/AccountPageShell';
import { 
  getDevTime, 
  setDevTime, 
  advanceDevTime, 
  clearDevTime, 
  DevTimeResponse,
  sendDueReminderEmails,
  SendEmailsResponse,
  resetReminderDeliveries
} from '@/lib/api';
import { usePreferences } from '@/lib/preferences';

export default function DevToolsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { preferences, mounted: prefsMounted } = usePreferences();
  const [isPending, startTransition] = useTransition();
  const [devModeEnabled, setDevModeEnabled] = useState<boolean | null>(null);
  const [timeData, setDevTimeData] = useState<DevTimeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Email test states
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [isResettingDeliveries, setIsResettingDeliveries] = useState(false);
  const [emailResult, setEmailResult] = useState<SendEmailsResponse | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Form states
  const [manualTime, setManualTime] = useState('');
  const [advanceHours, setAdvanceHours] = useState('24');

  // Timezone resolution
  const displayTimezone = useMemo(() => {
    if (preferences.timezone) return preferences.timezone;
    if (typeof Intl !== 'undefined') return Intl.DateTimeFormat().resolvedOptions().timeZone;
    return 'UTC';
  }, [preferences.timezone]);

  const fetchDevTime = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const data = await getDevTime();
      setDevTimeData(data);
      
      // Initialize manual input from effective time if empty
      if (data.effectiveNow && !manualTime) {
          const date = new Date(data.effectiveNow);
          if (!isNaN(date.getTime())) {
            const offset = date.getTimezoneOffset() * 60000;
            const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
            setManualTime(localISOTime);
          }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dev time');
    } finally {
      if (!quiet) setIsLoading(false);
    }
  };

  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
      const devKey = `autofolio_dev_${userId}`;
      const token = localStorage.getItem(devKey);
      setDevModeEnabled(!!token);
      
      if (token) {
        fetchDevTime();
      } else {
        setIsLoading(false);
      }
    } else if (session === null) {
        setDevModeEnabled(false);
        setIsLoading(false);
    }
  }, [session]);

  const handleSetTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTime) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const isoString = new Date(manualTime).toISOString();
      await setDevTime(isoString);
      await fetchDevTime(true);
      window.dispatchEvent(new Event('garage-refresh'));
      router.refresh();
      setSuccess('Application time overridden successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to set time');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvanceTime = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await advanceDevTime(parseInt(advanceHours, 10));
      await fetchDevTime(true);
      window.dispatchEvent(new Event('garage-refresh'));
      router.refresh();
      setSuccess(`Advanced time by ${advanceHours} hours.`);
    } catch (err: any) {
      setError(err.message || 'Failed to advance time');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearTime = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await clearDevTime();
      await fetchDevTime(true);
      window.dispatchEvent(new Event('garage-refresh'));
      router.refresh();
      setSuccess('Application time reset to real time.');
    } catch (err: any) {
      setError(err.message || 'Failed to clear time');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmails = async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    const devToken = localStorage.getItem(`autofolio_dev_${userId}`);
    if (!devToken) {
      setEmailError('Developer access token missing. Unlock Dev Mode again in Account Security.');
      return;
    }

    setIsSendingEmails(true);
    setEmailError(null);
    setEmailResult(null);
    try {
      const res = await sendDueReminderEmails(userId, devToken);
      setEmailResult(res);
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send reminder emails. Suggest unlocking Dev Mode again.');
    } finally {
      setIsSendingEmails(false);
    }
  };

  const handleResetDeliveries = async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    const devToken = localStorage.getItem(`autofolio_dev_${userId}`);
    if (!devToken) {
      setEmailError('Developer access token missing. Unlock Dev Mode again in Account Security.');
      return;
    }

    setIsResettingDeliveries(true);
    setEmailError(null);
    setResetSuccess(null);
    setEmailResult(null); // Clear previous results
    try {
      const res = await resetReminderDeliveries(userId, {}, devToken);
      setResetSuccess(`Successfully reset ${res.count} delivery records.`);
    } catch (err: any) {
      setEmailError(err.message || 'Failed to reset delivery records. Suggest unlocking Dev Mode again.');
    } finally {
      setIsResettingDeliveries(false);
    }
  };

  // Safe date formatter
  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return 'Unavailable';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return 'Unavailable';
    }
    
    return new Intl.DateTimeFormat('en-AU', {
      timeZone: displayTimezone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(date);
  };

  if (isLoading && devModeEnabled === null) {
    return (
      <AccountPageShell title="Dev Tools" subtext="Developer Overrides">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted opacity-20" />
        </div>
      </AccountPageShell>
    );
  }

  if (devModeEnabled === false) {
    return (
      <AccountPageShell title="Dev Tools" subtext="Developer Overrides">
        <div className="flex flex-col items-center justify-center h-96 text-center space-y-6">
          <div className="h-16 w-16 rounded-[24px] bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black italic tracking-tighter text-foreground uppercase">Access Restricted</h3>
            <p className="text-sm font-medium text-muted max-w-xs">Developer Mode must be unlocked from your Account Security settings.</p>
          </div>
          <Link 
            href="/account" 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={14} />
            Return to Account
          </Link>
        </div>
      </AccountPageShell>
    );
  }

  return (
    <AccountPageShell title="Dev Tools" subtext="Time Overrides & Testing">
      <div className="space-y-8 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/60 italic">
              Displayed in {displayTimezone.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={() => fetchDevTime()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground/5 text-[9px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-all"
             >
               <RefreshCw size={10} className={isLoading ? 'animate-spin' : ''} />
               Refresh Time
             </button>
             <Link 
              href="/vehicles"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-lg hover:bg-blue-500 transition-all"
             >
               <LayoutDashboard size={10} />
               Open Garage
             </Link>
          </div>
        </div>

        {/* Time Status Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Clock size={16} className="text-muted opacity-40" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Clock Status</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-[32px] border border-border-subtle bg-card-overlay p-8 space-y-6">
               <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40">Effective App Time</span>
                  {timeData?.overrideActive ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500">
                      <div className="h-1 w-1 rounded-full bg-orange-500 animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Override Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500">
                      <span className="text-[8px] font-black uppercase tracking-tighter">Real Time</span>
                    </div>
                  )}
               </div>
               <div className="space-y-1">
                  <p className="text-2xl font-black italic tracking-tighter text-foreground uppercase leading-tight">
                    {formatTime(timeData?.effectiveNow)}
                  </p>
                  <p className="text-[9px] font-medium text-muted/40 font-mono break-all">
                    {timeData?.effectiveNow || '---'}
                  </p>
               </div>
            </div>

            <div className="rounded-[32px] border border-border-subtle bg-card-overlay/40 p-8 space-y-6">
               <span className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40">System Real Time</span>
               <div className="space-y-1">
                  <p className="text-xl font-black italic tracking-tighter text-dim uppercase leading-tight">
                    {formatTime(timeData?.realNow)}
                  </p>
                  <p className="text-[9px] font-medium text-muted/20 font-mono break-all">
                    {timeData?.realNow || '---'}
                  </p>
               </div>
            </div>
          </div>
        </section>

        {/* Feedback Messages */}
        {(error || success) && (
          <div className={`rounded-2xl border p-4 text-xs font-bold animate-in zoom-in-95 ${
            error ? 'border-red-500/20 bg-red-500/10 text-red-600' : 'border-green-500/20 bg-green-500/10 text-green-600'
          }`}>
            <div className="flex items-center gap-2 uppercase tracking-widest text-[10px]">
              {error ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
              {error || success}
            </div>
          </div>
        )}

        {/* Time Control Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Cpu size={16} className="text-muted opacity-40" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Time Control</h3>
          </div>

          <div className="rounded-[32px] border border-border-subtle bg-card-overlay p-8 space-y-8">
            {/* Manual Set */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <History size={14} className="text-blue-500/40" />
                <p className="text-sm font-bold text-foreground opacity-80">Manual Date/Time Override</p>
              </div>
              <form onSubmit={handleSetTime} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="datetime-local"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="flex-1 h-14 rounded-2xl border border-border-subtle bg-foreground/[0.02] px-6 text-sm font-bold text-foreground focus:border-foreground/20 outline-none transition-all [color-scheme:dark]"
                />
                <button
                  type="submit"
                  disabled={isLoading || !manualTime}
                  className="h-14 px-8 rounded-2xl bg-foreground text-[10px] font-black uppercase tracking-widest text-background hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Set Time'}
                </button>
              </form>
            </div>

            <div className="border-t border-border-subtle" />

            {/* Advance Time */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FastForward size={14} className="text-blue-500/40" />
                <p className="text-sm font-bold text-foreground opacity-80">Advance Application Clock</p>
              </div>
              <form onSubmit={handleAdvanceTime} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={advanceHours}
                    onChange={(e) => setAdvanceHours(e.target.value)}
                    placeholder="Hours"
                    className="w-full h-14 rounded-2xl border border-border-subtle bg-foreground/[0.02] px-6 text-sm font-bold text-foreground focus:border-foreground/20 outline-none transition-all"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-muted opacity-40 pointer-events-none">Hours</div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !advanceHours}
                  className="h-14 px-8 rounded-2xl bg-blue-600 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-500 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Advance Clock'}
                </button>
              </form>
            </div>

            <div className="border-t border-border-subtle" />

            {/* Reset */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-sm font-bold text-foreground opacity-80">Reset Override</p>
                <p className="text-xs font-medium text-muted">Remove any time overrides and return to the real system clock.</p>
              </div>
              <button
                type="button"
                onClick={handleClearTime}
                disabled={isLoading || !timeData?.overrideActive}
                className="w-full sm:w-auto h-14 px-8 rounded-2xl border border-border-subtle bg-card-overlay text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:bg-card-overlay-hover transition-all active:scale-[0.98] disabled:opacity-20"
              >
                <div className="flex items-center justify-center gap-2">
                  <RotateCcw size={14} />
                  Reset to Real Time
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Email Testing Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <Bell size={16} className="text-blue-500/40" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Email & Notifications</h3>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500">
              <span className="text-[8px] font-black uppercase tracking-tighter">Development Only</span>
            </div>
          </div>

          <div className="rounded-[32px] border border-border-subtle bg-card-overlay p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-sm font-bold text-foreground opacity-80">Test Reminder Delivery</p>
                <p className="text-xs font-medium text-muted">Manually trigger email delivery for currently due reminders.</p>
              </div>
              <button
                type="button"
                onClick={handleSendEmails}
                disabled={isSendingEmails || !session?.user?.id}
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-foreground text-[10px] font-black uppercase tracking-widest text-background hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSendingEmails ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Sending...
                  </div>
                ) : (
                  'Send due reminder emails'
                )}
              </button>
            </div>

            <div className="border-t border-border-subtle" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-sm font-bold text-foreground opacity-80">Reset Delivery Records</p>
                <p className="text-xs font-medium text-muted">Clear all delivery tracking records to allow re-testing of reminders.</p>
              </div>
              <button
                type="button"
                onClick={handleResetDeliveries}
                disabled={isResettingDeliveries || !session?.user?.id}
                className="w-full sm:w-auto h-14 px-8 rounded-2xl border border-border-subtle bg-card-overlay text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:bg-card-overlay-hover transition-all active:scale-[0.98] disabled:opacity-20"
              >
                {isResettingDeliveries ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Resetting...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <RotateCcw size={14} />
                    Reset delivery records
                  </div>
                )}
              </button>
            </div>

            {/* Email Feedback */}
            {emailError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-[10px] font-black uppercase tracking-widest text-red-600 animate-in zoom-in-95">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} />
                  {emailError}
                </div>
              </div>
            )}

            {resetSuccess && (
              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-[10px] font-black uppercase tracking-widest text-green-600 animate-in zoom-in-95">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  {resetSuccess}
                </div>
              </div>
            )}

            {emailResult && (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    <CheckCircle2 size={14} />
                    Email Delivery Results
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40">
                    {emailResult?.totalEvaluated ?? 0} Evaluated
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted opacity-40">Sent</p>
                    <p className={`text-xl font-black italic tracking-tighter ${(emailResult?.sent ?? 0) > 0 ? 'text-green-500' : 'text-foreground'}`}>
                      {emailResult?.sent ?? 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted opacity-40">Skipped</p>
                    <p className="text-xl font-black italic tracking-tighter text-foreground">{emailResult?.skipped ?? 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted opacity-40">Failed</p>
                    <p className={`text-xl font-black italic tracking-tighter ${(emailResult?.failed ?? 0) > 0 ? 'text-red-500' : 'text-foreground'}`}>
                      {emailResult?.failed ?? 0}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted opacity-40">No Email</p>
                    <p className="text-xl font-black italic tracking-tighter text-foreground">{emailResult?.noEmail ?? 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted opacity-40">No Config</p>
                    <p className="text-xl font-black italic tracking-tighter text-foreground">{emailResult?.noConfig ?? 0}</p>
                  </div>
                </div>

                {(emailResult?.details ?? []).length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted opacity-40">Detail Log</p>
                    <div className="max-h-40 overflow-y-auto rounded-xl bg-foreground/[0.02] p-3 space-y-2 border border-border-subtle">
                      {(emailResult?.details ?? []).map((res: any, idx: number) => (
                        <div key={idx} className="flex items-start justify-between gap-4 text-[10px] font-mono">
                          <span className="text-muted/60 shrink-0">[{res.status?.toUpperCase() || 'N/A'}]</span>
                          <span className="flex-1 text-foreground/80 break-all">
                            {res.key ? <span className="text-muted/40 mr-1">{res.key}</span> : null}
                            {res.reason || res.error || (res.status === 'sent' ? 'Success' : 'Unknown Status')}
                          </span>
                          <span className={res.status === 'sent' ? 'text-green-500' : res.status === 'skipped' ? 'text-muted' : 'text-red-500'}>
                            {res.status === 'sent' ? 'OK' : res.status === 'skipped' ? 'SKIP' : 'ERR'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(emailResult?.details ?? []).length === 0 && (
                  <p className="text-[10px] font-medium text-muted italic">No reminders were due for delivery at this time.</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Note Section */}
        <div className="flex items-start gap-4 rounded-3xl bg-blue-500/5 border border-blue-500/10 p-6">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Streak Testing Note</p>
            <p className="text-[11px] font-medium text-muted leading-relaxed italic">
              Used for testing midnight-to-midnight streak behavior. After changing app time, return to Garage or refresh streak data to evaluate the new day. 
              The application uses this effective time for all calendar boundary and usage period checks.
            </p>
          </div>
        </div>
      </div>
    </AccountPageShell>
  );
}
