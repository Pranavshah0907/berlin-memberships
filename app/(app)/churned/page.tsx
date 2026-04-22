import PageHeader from "@/components/PageHeader";
import StatusDot from "@/components/StatusDot";
import { getChurned, getPayments, type Member } from "@/lib/data";

export const dynamic = "force-dynamic";

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}
function monthsBetween(a: string, b: string) {
  const d1 = new Date(a), d2 = new Date(b);
  return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
}
function fmtEur(n: number) {
  return n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export default async function ChurnedPage() {
  const [churned, payments] = await Promise.all([getChurned(), getPayments()]);

  const totalPaidByCustomer = payments.reduce<Record<string, number>>((acc, p) => {
    if (!p.customer_id) return acc;
    if (p.status === "succeeded") acc[p.customer_id] = (acc[p.customer_id] ?? 0) + Number(p.amount) - Number(p.refunded_amount);
    return acc;
  }, {});

  const scheduled = churned.filter((m: Member) => m.status === "scheduled_to_cancel");
  const canceled = churned.filter((m: Member) => m.status === "canceled");

  return (
    <>
      <PageHeader
        eyebrow="Churn"
        title="Canceled & scheduled."
        subtitle="Members who have canceled and those whose subscriptions are scheduled to end."
      />

      <div className="px-6 md:px-10 lg:px-12 py-8 md:py-10 space-y-16">
        <Section title="Scheduled to cancel" count={scheduled.length}>
          {scheduled.length === 0 ? (
            <EmptyRow text="No upcoming cancellations." />
          ) : (
            <Table rows={scheduled} totalPaid={totalPaidByCustomer} kind="scheduled" />
          )}
        </Section>

        <Section title="Already canceled" count={canceled.length}>
          {canceled.length === 0 ? (
            <EmptyRow text="No cancellations on record." />
          ) : (
            <Table rows={canceled} totalPaid={totalPaidByCustomer} kind="canceled" />
          )}
        </Section>
      </div>
    </>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline gap-4 mb-7">
        <h2 className="font-display text-[36px] tracking-tight">{title}</h2>
        <span className="font-mono text-[14px] text-muted">{String(count).padStart(2, "0")}</span>
        <span className="flex-1 border-b hairline translate-y-[-8px]" />
      </div>
      {children}
    </section>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <div className="py-14 text-center text-[13px] tracking-smallcap uppercase text-muted border hairline">{text}</div>;
}

function Table({
  rows, totalPaid, kind,
}: { rows: Member[]; totalPaid: Record<string, number>; kind: "scheduled" | "canceled" }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="text-left text-[12px] tracking-smallcap uppercase text-muted border-b hairline">
          <th className="py-4 pr-4 font-normal w-[22%]">Member</th>
          <th className="py-4 pr-4 font-normal w-[20%]">Email</th>
          <th className="py-4 pr-4 font-normal w-[10%]">Plan</th>
          <th className="py-4 pr-4 font-normal w-[12%]">Joined</th>
          <th className="py-4 pr-4 font-normal w-[14%]">{kind === "scheduled" ? "Ends on" : "Ended on"}</th>
          <th className="py-4 pr-4 font-normal w-[10%]">Duration</th>
          <th className="py-4 pr-4 font-normal w-[12%] text-right">Lifetime value</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => {
          const endDate = kind === "scheduled" ? m.cancel_at : m.canceled_at;
          const months = endDate ? monthsBetween(m.start_date, endDate) : 0;
          return (
            <tr key={m.customer_id} className="border-b hairline">
              <td className="py-5 pr-4">
                <div className="font-display text-[20px] leading-tight">{m.name ?? "—"}</div>
                <div className="mt-1.5"><StatusDot status={m.status} /></div>
              </td>
              <td className="py-5 pr-4 text-[15px]">{m.email ?? "—"}</td>
              <td className="py-5 pr-4 text-[15px]">{m.plan ?? "—"}</td>
              <td className="py-5 pr-4 font-mono text-[14px] text-muted">{fmtDate(m.start_date)}</td>
              <td className="py-5 pr-4 font-mono text-[14px]">{fmtDate(endDate)}</td>
              <td className="py-5 pr-4 font-mono text-[14px] text-muted">{months} mo</td>
              <td className="py-5 pr-4 font-mono text-[15px] tabular text-right">{fmtEur(totalPaid[m.customer_id] ?? 0)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
