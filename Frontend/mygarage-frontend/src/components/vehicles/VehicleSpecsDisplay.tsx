import { MasterSpecViewModel, SpecDetailItem, SpecsViewModel } from "@/lib/mappers/specs";
import { VehicleUserSpecsDisplay } from "./VehicleUserSpecsDisplay";
import { VehiclePartsDisplay } from "./VehiclePartsDisplay";
import { UserVehicleCustomSpec, SavedPart, PartPreset } from "@/types/autofolio";
import { VehicleViewModel } from "@/lib/mappers/vehicle";
import { TabIntroBlurb } from '../ui/TabIntroBlurb';
import { ServiceSummaryViewModel } from "@/lib/mappers/service";
import { Database, Info } from 'lucide-react';

export function VehicleSpecsDisplay({ 
  vehicleId, 
  specs, 
  customSpecs,
  savedParts = [],
  partPresets = [],
  vehicle,
  serviceSummary
}: { 
  vehicleId: string;
  specs: SpecsViewModel | null;
  customSpecs: UserVehicleCustomSpec[];
  savedParts?: SavedPart[];
  partPresets?: PartPreset[];
  vehicle: VehicleViewModel;
  serviceSummary?: ServiceSummaryViewModel | null;
}) {
  const hasReferenceData = !!specs && !!specs.master.make && !!specs.master.model;
  const currentKms = serviceSummary?.currentOdometer;

  return (
    <div className="space-y-12 pb-12">
      {/* Tab Header */}
      <div className="px-1">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">Specifications</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400/50">Technical Mechanical Blueprint</p>
        </div>
      </div>

      {/* Intro Blurb */}
      <TabIntroBlurb 
        tab="specs" 
        title="Technical Blueprint" 
        description="Access deep mechanical specifications, fluid capacities, and part numbers for precise vehicle maintenance." 
      />

      {/* 1. Parts Collection Section (NEW) */}
      <VehiclePartsDisplay 
        vehicleId={vehicleId}
        savedParts={savedParts}
        partPresets={partPresets}
        vehicle={vehicle}
      />

      {/* 2. User Defined Specs Section (Personal Spec Library) */}
      <VehicleUserSpecsDisplay 
        vehicleId={vehicleId} 
        customSpecs={customSpecs} 
        vehicle={vehicle}
        currentKms={currentKms}
      />

      {/* Reference Specs Section (SpecHUB Data) */}
      {hasReferenceData && specs && (
        <section className="space-y-6 opacity-60">
          <div className="px-1 space-y-0.5">
            <h3 className="text-lg font-bold tracking-tight text-white/90">Reference Specifications</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Technical Master Data (Non-editable)</p>
          </div>
          
          <div className="space-y-6">
            <MasterSpecBlock master={specs.master} />
            <div className="grid gap-6">
              <SpecSection icon={<DropletIcon />} title="Service Fluids" items={specs.fluids} />
              <SpecSection icon={<WrenchIcon />} title="Torque Settings" items={specs.torque} />
              <SpecSection icon={<PartsIcon />} title="Reference Parts" items={specs.parts} />
            </div>
          </div>
        </section>
      )}

      {/* 3. SpecHUB Status Banner (MOVED TO BOTTOM & RE-TONED) */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.01] p-8">
        <div className="absolute -inset-4 rounded-full bg-blue-500/[0.02] blur-3xl opacity-50" />
        <div className="relative flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-blue-400/40">
            <Database size={32} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <div className="flex flex-col md:flex-row items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Future Product Notice</span>
              <span className="hidden md:block h-1 w-1 rounded-full bg-white/10" />
              <h4 className="text-xs font-black uppercase tracking-widest text-white/60">SpecHUB Global Synchronization</h4>
            </div>
            <p className="mx-auto md:mx-0 max-w-[400px] text-xs font-medium leading-relaxed text-white/40 italic">
              Our engineering team is currently mapping thousands of vehicle variants to provide automated mechanical specifications and OEM part numbers directly to your garage.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-400/40">
              <Info size={12} />
              <span>Integration Phase: 1.2 (Active Development)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function MasterSpecBlock({ master }: { master: MasterSpecViewModel }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-6 shadow-2xl backdrop-blur-md">
      <div className="mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Vehicle Architecture</span>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">{master.make} {master.model}</h2>
        <p className="text-sm font-medium text-white/60">{master.variant}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 md:grid-cols-3">
        <SpecSummaryItem label="Engine" value={master.engine} />
        <SpecSummaryItem label="Transmission" value={master.transmission} />
        <SpecSummaryItem label="Drivetrain" value={master.drivetrain} />
      </div>
    </div>
  );
}

export function SpecSection({ 
  icon, 
  title, 
  items 
}: { 
  icon: React.ReactNode; 
  title: string; 
  items: SpecDetailItem[] 
}) {
  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/60">
          {icon}
        </div>
        <h3 className="text-sm font-bold tracking-tight text-white/90 uppercase">{title}</h3>
      </div>
      
      <div className="divide-y divide-white/5">
        {items.length > 0 ? (
          items.map((item, i) => <SpecRow key={i} item={item} />)
        ) : (
          <EmptySpecState message={`No ${title.toLowerCase()} recorded`} />
        )}
      </div>
    </div>
  );
}

export function SpecRow({ item }: { item: SpecDetailItem }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white/90">{item.label}</p>
          {item.isOem && (
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-black uppercase text-white/60 ring-1 ring-inset ring-white/10">
              OEM
            </span>
          )}
        </div>
        {item.subValue && !item.isOem && (
          <p className="text-[10px] text-white/40 font-mono tracking-tight">{item.subValue}</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-white">{item.value}</p>
        {item.isOem && item.subValue && (
          <p className="text-[10px] text-white/40 font-medium italic">{item.subValue}</p>
        )}
      </div>
    </div>
  );
}

export function EmptySpecState({ message }: { message: string }) {
  return <p className="py-2 text-xs text-white/30 italic">{message}</p>;
}

function SpecSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">{label}</p>
      <p className="text-sm font-semibold text-white/90 truncate">{value}</p>
    </div>
  );
}

function DropletIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>;
}

function WrenchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
}

function PartsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" /></svg>;
}
