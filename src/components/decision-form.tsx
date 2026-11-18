import { decidePlacementAction } from "@/actions/placement";
import { Form, SubmitButton } from "@/components/form";
import { Select, Textarea } from "@/components/ui";

export function DecisionForm({ campaignId, streamerId }: { campaignId: string; streamerId: string }) {
  return (
    <Form action={decidePlacementAction} className="space-y-3">
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="streamerId" value={streamerId} />
      <Select name="decision" defaultValue="approved">
        <option value="approved">Approve</option>
        <option value="changes_requested">Request changes</option>
        <option value="rejected">Reject</option>
      </Select>
      <Textarea name="note" placeholder="Required when you reject or request changes." />
      <SubmitButton>Submit decision</SubmitButton>
    </Form>
  );
}
