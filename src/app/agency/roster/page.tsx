import Link from "next/link";
import { Badge, PageHeader, tdClass, thClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { labelize } from "@/lib/labels";
import { agencyByOwner, roster } from "@/lib/store";

export default async function RosterPage() {
  const user = await requireRole("manager");
  const agency = await agencyByOwner(user.id);
  if (!agency) return null;
  const people = await roster(agency.id);
  return (
    <div>
      <PageHeader eyebrow="Roster" title="Managed creators" />
      <table className="w-full min-w-[640px]">
        <thead>
          <tr>
            {["Creator", "CCV", "Approval", "Verification", "Rate"].map((heading) => (
              <th key={heading} className={thClass}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <tr key={person.id}>
              <td className={tdClass}>
                <Link href={`/agency/roster/${person.id}`}>{person.displayName}</Link>
              </td>
              <td className={tdClass}>{person.avgCcv.toLocaleString("en-US")}</td>
              <td className={tdClass}>{labelize(person.approvalMode)}</td>
              <td className={tdClass}>
                <Badge status={person.verificationStatus} />
              </td>
              <td className={tdClass}>{person.dailyRateCents != null ? `$${(person.dailyRateCents / 100).toFixed(0)}` : "Tier"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
