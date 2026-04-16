import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppFooterBrand } from './AppFooterBrand';

interface AccountPageShellProps {
  title: string;
  subtext: string;
  children: React.ReactNode;
}

export function AccountPageShell({ title, subtext, children }: AccountPageShellProps) {
  return (
    <div className="min-h-screen bg-surface text-foreground antialiased transition-colors duration-300">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Top Navigation */}
        <nav className="mb-12">
          <Link 
            href="/vehicles" 
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Back to Collection
          </Link>
        </nav>

        {/* Header Section */}
        <header className="mb-16 space-y-1.5 px-1">
          <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase leading-none">
            {title}
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400/60 dark:text-blue-400/50">
            {subtext}
          </p>
        </header>

        {/* Main Content */}
        <div className="min-h-[400px]">
          {children}
        </div>

        <AppFooterBrand />
      </div>
    </div>
  );
}
