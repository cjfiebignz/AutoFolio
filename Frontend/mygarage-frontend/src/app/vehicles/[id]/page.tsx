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
import { 
  VehicleBanner, 
  BannerStatusWrapper, 
  BannerStatusLabel, 
  BannerNickname, 
  BannerSubheading, 
  BannerPlate, 
  BannerAddedDate 
} from "@/components/vehicles/VehicleBanner";
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center text-foreground antialiased">
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 shadow-2xl backdrop-blur-md">
          <h2 className="text-xl font-bold text-red-400">Connection Issue</h2>
          <p className="mt-2 text-sm text-muted max-w-xs">{err.message || "Could not load vehicle details."}</p>
          <div className="mt-6">
            <Link 
              href="/vehicles"
              className="text-[10px] font-black uppercase tracking-widest text-muted underline underline-offset-4 decoration-border-strong hover:text-foreground"
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
    <div className="min-h-screen bg-surface text-foreground antialiased transition-colors duration-300">
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
          <BannerStatusWrapper>
            <span className={`h-1.5 w-1.5 rounded-full ${vehicle.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-muted opacity-20'}`} />
            <BannerStatusLabel>
              {vehicle.status}
            </BannerStatusLabel>
          </BannerStatusWrapper>

          {mappedServiceSummary?.status && (
            <MaintenanceStatusBadge status={mappedServiceSummary.status as MaintenanceStatus} />
          )}
        </div>

        {/* Header Section */}
        <header className="space-y-2 mt-auto pb-4">
          <BannerNickname>
            {vehicle.nickname}
          </BannerNickname>
          <div className="space-y-1">
            <BannerSubheading>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </BannerSubheading>
            <div className="flex items-center gap-3">
              <BannerPlate>
                {vehicle.licensePlate}
              </BannerPlate>
              <span className="h-1 w-1 rounded-full bg-muted opacity-20" />
              <BannerAddedDate>
                {vehicle.addedDate}
              </BannerAddedDate>
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
                serviceSummary={mappedServiceSummary}
              />
            )}
          </div>
        </div>

        <AppFooterBrand />
      </div>
    </div>
  );
}
