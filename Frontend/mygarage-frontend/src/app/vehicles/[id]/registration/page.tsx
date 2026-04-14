import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserVehicleWithSpecs } from "@/lib/api";
import { VehicleRegistrationDisplay } from "@/components/vehicles/VehicleRegistrationDisplay";
import { AppFooterBrand } from "@/components/AppFooterBrand";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function RegistrationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const { id } = await params;
  
  let data;
  try {
    data = await getUserVehicleWithSpecs(id);
  } catch (err) {
    notFound();
  }

  if (!data.vehicle || data.vehicle.userId !== session.user.id) {
    redirect("/vehicles");
  }

  const vehicle = data.vehicle;
  const registrations = JSON.parse(JSON.stringify(vehicle.registrations || []));

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white antialiased">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <header className="mb-12 space-y-6">
          <nav>
            <Link 
              href={`/vehicles/${id}`}
              className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 transition-colors hover:text-white"
            >
              <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-1" />
              Back to Vehicle
            </Link>
          </nav>
          
          <div className="flex items-end justify-between border-b border-white/5 pb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/50 mb-1">Compliance Management</p>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none">
                {vehicle.nickname || 'Vehicle'}
              </h1>
            </div>
            <div className="text-right">
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] font-bold text-white/40 uppercase">
                {vehicle.licensePlate || 'No Plate'}
              </span>
            </div>
          </div>
        </header>

        <VehicleRegistrationDisplay 
          vehicleId={id} 
          registrations={registrations} 
        />

        <div className="mt-20">
          <AppFooterBrand />
        </div>
      </div>
    </div>
  );
}
