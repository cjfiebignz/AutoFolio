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

  if (!mounted) return <div className="h-14 border-b border-white/5 pb-4" />;

  return (
    <div className="relative w-full border-b border-white/5 pb-4">
      {/* Desktop Navigation: Horizontal Tab Row */}
      {!isMobile && (
        <div className="flex items-center justify-between gap-0.5 animate-in fade-in duration-700">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/vehicles/${vehicleId}?tab=${tab.value}`}
              className={`group flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
                currentTab === tab.value 
                  ? "bg-white text-black shadow-xl" 
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <span className={`transition-colors duration-300 ${
                currentTab === tab.value ? "text-black" : "text-white/20 group-hover:text-white/60"
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
            className={`flex w-full items-center justify-between rounded-2xl border transition-all duration-300 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
              isOpen 
                ? 'border-white/20 bg-white/10 shadow-lg' 
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            } px-5 py-4`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 ${
                isOpen ? 'bg-white text-black shadow-md' : 'bg-white/10 text-white'
              }`}>
                {activeTab.icon}
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 leading-none mb-1">Current Section</p>
                <p className="text-sm font-black uppercase tracking-widest text-white italic leading-none">{activeTab.label}</p>
              </div>
            </div>
            <ChevronDown 
              size={18} 
              className={`text-white/20 transition-transform duration-500 ease-out ${isOpen ? 'rotate-180 text-white/60' : ''}`} 
            />
          </button>

          {/* Mobile Dropdown Panel */}
          <div 
            className={`absolute left-0 right-0 mt-3 overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0b0c]/98 shadow-3xl backdrop-blur-2xl transition-all duration-500 ease-out z-50 origin-top ${
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
                  className={`flex items-center justify-between rounded-[20px] px-4.5 py-4 transition-all duration-300 active:scale-[0.98] group outline-none focus-visible:bg-white/5 ${
                    currentTab === tab.value 
                      ? "bg-white/[0.08] text-white shadow-sm ring-1 ring-inset ring-white/10" 
                      : "text-white/40 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-500 ${
                      currentTab === tab.value 
                        ? 'bg-white text-black shadow-md rotate-[360deg]' 
                        : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white'
                    }`}>
                      {tab.icon}
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest leading-none pt-0.5">{tab.label}</span>
                  </div>
                  {currentTab === tab.value && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 animate-in zoom-in-50 duration-300">
                      <Check size={12} className="text-white/60" />
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
