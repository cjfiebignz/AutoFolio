import { AccountPageShell } from "@/components/AccountPageShell";
import { Clock } from "lucide-react";

export default function ComingSoonPage() {
  return (
    <AccountPageShell 
      title="Feature Coming Soon" 
      subtext="Development in Progress"
    >
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-8 relative">
          <div className="absolute -inset-4 rounded-full bg-blue-500/5 blur-2xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-[32px] border border-white/10 bg-white/5 text-white/10 shadow-2xl">
            <Clock size={40} strokeWidth={1} />
          </div>
        </div>
        
        <div className="max-w-xs space-y-4">
          <h3 className="text-xl font-bold text-white/60 uppercase italic tracking-tight">System Update Pending</h3>
          <p className="text-sm font-medium leading-relaxed text-white/20">
            This feature is currently in development and will be available soon. We're building a more integrated way to manage your vehicle's essential documentation.
          </p>
        </div>
      </div>
    </AccountPageShell>
  );
}
