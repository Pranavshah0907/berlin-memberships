import PageHeader from "@/components/PageHeader";
import MembersTable from "@/components/MembersTable";
import { getMembers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await getMembers();
  return (
    <>
      <PageHeader
        eyebrow="Members"
        title="All members."
        subtitle="Every Yoga Oase subscriber — active, past due, scheduled to cancel, or canceled."
      />
      <div className="px-12 py-10">
        <MembersTable members={members} />
      </div>
    </>
  );
}
