'use client';

import { signIn, signOut } from "next-auth/react";

export function SignInButton({ callbackUrl }: { callbackUrl?: string }) {
  // Sanitize callbackUrl to prevent loops and ensure it stays within the app
  const getSafeCallbackUrl = () => {
    if (!callbackUrl) return "/vehicles";
    
    // Never callback to root or auth-internal routes
    if (callbackUrl === "/" || callbackUrl.startsWith("/api/auth")) {
      return "/vehicles";
    }
    
    return callbackUrl;
  };

  const finalCallbackUrl = getSafeCallbackUrl();

  const handleSignIn = async () => {
    try {
      await signIn("google", { callbackUrl: finalCallbackUrl });
    } catch (error) {
      console.error("Sign in failed:", error);
      alert("Sign in failed. Check your connection.");
    }
  };

  return (
    <button 
      type="button"
      onClick={handleSignIn}
      className="group relative flex w-full items-center justify-center overflow-hidden rounded-3xl bg-white p-5 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-white/90 active:scale-[0.98]"
    >
      Sign in with Google
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-2 transition-transform group-hover:translate-x-1">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
      </svg>
    </button>
  );
}

export function SignOutButton() {
  return (
    <button 
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex w-full items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-4 text-[10px] font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/10 hover:text-white"
    >
      Sign Out
    </button>
  );
}
