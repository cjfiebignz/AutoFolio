'use client';

interface UpgradePromptProps {
  title: string;
  message: string;
  features?: string[];
}

export function UpgradePrompt({ title, message, features }: UpgradePromptProps) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-8 shadow-2xl backdrop-blur-md">
      {/* Background Glow */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
      
      <div className="relative space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Upgrade Available</span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-white">{title}</h3>
          <p className="text-sm font-medium leading-relaxed text-white/50 max-w-sm">
            {message}
          </p>
        </div>

        {features && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {f}
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={() => alert("Note: This is a frontend-only shell. Checkout flow is coming soon!")}
          className="flex w-full items-center justify-center rounded-2xl bg-white p-4 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98]"
        >
          View Plans & Pricing
        </button>
      </div>
    </div>
  );
}
