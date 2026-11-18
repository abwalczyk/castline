import { saveProfile } from "@/actions/brand";
import { Form, SubmitButton } from "@/components/form";
import { Field, Input, PageHeader, Select } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { BRAND_VERTICALS } from "@/lib/constants";
import { brandByOwner } from "@/lib/store";

export default async function BrandProfilePage() {
  const user = await requireRole("brand");
  const brand = await brandByOwner(user.id);
  if (!brand) return null;
  return (
    <div>
      <PageHeader eyebrow="Account" title="Advertiser profile" description="This is the company brands see on invoices and the industry used for category checks." />
      <Form action={saveProfile} className="max-w-xl space-y-4">
        <Field label="Company">
          <Input name="companyName" defaultValue={brand.companyName} required />
        </Field>
        <Field label="Website">
          <Input name="website" defaultValue={brand.website} placeholder="https://" />
        </Field>
        <Field label="Industry">
          <Select name="industry" defaultValue={brand.industry}>
            {BRAND_VERTICALS.map((vertical) => (
              <option key={vertical} value={vertical}>
                {vertical}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Billing email">
          <Input name="billingEmail" type="email" defaultValue={brand.billingEmail} required />
        </Field>
        <SubmitButton>Save profile</SubmitButton>
      </Form>
    </div>
  );
}
