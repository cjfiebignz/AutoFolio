import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";
import { EmailSignInForm } from "@/components/auth/EmailSignInForm";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; success?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const isAdmin = user?.role === "admin";
  const { callbackUrl, success } = await searchParams;

  return (
    <div className="min-h-screen bg-surface text-foreground antialiased flex flex-col items-center justify-center px-6 text-center transition-colors duration-500 py-12">
      {/* Brand Hero Section */}
      <div className="flex flex-col items-center w-full max-w-sm">
        {/* Logo Section */}
        <div className="mb-6 relative group">
          <div className="absolute -inset-16 rounded-full bg-foreground/[0.03] blur-3xl opacity-40 group-hover:opacity-60 transition-opacity" />
          <img 
            src="/branding/autofolio-logo.png" 
            alt="AutoFolio Logo" 
            className="relative h-44 sm:h-56 w-auto object-contain mx-auto transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        {/* Wordmark & Slogan */}
        <header className="mb-10 space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl uppercase italic drop-shadow-[0_0_30px_var(--border-subtle)]">
            <span className="text-foreground">Auto</span>
            <span className="text-muted">Folio</span>
          </h1>

          <p className="mx-auto max-w-xs text-[10px] font-medium leading-relaxed text-muted tracking-[0.2em] uppercase">
            All your vehicles, one place.
          </p>
        </header>
        
        {/* Primary Actions */}
        <div className="w-full space-y-8">
          {session ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                {user?.image ? (
                  <img 
                    src={user.image} 
                    alt={user.name || "User"} 
                    referrerPolicy="no-referrer"
                    className="h-16 w-16 rounded-full border border-border-subtle shadow-2xl"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full border border-border-subtle bg-card-overlay flex items-center justify-center text-xl font-black uppercase text-muted shadow-2xl">
                    {user?.name?.[0] || user?.email?.[0] || "?"}
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground opacity-60">
                    Welcome back, {user?.name?.split(" ")[0] || 'Member'}
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
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-3xl bg-foreground p-6 text-sm font-black uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-[0.98] shadow-xl"
              >
                Your Vehicles
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-2 transition-transform group-hover:translate-x-1">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </Link>

              <SignOutButton />
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {success === 'registered' && (
                <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-[10px] font-bold text-green-500 uppercase tracking-widest animate-in zoom-in-95">
                  Registration successful. Please sign in.
                </div>
              )}

              {/* Email Sign In */}
              <EmailSignInForm callbackUrl={callbackUrl} />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border-subtle opacity-30"></span>
                </div>
                <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest">
                  <span className="bg-surface px-4 text-dim">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In */}
              <SignInButton callbackUrl={callbackUrl} />

              <div className="pt-4 flex flex-col gap-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-dim leading-relaxed">
                  Don't have an account?
                </p>
                <Link 
                  href="/register" 
                  className="inline-block text-[10px] font-black uppercase tracking-widest text-foreground opacity-60 hover:opacity-100 transition-opacity underline underline-offset-8 decoration-border-subtle hover:decoration-foreground"
                >
                  Create Account
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="mt-20 opacity-20 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-dim leading-relaxed">
          Authenticated via Google Cloud &<br/>
          Standard Credentials Hub
        </p>
      </footer>
    </div>
  );
}
