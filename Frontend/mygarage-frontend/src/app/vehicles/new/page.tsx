import Link from "next/link";
import { VehicleRegistrationForm } from "@/components/vehicles/VehicleRegistrationForm";
import { AppFooterBrand } from "@/components/AppFooterBrand";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPreferences } from "@/lib/api";
import { redirect } from "next/navigation";

export default async function NewVehiclePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  // Pre-flight limit check
  let canAdd = true;
  try {
    const prefs = await getUserPreferences(session.user.id);
    canAdd = prefs.canAddVehicle;
  } catch (err) {
    console.error("Error checking vehicle limit on /new:", err);
    // If check fails, we allow them to see the form but the form submit will still be gated by backend.
  }

  if (!canAdd) {
    redirect("/vehicles");
  }

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white antialiased">
      <div className="mx-auto max-w-2xl px-6 py-12">
        
        {/* Simple Header */}
        <header className="mb-12 space-y-4">
          <Link 
            href="/vehicles"
            className="group flex items-center gap-2 text-sm font-medium text-white/40 transition-colors hover:text-white"
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Cancel
          </Link>
          
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">
              Register Vehicle
            </h1>
            <p className="text-sm font-medium text-white/40">
              Add a new vehicle to your collection.
            </p>
          </div>
        </header>

        {/* The Form Shell */}
        <VehicleRegistrationForm />

        <AppFooterBrand />
      </div>
    </div>
  );
}
