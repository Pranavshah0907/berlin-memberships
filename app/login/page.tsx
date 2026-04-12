import Image from "next/image";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden md:flex flex-col justify-between p-12 overflow-hidden bg-paper">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-70"
             style={{ background: "radial-gradient(circle at 30% 30%, #F4B942 0%, #E8933A 45%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-px sunrise-rule" />

        <div className="relative">
          <Image src="/mship/aol-logo.png" alt="Art of Living" width={220} height={80} priority />
        </div>

        <div className="relative">
          <div className="text-[13px] tracking-smallcap uppercase text-muted mb-5">Volume I · MMXXVI</div>
          <h1 className="font-display text-[60px] leading-[0.95] tracking-tight max-w-[520px]">
            A quiet ledger for the <em>Yoga Oase</em> membership practice.
          </h1>
          <p className="mt-7 max-w-md text-[17px] leading-relaxed text-muted">
            Members, payments, and the arc of subscription — kept in one calm place.
          </p>
        </div>

        <div className="relative text-[13px] tracking-smallcap uppercase text-muted">
          Berlin · Yoga Oase · Operations
        </div>
      </section>

      <section className="flex items-center justify-center p-10">
        <div className="w-full max-w-sm">
          <div className="text-[13px] tracking-smallcap uppercase text-muted">Admin access</div>
          <h2 className="font-display text-[44px] mt-2 leading-none tracking-tight">Sign in</h2>
          <p className="mt-5 text-[15px] text-muted leading-relaxed">
            Enter the credentials you were issued for the Berlin Memberships dashboard.
          </p>

          <LoginForm />

          <div className="mt-10 text-[12px] tracking-smallcap uppercase text-muted">
            Automated via LEAP
          </div>
        </div>
      </section>
    </div>
  );
}
