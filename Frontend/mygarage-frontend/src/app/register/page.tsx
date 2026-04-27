import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ArrowLeft } from 'lucide-react';

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect('/vehicles');
  }

  return (
    <div className="min-h-screen bg-surface text-foreground antialiased flex flex-col items-center justify-center px-6 transition-colors duration-500 py-12">
      <div className="w-full max-w-sm space-y-12">
        {/* Header */}
        <header className="space-y-6 text-center">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-dim transition-colors hover:text-foreground mb-4"
          >
            <ArrowLeft size={12} />
            Back to Home
          </Link>
          
          <h1 className="text-4xl font-extrabold tracking-tighter uppercase italic text-foreground/90">
            Create <span className="text-muted">Account</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-dim leading-relaxed">
            Join the AutoFolio ecosystem to track your vehicle lifecycle.
          </p>
        </header>

        {/* Form Section */}
        <RegisterForm />

        {/* Footer Actions */}
        <footer className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border-subtle opacity-30"></span>
            </div>
            <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest">
              <span className="bg-surface px-4 text-muted">Already have an account?</span>
            </div>
          </div>

          <Link 
            href="/" 
            className="inline-block text-[10px] font-black uppercase tracking-widest text-foreground opacity-60 hover:opacity-100 transition-opacity underline underline-offset-8 decoration-border-subtle hover:decoration-foreground"
          >
            Sign in here
          </Link>
        </footer>
      </div>
      
      {/* Branding Footer */}
      <footer className="mt-20 opacity-10 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted">AutoFolio Registration v1.0</p>
      </footer>
    </div>
  );
}
