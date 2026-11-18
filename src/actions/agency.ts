"use server";

import { run } from "@/lib/action-run";
import { requireRole } from "@/lib/auth";
import { success } from "@/lib/action-state";
import { AppError } from "@/lib/errors";
import { RESTRICTED_TAGS } from "@/lib/constants";
import { field, optionalCents, uuidField } from "@/lib/fields";
import { createAgencyInvite, saveAgencyRules } from "@/lib/operations";
import { parseCheckedTags, parseEmail } from "@/lib/validate";

export async function inviteCreator(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("manager");
    const email = parseEmail(formData.get("email"));
    if (!email) throw new AppError("Enter the creator's email.");
    const code = await createAgencyInvite(user, email);
    return success(`Invite ${code} is ready. The creator enters it on their channel page.`);
  });
}

export async function saveRules(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireRole("manager");
    await saveAgencyRules(user, uuidField(formData, "streamerId"), {
      minDailyRateCents: optionalCents(formData, "minDaily", "minimum daily rate"),
      blockedTags: parseCheckedTags(formData.getAll("blocked"), RESTRICTED_TAGS),
      approvalMode: field(formData.get("approvalMode")),
      acceptingAds: formData.get("accepting") === "on",
    });
    return success("Roster rules saved.");
  });
}
