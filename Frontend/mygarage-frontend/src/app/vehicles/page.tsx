import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from 'next/link';
import { getUserVehicles, getUserPreferences } from '@/lib/api';
import { getEntitlements } from '@/lib/entitlements';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { AccountNavMenu } from '@/components/AccountNavMenu';
import { AutoFolioLogo } from '@/components/AutoFolioLogo';
import { AppFooterBrand } from '@/components/AppFooterBrand';
import { redirect } from "next/navigation";
import { UserVehicle } from "@/types/autofolio";
import { Plus, Car } from "lucide-react";
import { GarageCalendarTrigger } from '@/components/vehicles/GarageCalendarTrigger';
import { GarageSummaryBar } from '@/components/vehicles/GarageSummaryBar';
import { AddVehicleLink } from '@/components/vehicles/AddVehicleLink';

export default async function VehiclesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = session.user;

  let vehicles: UserVehicle[] = [];
  let planState = { plan: 'free', vehicleLimit: 1, currentVehicleCount: 0, canAddVehicle: true };
  let error: string | null = null;

  try {
    const [vehiclesData, prefs] = await Promise.all([
      getUserVehicles(session.user.id),
      getUserPreferences(session.user.id)
    ]);
    vehicles = vehiclesData;
    planState = prefs;
  } catch (err: any) {
    console.error("Error loading VehiclesPage data:", err);
    error = err.message || "An unexpected error occurred while loading your collection.";
  }
  
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center text-foreground antialiased">
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 shadow-2xl backdrop-blur-md">
          <h2 className="text-xl font-bold text-red-400">Connection Issue</h2>
          <p className="mt-2 text-sm text-white/60 max-w-xs">{error}</p>
          <div className="mt-6">
            <Link 
              href="/vehicles" 
              className="text-[10px] font-black uppercase tracking-widest text-white/40 underline underline-offset-4 decoration-border-strong hover:text-white"
            >
              Try Again
            </Link>
          </div>
        </div>
        <Link href="/" className="text-xs font-bold text-white/20 hover:text-white/40 transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  const isLimitReached = !planState.canAddVehicle;
  const entitlements = getEntitlements(planState.plan as any);

  return (
    <div className="min-h-screen bg-surface text-foreground antialiased transition-colors duration-300">
      <div className="mx-auto max-w-2xl px-6 py-12">
        
        {/* Top Navigation */}
        <nav className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AutoFolioLogo height={36} showText={true} />
          </div>
          <AccountNavMenu user={user} />
        </nav>

        {/* Header Section */}
        <header className="mb-16 space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl uppercase italic text-foreground">
                Your <span className="text-muted opacity-60">Collection</span>
              </h1>
            </div>
            <p className="text-[11px] font-bold text-muted uppercase tracking-[0.1em]">
              All your vehicles, one place.
            </p>
          </div>
        </header>

        {/* Vehicles List */}
        <div className="space-y-8">
          <GarageSummaryBar vehicles={vehicles} />
          {vehicles.length === 0 ? (
            <div className="group relative flex flex-col items-center justify-center rounded-[40px] border border-dashed border-border-subtle bg-foreground/[0.01] py-32 text-center transition-all hover:bg-foreground/[0.02]">
              <div className="mb-8 relative">
                <div className="absolute -inset-4 rounded-full bg-foreground/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-[32px] border border-border-subtle bg-card-overlay text-muted group-hover:text-foreground transition-colors shadow-2xl">
                  <Car size={40} strokeWidth={1} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-muted">Your collection is currently empty</h3>
              <p className="mx-auto mt-2 max-w-[240px] text-sm font-medium leading-relaxed text-muted/60 mb-10">
                Register your first vehicle to start tracking maintenance, specs, and history.
              </p>
              <AddVehicleLink 
                className="flex h-14 items-center justify-center rounded-2xl bg-foreground px-10 text-xs font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] shadow-2xl"
              >
                Start Registration
              </AddVehicleLink>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}
        </div>

        {/* Action Area */}
        <div className="mt-16 space-y-8">
          {vehicles.length > 0 && (
            <div className="flex flex-col items-center justify-center gap-4">
              <AddVehicleLink 
                className="group flex items-center gap-3 rounded-full bg-foreground/5 border border-border-subtle px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted transition-all hover:bg-foreground/10 hover:text-foreground active:scale-[0.98]"
              >
                <Plus size={14} className="text-dim group-hover:text-foreground" />
                {isLimitReached 
                  ? (planState.plan === 'pro' ? "Unlock Fleet Tier" : "Unlock Full Garage") 
                  : "Add Another Vehicle"}
              </AddVehicleLink>
              {isLimitReached && planState.plan === 'pro' && (
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-500/40 italic">
                  Future upgrade coming
                </p>
              )}
            </div>
          )}

          <footer className="border-t border-border-subtle pt-10 text-center">
            <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${isLimitReached ? 'text-blue-500/40' : 'text-dim'}`}>
              {entitlements.label} Plan &bull; {vehicles.length} / {planState.vehicleLimit} Used
            </p>
            {isLimitReached && planState.plan === 'free' && (
              <p className="mt-2 text-[8px] font-bold uppercase tracking-widest text-muted italic">
                Free plan includes up to 1 vehicle. Upgrade to Pro to increase this limit.
              </p>
            )}
          </footer>
        </div>

        <AppFooterBrand />
      </div>
    </div>
  );
}
