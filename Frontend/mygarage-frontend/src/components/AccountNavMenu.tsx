'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { 
  MoreVertical, 
  LogOut, 
  Edit3, 
  ChevronLeft, 
  User, 
  CreditCard, 
  Settings, 
  Shield,
  Plus
} from 'lucide-react';
import { AddVehicleLink } from './vehicles/AddVehicleLink';

interface AccountNavMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  vehicleId?: string;
}

export function AccountNavMenu({ user, vehicleId }: AccountNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const isCollectionPage = pathname === '/vehicles';

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center gap-3">
        {/* User Identity Presence */}
        <div className="flex flex-col items-end text-right hidden sm:flex">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground opacity-80 leading-none">
            {user.name}
          </p>
          <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-dim">
            Active Session
          </p>
        </div>

        {/* Avatar & Trigger Group */}
        <div className="flex items-center gap-2 rounded-2xl bg-card-overlay border border-subtle p-1.5 transition-all hover:bg-card-overlay-hover">
          {user.image ? (
            <img 
              src={user.image} 
              alt={user.name || "User"} 
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-xl border border-subtle shadow-lg"
            />
          ) : (
            <div className="h-8 w-8 rounded-xl border border-subtle bg-card-overlay flex items-center justify-center text-[10px] font-black uppercase text-muted shadow-lg">
              {user.name?.[0] || "?"}
            </div>
          )}
          
          <button
            type="button"
            onClick={toggleMenu}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              isOpen ? 'bg-foreground text-background' : 'text-muted hover:text-foreground hover:bg-card-overlay'
            }`}
            aria-label="Open navigation menu"
            aria-expanded={isOpen}
          >
            <MoreVertical size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Dropdown Panel */}
      <div 
        className={`absolute right-0 mt-4 w-64 overflow-y-auto max-h-[calc(100vh-120px)] rounded-[32px] border border-subtle bg-[var(--dropdown-bg)] shadow-2xl backdrop-blur-xl transition-all duration-300 z-[100] origin-top-right no-scrollbar ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="p-2 space-y-1.5">
          {/* Group: Navigation (only if relevant) */}
          {(!isCollectionPage || vehicleId) && (
            <>
              <div className="px-4 py-2 mt-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Navigation</p>
              </div>
              
              {!isCollectionPage && (
                <MenuLink 
                  href="/vehicles" 
                  icon={<ChevronLeft size={16} />} 
                  label="Back to Vehicles" 
                  onClick={() => setIsOpen(false)}
                />
              )}

              {isCollectionPage && (
                <AddVehicleLink 
                  className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-foreground opacity-60 transition-all hover:bg-card-overlay hover:text-foreground active:scale-[0.98]"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-muted group-hover:text-foreground transition-colors"><Plus size={16} /></span>
                  Register New Vehicle
                </AddVehicleLink>
              )}
              
              {vehicleId && (
                <MenuLink 
                  href={`/vehicles/${vehicleId}/edit`} 
                  icon={<Edit3 size={16} />} 
                  label="Edit Vehicle Details" 
                  onClick={() => setIsOpen(false)}
                />
              )}

              <div className="my-2 border-t border-subtle mx-2" />
            </>
          )}

          {/* Group: Account */}
          <div className={`px-4 py-2 ${(!isCollectionPage || vehicleId) ? '' : 'mt-2'}`}>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Account</p>
          </div>
          
          <MenuLink 
            href="/account" 
            icon={<User size={16} />} 
            label="Account Details" 
            onClick={() => setIsOpen(false)}
          />
          <MenuLink 
            href="/account/subscription" 
            icon={<CreditCard size={16} />} 
            label="Subscription" 
            onClick={() => setIsOpen(false)}
          />
          <MenuLink 
            href="/account/preferences" 
            icon={<Settings size={16} />} 
            label="Preferences" 
            onClick={() => setIsOpen(false)}
          />

          <div className="my-2 border-t border-subtle mx-2" />

          {/* Group: Session / App */}
          <div className="px-4 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">System</p>
          </div>
          
          <MenuLink 
            href="/account/legal" 
            icon={<Shield size={16} />} 
            label="Legal & Privacy" 
            onClick={() => setIsOpen(false)}
          />
          
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-red-400/80 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-[0.98]"
          >
            <LogOut size={16} strokeWidth={2.5} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-foreground opacity-60 transition-all hover:bg-card-overlay hover:text-foreground active:scale-[0.98]"
    >
      <span className="text-muted group-hover:text-foreground transition-colors">{icon}</span>
      {label}
    </Link>
  );
}
