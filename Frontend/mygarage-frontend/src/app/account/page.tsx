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
        <div className="rounded-[32px] border border-white/5 bg-white/[0.02] p-8 transition-all hover:bg-white/[0.04]">
          <div className="flex items-center gap-6 mb-8">
            {user.image ? (
              <img 
                src={user.image} 
                alt={user.name || "User"} 
                className="h-20 w-20 rounded-3xl border border-white/10 shadow-2xl"
              />
            ) : (
              <div className="h-20 w-20 rounded-3xl border border-white/10 bg-white/5 flex items-center justify-center text-2xl font-black uppercase text-white/20">
                {user.name?.[0] || "?"}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white uppercase italic tracking-tight">{user.name}</h2>
              <p className="text-sm font-medium text-white/40">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4 border-t border-white/5 pt-8">
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

        <div className="rounded-[32px] border border-dashed border-white/10 bg-white/[0.01] p-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10 mb-2">System Notice</p>
          <p className="text-sm font-medium leading-relaxed text-white/30">
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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/20">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-0.5">{label}</p>
        <p className="text-sm font-bold text-white/80">{value}</p>
      </div>
    </div>
  );
}
