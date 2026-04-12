import PageHeader from "@/components/PageHeader";
import MembersTable from "@/components/MembersTable";
import { getMembers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await getMembers();
  return (
    <>
      <PageHeader
        eyebrow="Volume II · Members"
        title="The Register."
        subtitle="Every subscriber of the Yoga Oase — active, scheduled, past due, and departed."
      />
      <div className="px-12 py-10">
        <MembersTable members={members} />
      </div>
    </>
  );
}
