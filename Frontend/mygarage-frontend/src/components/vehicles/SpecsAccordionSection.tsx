'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SpecsAccordionSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

export function SpecsAccordionSection({ 
  icon, 
  title, 
  children 
}: SpecsAccordionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="group overflow-hidden rounded-3xl border border-subtle bg-card-overlay transition-all duration-500 hover:border-border-strong">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-6 outline-none transition-colors hover:bg-foreground/[0.02]"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-500 ${
            isExpanded 
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' 
              : 'bg-foreground/5 border-border-subtle text-muted opacity-40'
          }`}>
            {icon}
          </div>
          <h3 className={`text-sm font-bold tracking-tight transition-colors uppercase ${
            isExpanded ? 'text-foreground' : 'text-foreground opacity-90'
          }`}>
            {title}
          </h3>
        </div>
        <div className={`flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle bg-foreground/5 text-muted transition-all duration-500 ${
          isExpanded ? 'rotate-180 bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' : ''
        }`}>
          <ChevronDown size={12} strokeWidth={3} />
        </div>
      </button>
      
      <div 
        className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="divide-y divide-subtle px-6 pb-6 pt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
