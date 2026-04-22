import PageHeader from "@/components/PageHeader";
import RevenueChart from "@/components/RevenueChart";
import { getOverview } from "@/lib/data";

export const dynamic = "force-dynamic";

function fmtEur(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  return v.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}

export default async function Overview() {
  const { mrr, planStats, months } = await getOverview();

  const now = new Date();
  const thisMonthRow = months.find((m: any) => {
    const d = new Date(m.month);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalActive = Number(mrr?.active ?? 0);
  const totalCharge = planStats.reduce((s: number, p: any) => s + Number(p.active) + Number(p.past_due) + Number(p.scheduled_to_cancel) + Number(p.canceled), 0);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="At a glance."
        subtitle="Active members, recurring revenue, and monthly income at a glance."
      />

      <section className="px-6 md:px-10 lg:px-12 py-8 md:py-12">
        <div className="border hairline bg-hairline grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-px">
          <Metric label="Active members"    value={String(totalActive).padStart(2, "0")} hint={`of ${totalCharge} total`} />
          <Metric label="Monthly recurring" value={fmtEur(mrr?.mrr)} hint={`ARR ${fmtEur(mrr?.arr)}`} />
          <Metric label="This month"        value={fmtEur(thisMonthRow?.revenue)} hint={`${thisMonthRow?.succeeded_count ?? 0} payments`} />
          <Metric label="Needs attention"   value={String(Number(mrr?.past_due ?? 0) + Number(mrr?.scheduled_to_cancel ?? 0))} hint={`${mrr?.past_due ?? 0} past due · ${mrr?.scheduled_to_cancel ?? 0} scheduled`} />
        </div>
      </section>

      <section className="px-6 md:px-10 lg:px-12 pb-16">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 2xl:col-span-8">
            <SectionTitle roman="II" title="Revenue, by month" />
            <RevenueChart data={months as any} />
          </div>
          <div className="col-span-12 2xl:col-span-4">
            <SectionTitle roman="III" title="Plan composition" />
            <div className="border-t hairline mt-2">
              {planStats.map((p: any) => {
                const active = Number(p.active);
                const pastDue = Number(p.past_due);
                const scheduled = Number(p.scheduled_to_cancel);
                const total = active + pastDue + scheduled;
                const flags: string[] = [];
                if (pastDue > 0) flags.push(`${pastDue} past due`);
                if (scheduled > 0) flags.push(`${scheduled} scheduled`);
                return (
                  <div key={p.plan} className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-8 gap-y-1 py-5 border-b hairline">
                    <div className="font-display text-[24px] tracking-tight">{p.plan}</div>
                    <div className="text-right">
                      <span className="number-display text-[34px] leading-none tabular">{String(total).padStart(2, "0")}</span>
                      <span className="ml-2 text-[11px] tracking-smallcap uppercase text-muted">{total === 1 ? "member" : "members"}</span>
                    </div>
                    <div className="font-mono text-[14px] text-muted text-right tabular">{fmtEur(p.plan_mrr)}<span className="text-muted">/mo</span></div>
                    {flags.length > 0 && (
                      <div className="col-span-3 text-[11px] tracking-smallcap uppercase text-ember">
                        {flags.join(" · ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionTitle({ roman, title }: { roman: string; title: string }) {
  return (
    <div className="mb-6 flex items-baseline gap-4">
      <span className="font-display text-[17px] text-muted tabular">{roman}</span>
      <span className="text-[13px] tracking-smallcap uppercase text-muted">{title}</span>
      <span className="flex-1 border-b hairline translate-y-[-4px]" />
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-paper py-7 md:py-9 px-6 md:px-8 min-w-0">
      <div className="text-[12px] tracking-smallcap uppercase text-muted">{label}</div>
      <div className="number-display leading-[0.95] mt-3 text-[clamp(34px,4vw,60px)] truncate">{value}</div>
      {hint && <div className="mt-3 text-[13px] text-muted">{hint}</div>}
    </div>
  );
}
