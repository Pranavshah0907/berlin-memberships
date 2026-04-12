import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import SignOutButton from "@/components/SignOutButton";

const NAV = [
  { href: "/",         label: "Overview",  num: "I"   },
  { href: "/members",  label: "Members",   num: "II"  },
  { href: "/payments", label: "Payments",  num: "III" },
  { href: "/churned",  label: "Churn",     num: "IV"  },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex">
      <aside className="w-[280px] shrink-0 border-r hairline flex flex-col sticky top-0 h-screen">
        <div className="px-7 pt-8 pb-6">
          <Image src="/mship/aol-logo.png" alt="Art of Living" width={210} height={74} priority />
          <div className="mt-6 font-display text-[26px] leading-[1.05] tracking-tight">
            Berlin<br/>Memberships
          </div>
          <div className="mt-3 text-[12px] tracking-smallcap uppercase text-muted">
            Yoga Oase · Operations
          </div>
        </div>

        <div className="sunrise-rule mx-7" />

        <nav className="px-4 pt-6 flex-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-baseline gap-4 px-3 py-3 rounded hover:bg-hairline/40 transition-colors"
            >
              <span className="font-display text-[15px] text-muted w-7 tabular">{item.num}</span>
              <span className="text-[16px] tracking-tight">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-7 pb-8 pt-6 border-t hairline space-y-2">
          <div className="text-[12px] tracking-smallcap uppercase text-muted">Signed in</div>
          <div className="text-[14px] truncate">{user.email}</div>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
