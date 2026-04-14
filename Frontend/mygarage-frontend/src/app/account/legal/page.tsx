import { AccountPageShell } from "@/components/AccountPageShell";
import { Shield, FileText, Lock, Scale, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function LegalPage() {
  return (
    <AccountPageShell 
      title="Legal & Privacy" 
      subtext="Terms, Data & Compliance"
    >
      <div className="space-y-6">
        <div className="rounded-[40px] border border-white/5 bg-white/[0.02] p-8 sm:p-10 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/20">
              <Shield size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white uppercase italic tracking-tight leading-none">Security Center</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mt-1.5">Protecting your automotive data</p>
            </div>
          </div>

          <div className="space-y-3">
            <LegalLink 
              href="/account/legal/terms"
              icon={<FileText size={18} />} 
              label="Terms of Service" 
              description="Platform usage rules and member agreement."
            />
            <LegalLink 
              href="/account/legal/privacy"
              icon={<Lock size={18} />} 
              label="Privacy Policy" 
              description="How we collect, use, and protect your data."
            />
            <LegalLink 
              href="/account/legal/dpa"
              icon={<Scale size={18} />} 
              label="Data Processing Agreement" 
              description="Technical standards for data processing."
            />
          </div>
        </div>

        <div className="rounded-[32px] border border-dashed border-white/10 bg-white/[0.01] p-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10 mb-2">Operational Scaffold</p>
          <p className="text-sm font-medium leading-relaxed text-white/30 max-w-sm mx-auto">
            These documents define the operational and technical standards of the Autofolio platform. 
            We update them periodically to reflect new features and compliance requirements.
          </p>
        </div>
      </div>
    </AccountPageShell>
  );
}

function LegalLink({ href, icon, label, description }: { href: string; icon: React.ReactNode; label: string; description: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center justify-between group p-4 rounded-2xl border border-white/5 bg-white/[0.01] transition-all hover:bg-white/[0.04] hover:border-white/10 active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/20 transition-all group-hover:text-blue-400/60 group-hover:bg-blue-500/5">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{label}</p>
          <p className="text-[10px] font-medium text-white/20 group-hover:text-white/40 transition-colors uppercase tracking-widest mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/10 transition-all group-hover:bg-white/10 group-hover:text-white group-hover:translate-x-1">
        <ChevronRight size={14} strokeWidth={3} />
      </div>
    </Link>
  );
}
