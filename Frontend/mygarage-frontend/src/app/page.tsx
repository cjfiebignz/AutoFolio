import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const isAdmin = user?.role === "admin";
  const { callbackUrl } = await searchParams;

  return (
    <div className="min-h-screen bg-surface text-foreground antialiased flex flex-col items-center justify-center px-6 text-center transition-colors duration-500">
      {/* Brand Hero Section */}
      <div className="flex flex-col items-center w-full">
        {/* Logo Section */}
        <div className="mb-6 relative group">
          <div className="absolute -inset-16 rounded-full bg-foreground/[0.03] blur-3xl opacity-40 group-hover:opacity-60 transition-opacity" />
          <img 
            src="/branding/autofolio-logo.png" 
            alt="AutoFolio Logo" 
            className="relative h-56 sm:h-72 w-auto object-contain mx-auto transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        {/* Wordmark & Slogan */}
        <header className="mb-16 space-y-6 max-w-2xl">
          <h1 className="text-6xl font-extrabold tracking-tighter sm:text-8xl uppercase italic drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] dark:drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] light:drop-shadow-none">
            <span className="text-white dark:text-white light:text-foreground">Auto</span>
            <span className="text-white/50 dark:text-white/50 light:text-muted">Folio</span>
          </h1>

          <p className="mx-auto max-w-xs text-sm sm:text-base font-medium leading-relaxed text-white/40 dark:text-white/40 light:text-muted tracking-[0.2em] uppercase">
            All your vehicles, one place.
          </p>
        </header>
        
        {/* Primary Actions */}
        <div className="w-full max-w-sm space-y-6">
          {session ? (
            <>
              <div className="mb-10 flex flex-col items-center gap-4">
                {user?.image ? (
                  <img 
                    src={user.image} 
                    alt={user.name || "User"} 
                    referrerPolicy="no-referrer"
                    className="h-16 w-16 rounded-full border border-subtle shadow-2xl"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full border border-subtle bg-card-overlay flex items-center justify-center text-xl font-black uppercase text-muted">
                    {user?.name?.[0] || user?.email?.[0] || "?"}
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground opacity-60">
                    Welcome back, {user?.name?.split(" ")[0]}
                  </p>
                  {isAdmin && (
                    <span className="inline-block rounded-full bg-red-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-red-400 ring-1 ring-inset ring-red-500/20">
                      Admin Access
                    </span>
                  )}
                </div>
              </div>

              <Link 
                href="/vehicles" 
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-3xl bg-foreground p-6 text-sm font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Your Vehicles
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-2 transition-transform group-hover:translate-x-1">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </Link>

              <SignOutButton />
            </>
          ) : (
            <>
              <SignInButton callbackUrl={callbackUrl} />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-dim leading-relaxed">
                New users will be registered automatically.<br/>
                Authenticated via Google Cloud Identity.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="mt-20 opacity-20">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted">Automotive Ecosystem v1.0.4</p>
      </footer>
    </div>
  );
}
