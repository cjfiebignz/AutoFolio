import Link from "next/link";
import { getUserVehicleWithSpecs } from "@/lib/api";
import { mapToVehicleViewModel } from "@/lib/mappers/vehicle";
import { ServiceForm } from "@/components/vehicles/service/ServiceForm";

export default async function NewServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Fetch vehicle context for the form
  const data = await getUserVehicleWithSpecs(id);
  const vehicle = mapToVehicleViewModel(data.vehicle);

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white antialiased">
      <div className="mx-auto max-w-2xl px-6 py-8">
        
        {/* Simple Header */}
        <header className="mb-12 space-y-4">
          <Link 
            href={`/vehicles/${id}?tab=service`}
            className="group flex items-center gap-2 text-sm font-medium text-white/40 transition-colors hover:text-white"
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Cancel
          </Link>
          
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">
              New Record
            </h1>
            <p className="text-sm font-medium text-white/40">
              Adding to <span className="text-white/60">{vehicle.nickname}</span>
            </p>
          </div>
        </header>

        {/* The Form Shell */}
        <ServiceForm vehicleId={id} vehicleNickname={vehicle.nickname} />

      </div>
    </div>
  );
}
