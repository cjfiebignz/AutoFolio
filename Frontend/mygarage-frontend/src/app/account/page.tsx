import { AccountPageShell } from "@/components/AccountPageShell";
import { User, Mail, ShieldCheck } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AccountDetailsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = session.user;

  return (
    <AccountPageShell 
      title="Account Details" 
      subtext="Identity & Security Management"
    >
      <div className="space-y-6">
        <div className="rounded-[32px] border border-border-subtle bg-card-overlay p-8 transition-all hover:bg-card-overlay-hover">
          <div className="flex items-center gap-6 mb-8">
            {user.image ? (
              <img 
                src={user.image} 
                alt={user.name || "User"} 
                className="h-20 w-20 rounded-3xl border border-border-subtle shadow-2xl"
              />
            ) : (
              <div className="h-20 w-20 rounded-3xl border border-border-subtle bg-foreground/5 flex items-center justify-center text-2xl font-black uppercase text-muted">
                {user.name?.[0] || "?"}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-foreground uppercase italic tracking-tight">{user.name}</h2>
              <p className="text-sm font-medium text-muted">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4 border-t border-border-subtle pt-8">
            <AccountInfoItem 
              icon={<User size={18} />} 
              label="Profile Name" 
              value={user.name || "Not set"} 
            />
            <AccountInfoItem 
              icon={<Mail size={18} />} 
              label="Email Address" 
              value={user.email || "Not set"} 
            />
            <AccountInfoItem 
              icon={<ShieldCheck size={18} />} 
              label="Account Security" 
              value="Verified Session" 
            />
          </div>
        </div>

        <div className="rounded-[32px] border border-dashed border-border-subtle bg-foreground/[0.01] p-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-dim mb-2">System Notice</p>
          <p className="text-sm font-medium leading-relaxed text-muted">
            Advanced account management tools, password controls, and multi-factor authentication settings will appear here in a future update.
          </p>
        </div>
      </div>
    </AccountPageShell>
  );
}

function AccountInfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-muted">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-dim mb-0.5">{label}</p>
        <p className="text-sm font-bold text-foreground opacity-80">{value}</p>
      </div>
    </div>
  );
}
