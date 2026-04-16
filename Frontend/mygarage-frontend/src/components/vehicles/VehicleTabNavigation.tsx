'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Home, 
  Wrench, 
  Briefcase, 
  FileText, 
  Camera, 
  Settings2, 
  ChevronDown,
  Check
} from 'lucide-react';

interface Tab {
  label: string;
  value: string;
  icon: React.ReactNode;
}

interface VehicleTabNavigationProps {
  vehicleId: string;
  currentTab: string;
}

export function VehicleTabNavigation({ vehicleId, currentTab }: VehicleTabNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tabs: Tab[] = [
    { label: 'Home', value: 'overview', icon: <Home size={14} /> },
    { label: 'Service', value: 'service', icon: <Wrench size={14} /> },
    { label: 'Work', value: 'work', icon: <Briefcase size={14} /> },
    { label: 'Docs', value: 'documents', icon: <FileText size={14} /> },
    { label: 'Photos', value: 'photos', icon: <Camera size={14} /> },
    { label: 'Specs', value: 'specs', icon: <Settings2 size={14} /> },
  ];

  const activeTab = tabs.find(t => t.value === currentTab) || tabs[0];

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!mounted) return <div className="h-14 border-b border-subtle pb-4" />;

  return (
    <div className="relative w-full border-b border-subtle pb-4">
      {/* Desktop Navigation: Horizontal Tab Row */}
      {!isMobile && (
        <div className="flex items-center justify-between gap-0.5 animate-in fade-in duration-700">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/vehicles/${vehicleId}?tab=${tab.value}`}
              className={`group flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                currentTab === tab.value 
                  ? "bg-foreground text-background shadow-xl" 
                  : "text-muted hover:text-foreground hover:bg-card-overlay"
              }`}
            >
              <span className={`transition-colors duration-300 ${
                currentTab === tab.value ? "text-background" : "text-dim group-hover:text-muted"
              }`}>
                {tab.icon}
              </span>
              {tab.label}
            </Link>
          ))}
        </div>
      )}

      {/* Mobile Navigation: Compact Dropdown Menu */}
      {isMobile && (
        <div className="animate-in fade-in duration-500" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            className={`flex w-full items-center justify-between rounded-2xl border transition-all duration-300 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isOpen 
                ? 'border-border-strong bg-card-overlay-hover shadow-lg' 
                : 'border-subtle bg-card-overlay hover:bg-card-overlay-hover'
            } px-5 py-4`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 ${
                isOpen ? 'bg-foreground text-background shadow-md' : 'bg-card-overlay text-foreground'
              }`}>
                {activeTab.icon}
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted leading-none mb-1">Current Section</p>
                <p className="text-sm font-black uppercase tracking-widest text-foreground italic leading-none">{activeTab.label}</p>
              </div>
            </div>
            <ChevronDown 
              size={18} 
              className={`text-dim transition-transform duration-500 ease-out ${isOpen ? 'rotate-180 text-muted' : ''}`} 
            />
          </button>

          {/* Mobile Dropdown Panel */}
          <div 
            className={`absolute left-0 right-0 mt-3 overflow-hidden rounded-[32px] border border-subtle bg-[var(--dropdown-bg)] shadow-3xl backdrop-blur-2xl transition-all duration-500 ease-out z-50 origin-top ${
              isOpen 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="p-2.5 grid grid-cols-1 gap-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.value}
                  href={`/vehicles/${vehicleId}?tab=${tab.value}`}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between rounded-[20px] px-4.5 py-4 transition-all duration-300 active:scale-[0.98] group outline-none focus-visible:bg-card-overlay ${
                    currentTab === tab.value 
                      ? "bg-card-overlay text-foreground shadow-sm ring-1 ring-inset ring-border-subtle" 
                      : "text-muted hover:bg-card-overlay hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-500 ${
                      currentTab === tab.value 
                        ? 'bg-foreground text-background shadow-md rotate-[360deg]' 
                        : 'bg-card-overlay text-dim group-hover:bg-card-overlay-hover group-hover:text-muted'
                    }`}>
                      {tab.icon}
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest leading-none pt-0.5">{tab.label}</span>
                  </div>
                  {currentTab === tab.value && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-card-overlay animate-in zoom-in-50 duration-300">
                      <Check size={12} className="text-muted" />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
