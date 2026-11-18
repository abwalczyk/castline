import { PageHeader, tdClass, thClass } from "@/components/ui";
import { listAudit } from "@/lib/store";

export default async function AuditPage() {
  const entries = await listAudit();
  return (
    <div>
      <PageHeader eyebrow="Audit" title="Recent actions" description="Account changes, reviews, payments, and token revocation are written here." />
      <table className="w-full min-w-[720px]">
        <thead>
          <tr>
            {["When", "Actor", "Action", "Entity"].map((heading) => (
              <th key={heading} className={thClass}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className={tdClass}>{entry.createdAt}</td>
              <td className={tdClass}>{entry.actorEmail ?? "system"}</td>
              <td className={tdClass}>{entry.action}</td>
              <td className={tdClass}>
                {entry.entityType} {entry.entityId ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
