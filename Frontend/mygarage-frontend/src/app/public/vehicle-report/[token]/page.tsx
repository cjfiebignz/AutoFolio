import { getPublicReport } from "@/lib/api";
import { formatDisplayDate, formatCurrency, formatNumber } from "@/lib/date-utils";
import { PublicReport } from "@/types/autofolio";
import { ShieldCheck, Wrench, Briefcase, FileText, CheckCircle2, Info, Car } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vehicle History Report | MyGarage",
  description: "View a detailed read-only maintenance and service history report.",
};

export default async function PublicVehicleReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  try {
    const report: PublicReport = await getPublicReport(token);
    const { vehicle, services, workHistory, financials, generatedAt } = report;

    return (
      <div className="min-h-screen bg-[#0b0b0c] text-white antialiased print:bg-white print:text-black">
        <div className="mx-auto max-w-3xl px-6 py-12 sm:py-20">
          
          {/* Public Header */}
          <header className="mb-16 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/5 pb-10 print:border-black/10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-white text-black font-black italic text-lg">MG</div>
                <span className="text-xl font-black italic tracking-tighter uppercase">MyGarage</span>
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl uppercase italic drop-shadow-2xl">
                  Vehicle History Report
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 print:text-black/40">
                  Secure Read-Only Verification &bull; Generated {formatDisplayDate(generatedAt)}
                </p>
              </div>
            </div>
            
            <div className="hidden sm:block text-right space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/10 print:text-black/20 italic">Authenticity Guaranteed</p>
              <div className="flex items-center justify-end gap-2 text-green-400/60 print:text-green-600">
                <ShieldCheck size={14} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest">Verified Record</span>
              </div>
            </div>
          </header>

          <main className="space-y-20">
            {/* Vehicle Summary */}
            <section className="space-y-8">
              <div className="flex items-center gap-3 px-1">
                <Car size={16} className="text-blue-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 print:text-black/40">Vehicle Summary</h3>
              </div>
              
              <div className="rounded-[40px] border border-white/5 bg-white/[0.02] p-10 print:border-black/10 print:bg-transparent">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Make & Model</p>
                      <h4 className="text-2xl font-black italic text-white uppercase leading-none print:text-black">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h4>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Plate Number</p>
                      <p className="text-lg font-bold text-white/80 print:text-black">{vehicle.licensePlate || "N/A"}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Current Mileage</p>
                      <h4 className="text-2xl font-black italic text-blue-400 uppercase leading-none">
                        {formatNumber(vehicle.currentOdometer)} <span className="text-xs not-italic tracking-normal text-white/20">KMS</span>
                      </h4>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">VIN</p>
                      <p className="font-mono text-sm text-white/40 print:text-black/60 uppercase">{vehicle.vin || "Not disclosed"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Financial Summary */}
            <section className="space-y-8">
              <div className="flex items-center gap-3 px-1">
                <FileText size={16} className="text-blue-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 print:text-black/40">Lifetime Investment</h3>
              </div>
              
              <div className="overflow-hidden rounded-[40px] border border-white/5 bg-white/[0.02] p-10 print:border-black/10 print:bg-transparent">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Total Verified Spend</p>
                    <p className="text-5xl font-black italic tracking-tighter text-blue-400 uppercase leading-none">
                      {formatCurrency(financials.totalLifetimeCost, financials.currency)}
                    </p>
                  </div>
                  
                  <div className="flex gap-10 border-l border-white/5 pl-0 sm:pl-10 sm:border-solid border-none">
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/10 print:text-black/30">Service</p>
                      <p className="text-xl font-black italic tracking-tight text-white/70 uppercase leading-none print:text-black/70">
                        {formatCurrency(financials.totalServiceCost, financials.currency)}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/10 print:text-black/30">Upgrades</p>
                      <p className="text-xl font-black italic tracking-tight text-white/70 uppercase leading-none print:text-black/70">
                        {formatCurrency(financials.totalDoneWorkCost, financials.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Service History */}
            <section className="space-y-8">
              <div className="flex items-center gap-3 px-1">
                <Wrench size={16} className="text-blue-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 print:text-black/40">Maintenance Log</h3>
              </div>

              {services.length === 0 ? (
                <div className="rounded-[32px] border border-white/5 bg-white/[0.01] p-12 text-center italic text-white/20">
                  No service records disclosed in this report.
                </div>
              ) : (
                <div className="grid gap-4">
                  {services.map((s, i) => (
                    <div key={i} className="flex items-center justify-between rounded-3xl border border-white/5 bg-white/[0.02] p-6 print:border-black/10">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black italic text-white uppercase print:text-black">{s.title}</h4>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">{formatDisplayDate(s.eventDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white/80 print:text-black">{formatNumber(s.odometerAtEvent)} <span className="text-[8px] opacity-30">KMS</span></p>
                        <p className="text-[10px] font-black text-blue-400/60 uppercase">{formatCurrency(s.totalCost, financials.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Work History */}
            <section className="space-y-8">
              <div className="flex items-center gap-3 px-1">
                <Briefcase size={16} className="text-blue-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 print:text-black/40">Technical Work & Projects</h3>
              </div>

              {workHistory.length === 0 ? (
                <div className="rounded-[32px] border border-white/5 bg-white/[0.01] p-12 text-center italic text-white/20">
                  No project history disclosed in this report.
                </div>
              ) : (
                <div className="grid gap-4">
                  {workHistory.map((w, i) => (
                    <div key={i} className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 print:border-black/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-black italic text-white uppercase print:text-black">{w.title}</h4>
                          {w.date && <p className="text-[9px] font-black uppercase tracking-widest text-white/20">{formatDisplayDate(w.date)}</p>}
                        </div>
                        <p className="text-sm font-black text-white/80 print:text-black">{formatCurrency(w.estimate, financials.currency)}</p>
                      </div>
                      {w.notes && (
                        <p className="text-xs text-white/40 leading-relaxed border-t border-white/5 pt-4 print:text-black/60 print:border-black/5">
                          {w.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>

          <footer className="mt-32 space-y-10 border-t border-white/5 pt-16 text-center print:border-black/10">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 print:text-black/20">Shared from MyGarage</p>
              <p className="mx-auto max-w-xs text-xs font-medium leading-relaxed text-white/20 print:text-black/40 italic">
                This is a read-only historical summary of verified records maintained by the vehicle owner.
              </p>
            </div>
            
            <div className="flex justify-center pt-10 opacity-20 hover:opacity-100 transition-opacity print:hidden">
              <Link 
                href="/"
                className="rounded-full border border-white/10 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/5 hover:text-white transition-all"
              >
                Create Your Own Garage
              </Link>
            </div>
          </footer>
        </div>
      </div>
    );
  } catch (err: any) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0b0c] px-6 text-center text-white antialiased">
        <div className="mb-8 h-16 w-16 flex items-center justify-center rounded-3xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-2xl">
          <Info size={32} strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-3">Report Unavailable</h2>
        <p className="text-sm font-medium text-white/40 max-w-xs leading-relaxed">
          The requested vehicle history report could not be found, has expired, or was disabled by the owner.
        </p>
        <div className="mt-12">
          <Link 
            href="/"
            className="text-[10px] font-black uppercase tracking-widest text-white/20 underline underline-offset-8 decoration-white/10 hover:text-white transition-all"
          >
            Back to MyGarage
          </Link>
        </div>
      </div>
    );
  }
}
