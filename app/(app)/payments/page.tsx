import PageHeader from "@/components/PageHeader";
import PaymentsView from "@/components/PaymentsView";
import { getMembers, getPayments } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const [payments, members] = await Promise.all([getPayments(), getMembers()]);
  const nameByCustomer = Object.fromEntries(members.map((m) => [m.customer_id, m.name ?? "—"]));

  return (
    <>
      <PageHeader
        eyebrow="Payments"
        title="All payments."
        subtitle="Every invoice, filterable by date range and status."
      />
      <div className="px-6 md:px-10 lg:px-12 py-8 md:py-10">
        <PaymentsView payments={payments} nameByCustomer={nameByCustomer} />
      </div>
    </>
  );
}
