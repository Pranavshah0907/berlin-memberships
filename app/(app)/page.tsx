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

      <section className="px-12 py-12">
        <div className="grid grid-cols-4 gap-0 border hairline">
          <Metric label="Active members"    value={String(totalActive).padStart(2, "0")} hint={`of ${totalCharge} total`} />
          <Metric label="Monthly recurring" value={fmtEur(mrr?.mrr)} hint={`ARR ${fmtEur(mrr?.arr)}`} />
          <Metric label="This month"        value={fmtEur(thisMonthRow?.revenue)} hint={`${thisMonthRow?.succeeded_count ?? 0} payments`} />
          <Metric label="Needs attention"   value={String(Number(mrr?.past_due ?? 0) + Number(mrr?.scheduled_to_cancel ?? 0))} hint={`${mrr?.past_due ?? 0} past due · ${mrr?.scheduled_to_cancel ?? 0} scheduled`} last />
        </div>
      </section>

      <section className="px-12 pb-16">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-8">
            <SectionTitle roman="II" title="Revenue, by month" />
            <RevenueChart data={months as any} />
          </div>
          <div className="col-span-4">
            <SectionTitle roman="III" title="Plan composition" />
            <div className="space-y-6 mt-2">
              {planStats.map((p: any) => {
                const total = Number(p.active) + Number(p.past_due) + Number(p.scheduled_to_cancel);
                return (
                  <div key={p.plan}>
                    <div className="flex items-baseline justify-between">
                      <div className="font-display text-[26px] tracking-tight">{p.plan}</div>
                      <div className="font-mono text-[13px] text-muted">{total} members · {fmtEur(p.plan_mrr)}/mo</div>
                    </div>
                    <div className="mt-2 flex h-1.5 hairline border">
                      <div className="bg-ember" style={{ width: `${(Number(p.active)/Math.max(1,total))*100}%` }} />
                      <div className="bg-sunrise" style={{ width: `${(Number(p.past_due)/Math.max(1,total))*100}%` }} />
                      <div className="bg-dawn" style={{ width: `${(Number(p.scheduled_to_cancel)/Math.max(1,total))*100}%` }} />
                    </div>
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

function Metric({ label, value, hint, last }: { label: string; value: string; hint?: string; last?: boolean }) {
  return (
    <div className={`py-9 px-8 ${last ? "" : "border-r hairline"}`}>
      <div className="text-[12px] tracking-smallcap uppercase text-muted">{label}</div>
      <div className="number-display text-[60px] leading-[0.95] mt-3">{value}</div>
      {hint && <div className="mt-3 text-[13px] text-muted">{hint}</div>}
    </div>
  );
}
