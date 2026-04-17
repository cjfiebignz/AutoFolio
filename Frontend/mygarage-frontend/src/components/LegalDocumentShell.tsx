import { AccountPageShell } from "./AccountPageShell";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface LegalDocumentShellProps {
  title: string;
  subtext: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalDocumentShell({ title, subtext, lastUpdated, children }: LegalDocumentShellProps) {
  return (
    <AccountPageShell title={title} subtext={subtext}>
      <div className="space-y-8">
        <nav className="flex items-center justify-between px-1">
          <Link 
            href="/account/legal"
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted transition-colors hover:text-foreground"
          >
            <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            Legal Index
          </Link>
          <p className="text-[9px] font-black uppercase tracking-widest text-dim">
            Last Updated: {lastUpdated}
          </p>
        </nav>

        <div className="rounded-[40px] border border-border-subtle bg-card-overlay p-8 sm:p-12 shadow-2xl backdrop-blur-md">
          <div className="space-y-12">
            {children}
          </div>
          
          <div className="mt-16 pt-8 border-t border-border-subtle">
            <p className="text-[10px] font-medium leading-relaxed text-dim italic">
              This document is an operational legal scaffold for the Autofolio service and may be updated as the platform evolves. 
              Continued use of the service constitutes acceptance of the latest version.
            </p>
          </div>
        </div>
      </div>
    </AccountPageShell>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold uppercase tracking-tight text-foreground italic">{title}</h2>
      <div className="text-sm sm:text-base text-muted leading-relaxed space-y-4">
        {children}
      </div>
    </div>
  );
}
