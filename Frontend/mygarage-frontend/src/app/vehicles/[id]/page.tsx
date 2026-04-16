import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserVehicleWithSpecs, getServiceSummary, getLifetimeCostSummary } from "@/lib/api";
import { mapToVehicleViewModel } from "@/lib/mappers/vehicle";
import { mapToSpecsViewModel } from "@/lib/mappers/specs";
import { mapToServiceHistoryViewModel, mapToServiceSummaryViewModel } from "@/lib/mappers/service";
import { mapToDocumentsViewModel } from "@/lib/mappers/document";
import { mapToWorkJobsViewModel } from "@/lib/mappers/work";
import { mapToRemindersViewModel } from "@/lib/mappers/reminder";
import { VehicleSpecsDisplay } from "@/components/vehicles/VehicleSpecsDisplay";
import { VehicleOverviewDisplay } from "@/components/vehicles/VehicleOverviewDisplay";
import { VehicleDocumentsDisplay } from "@/components/vehicles/VehicleDocumentsDisplay";
import { VehicleWorkDisplay } from "@/components/vehicles/VehicleWorkDisplay";
import { VehiclePhotosDisplay } from "@/components/vehicles/VehiclePhotosDisplay";
import { VehicleBanner } from "@/components/vehicles/VehicleBanner";
import { VehicleServiceClientWrapper } from "@/components/vehicles/VehicleServiceClientWrapper";
import { VehicleTabNavigation } from "@/components/vehicles/VehicleTabNavigation";
import { MaintenanceStatusBadge, MaintenanceStatus } from "@/components/vehicles/MaintenanceStatusBadge";
import { AccountNavMenu } from "@/components/AccountNavMenu";
import { AppFooterBrand } from "@/components/AppFooterBrand";
import { redirect } from "next/navigation";
import Link from "next/link";

type TabType = 'overview' | 'service' | 'specs' | 'documents' | 'work' | 'photos' | 'reminders';

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const { id } = await params;
  const { tab } = await searchParams;
  
  const currentTab = (tab as TabType) || 'overview';
  
  // Fetch data
  let data;
  let serviceSummary = null;
  let costSummary = null;
  try {
    const [vehicleData, summaryData, costData] = await Promise.all([
      getUserVehicleWithSpecs(id),
      getServiceSummary(id).catch(() => null),
      getLifetimeCostSummary(id).catch(() => null)
    ]);
    data = vehicleData;
    serviceSummary = summaryData;
    costSummary = costData;
  } catch (err: any) {
    console.error("Error loading VehicleDetailPage data:", err);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0b0c] px-6 text-center text-white antialiased">
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 shadow-2xl backdrop-blur-md">
          <h2 className="text-xl font-bold text-red-400">Connection Issue</h2>
          <p className="mt-2 text-sm text-white/60 max-w-xs">{err.message || "Could not load vehicle details."}</p>
          <div className="mt-6">
            <Link 
              href="/vehicles"
              className="text-[10px] font-black uppercase tracking-widest text-white/40 underline underline-offset-4 decoration-white/10 hover:text-white"
            >
              Back to Vehicles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Security: Verify ownership
  if (!data.vehicle || data.vehicle.userId !== session.user.id) {
    redirect("/vehicles");
  }
  
  // Deep serialize the vehicle data to ensure all Date objects are converted to strings
  // before passing to Client Components. Next.js 15 requires full serialization.
  const serializedVehicle = JSON.parse(JSON.stringify(data.vehicle));
  
  // Map to View Models using the serialized data
  const vehicle = mapToVehicleViewModel(serializedVehicle);
  const specs = data.specs ? mapToSpecsViewModel(data.specs) : null;
  const services = mapToServiceHistoryViewModel(serializedVehicle.services || []);
  const documents = mapToDocumentsViewModel(serializedVehicle.documents || []);
  const workItems = mapToWorkJobsViewModel(serializedVehicle.workJobs || []);
  
  // Map custom specs and ensure they are serialized
  const customSpecs = (serializedVehicle.customSpecs || []);

  const mappedServiceSummary = mapToServiceSummaryViewModel(serviceSummary?.serviceSummary);

  const isOverviewTab = currentTab === 'overview' || currentTab === 'reminders';

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white antialiased">
      <VehicleBanner 
        bannerImageUrl={serializedVehicle.bannerImageUrl}
        bannerCropX={serializedVehicle.bannerCropX || 50}
        bannerCropY={serializedVehicle.bannerCropY || 50}
        bannerZoom={serializedVehicle.bannerZoom || 1}
      >
        {/* Top Navigation - Streamlined with Overflow Menu */}
        <nav className="mb-12 flex items-center justify-end">
          <AccountNavMenu user={session.user} vehicleId={id} />
        </nav>

        {/* Status Bar */}
        <div className="mb-8 flex flex-wrap items-center justify-start gap-4">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <span className={`h-1.5 w-1.5 rounded-full ${vehicle.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-white/20'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
              {vehicle.status}
            </span>
          </div>

          {mappedServiceSummary?.status && (
            <MaintenanceStatusBadge status={mappedServiceSummary.status as MaintenanceStatus} />
          )}
        </div>

        {/* Header Section */}
        <header className="space-y-2 mt-auto pb-4">
          <h1 className="text-5xl font-extrabold tracking-tighter sm:text-7xl uppercase italic drop-shadow-2xl">
            {vehicle.nickname}
          </h1>
          <div className="space-y-1">
            <p className="text-lg font-bold text-white/80 uppercase tracking-tight drop-shadow-md">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
            <div className="flex items-center gap-3">
              <span className="rounded-md border border-white/10 bg-white/10 backdrop-blur-md px-2 py-0.5 font-mono text-[10px] font-bold text-white/60">
                {vehicle.licensePlate}
              </span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                {vehicle.addedDate}
              </p>
            </div>
          </div>
        </header>
      </VehicleBanner>
      
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="space-y-10">
          <VehicleTabNavigation vehicleId={id} currentTab={currentTab} />

          {/* Main Content Area */}
          <div className="min-h-[400px]">
            {isOverviewTab && (
              <VehicleOverviewDisplay 
                vehicle={vehicle} 
                services={services} 
                workItems={workItems} 
                documents={documents} 
                rawReminders={serializedVehicle.reminders || []}
                serviceSummary={mappedServiceSummary}
                costSummary={costSummary ? JSON.parse(JSON.stringify(costSummary)) : null}
              />
            )}
            {currentTab === 'service' && (
              <VehicleServiceClientWrapper 
                vehicleId={id} 
                vehicleNickname={vehicle.nickname}
                services={services} 
                serviceSummary={mappedServiceSummary} 
                costSummary={costSummary ? JSON.parse(JSON.stringify(costSummary)) : null}
              />
            )}
            {currentTab === 'work' && (
              <VehicleWorkDisplay 
                vehicleId={id} 
                vehicleNickname={vehicle.nickname}
                workItems={workItems} 
                costSummary={costSummary ? JSON.parse(JSON.stringify(costSummary)) : null} 
              />
            )}
            {currentTab === 'documents' && (
              <VehicleDocumentsDisplay 
                vehicleId={id} 
                vehicleNickname={vehicle.nickname}
                documents={documents} 
              />
            )}
            {currentTab === 'photos' && (
              <VehiclePhotosDisplay 
                vehicleId={id} 
                photos={JSON.parse(JSON.stringify(serializedVehicle.photos || []))} 
                bannerImageUrl={serializedVehicle.bannerImageUrl} 
                bannerCropX={serializedVehicle.bannerCropX || 50}
                bannerCropY={serializedVehicle.bannerCropY || 50}
                bannerZoom={serializedVehicle.bannerZoom || 1}
              />
            )}
            {currentTab === 'specs' && (
              <VehicleSpecsDisplay 
                vehicleId={id} 
                specs={specs} 
                customSpecs={customSpecs} 
                savedParts={serializedVehicle.savedParts || []}
                partPresets={serializedVehicle.partPresets || []}
                vehicle={vehicle}
                currentKms={serviceSummary?.serviceSummary?.currentKms}
              />
            )}
          </div>
        </div>

        <AppFooterBrand />
      </div>
    </div>
  );
}
