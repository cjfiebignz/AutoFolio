import { VehicleSpecs } from "@/types/autofolio";

export function VehicleSpecsCard({ specs }: { specs: VehicleSpecs | null }) {
  if (!specs || !specs.vehicle) {
    return (
      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6 text-center">
        <p className="text-sm font-medium text-yellow-500/80">
          Vehicle specification data is currently unavailable.
        </p>
      </div>
    );
  }

  const { vehicle, specs: details } = specs;

  return (
    <div className="space-y-6">
      {/* Primary Vehicle Info Card */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-6 shadow-2xl backdrop-blur-md">
        <div className="mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-white/40">Master Specification</span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            {vehicle.make} {vehicle.model}
          </h2>
          <p className="text-sm font-medium text-white/60">{vehicle.variant}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 md:grid-cols-3">
          <SpecItem label="Engine" value={vehicle.engine} />
          <SpecItem label="Transmission" value={vehicle.transmission} />
          <SpecItem label="Drivetrain" value={vehicle.drivetrain} />
        </div>
      </div>

      {/* Detail Sections */}
      <div className="grid gap-6">
        {/* Fluids Section */}
        <Section icon={<DropletIcon />} title="Service Fluids">
          <div className="divide-y divide-white/5">
            {details.fluids.length > 0 ? (
              details.fluids.map((f, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-white/90">{f.fluidType}</p>
                    {f.specCode && <p className="text-xs text-white/40 font-mono">{f.specCode}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{f.capacityLitres}L</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptySectionMessage message="No fluid specs recorded" />
            )}
          </div>
        </Section>

        {/* Torque Specs Section */}
        <Section icon={<WrenchIcon />} title="Torque Settings">
          <div className="divide-y divide-white/5">
            {details.torque.length > 0 ? (
              details.torque.map((t, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-white/90">{t.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-white">{t.torqueNm}</span>
                    <span className="text-[10px] font-bold text-white/40">NM</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptySectionMessage message="No torque specs recorded" />
            )}
          </div>
        </Section>

        {/* Essential Parts Section */}
        <Section icon={<PartsIcon />} title="Reference Parts">
          <div className="divide-y divide-white/5">
            {details.parts.length > 0 ? (
              details.parts.map((p, i) => (
                <div key={i} className="py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white/90">{p.partType}</span>
                    {p.isOem && (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white/60 ring-1 ring-inset ring-white/10">
                        OEM
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40 font-mono tracking-tight">{p.partNumber}</span>
                    <span className="text-white/60 font-medium italic">{p.brand}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptySectionMessage message="No part specs recorded" />
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">{label}</p>
      <p className="text-sm font-semibold text-white/90 truncate">{value}</p>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/60">
          {icon}
        </div>
        <h3 className="text-lg font-bold tracking-tight text-white/90">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function EmptySectionMessage({ message }: { message: string }) {
  return <p className="py-2 text-xs text-white/30 italic">{message}</p>;
}

function DropletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function PartsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
    </svg>
  );
}
