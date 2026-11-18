import { setAccountAction, toggleDemoAction, verifyChannelAction } from "@/actions/admin";
import { Form, SubmitButton } from "@/components/form";
import { Badge, PageHeader, tdClass, thClass } from "@/components/ui";
import { labelize } from "@/lib/labels";
import { listMarketplace, listUsers } from "@/lib/store";

export default async function AccountsPage() {
  const [users, streamers] = await Promise.all([
    listUsers(),
    listMarketplace({ category: "", minCcv: 0, maxCcv: 0, minFollowers: 0, search: "", listedOnly: false }),
  ]);
  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Accounts" title="Users and channels" description="Suspending an account stops sign-in. Financial history stays. Verifying a channel lists it when it is also accepting placements." />
      <table className="w-full min-w-[720px]">
        <thead>
          <tr>
            {["Name", "Email", "Role", "Status", ""].map((heading) => (
              <th key={heading || "action"} className={thClass}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((account) => (
            <tr key={account.id}>
              <td className={tdClass}>{account.name}</td>
              <td className={tdClass}>{account.email}</td>
              <td className={tdClass}>{labelize(account.role)}</td>
              <td className={tdClass}>
                <Badge status={account.status} />
              </td>
              <td className={tdClass}>
                <Form action={setAccountAction} className="flex gap-2">
                  <input type="hidden" name="userId" value={account.id} />
                  <input type="hidden" name="status" value={account.status === "active" ? "suspended" : "active"} />
                  <SubmitButton variant={account.status === "active" ? "danger" : "secondary"}>
                    {account.status === "active" ? "Suspend" : "Activate"}
                  </SubmitButton>
                </Form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <section>
        <h2 className="font-serif text-2xl">Channels</h2>
        <table className="mt-3 w-full min-w-[760px]">
          <thead>
            <tr>
              {["Creator", "Twitch", "Verification", "Review", "Marketing demo"].map((heading) => (
                <th key={heading} className={thClass}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {streamers.map((streamer) => (
              <tr key={streamer.id}>
                <td className={tdClass}>{streamer.displayName}</td>
                <td className={tdClass}>{streamer.twitchLogin}</td>
                <td className={tdClass}>
                  <Badge status={streamer.verificationStatus} />
                </td>
                <td className={tdClass}>
                  <div className="flex gap-2">
                    <Form action={verifyChannelAction}>
                      <input type="hidden" name="streamerId" value={streamer.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <SubmitButton variant="secondary">Verify</SubmitButton>
                    </Form>
                    <Form action={verifyChannelAction}>
                      <input type="hidden" name="streamerId" value={streamer.id} />
                      <input type="hidden" name="decision" value="reject" />
                      <SubmitButton variant="ghost">Reject</SubmitButton>
                    </Form>
                  </div>
                </td>
                <td className={tdClass}>
                  <Form action={toggleDemoAction} className="flex items-center gap-2">
                    <input type="hidden" name="streamerId" value={streamer.id} />
                    <label className="flex items-center gap-2 text-xs text-muted">
                      <input type="checkbox" name="enabled" defaultChecked={streamer.publicDemo} />
                      Publish source
                    </label>
                    <SubmitButton variant="ghost">Save</SubmitButton>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs leading-5 text-faint">
          Publishing a source puts its browser URL on the marketing site. That embed does not record playback.
        </p>
      </section>
    </div>
  );
}
