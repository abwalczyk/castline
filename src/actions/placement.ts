"use server";

import { run } from "@/lib/action-run";
import { success } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { field, uuidField } from "@/lib/fields";
import { decidePlacement } from "@/lib/operations";

export async function decidePlacementAction(_state: unknown, formData: FormData) {
  return run(async () => {
    const user = await requireUser();
    await decidePlacement(
      user,
      uuidField(formData, "campaignId"),
      uuidField(formData, "streamerId"),
      field(formData.get("decision")),
      field(formData.get("note")),
    );
    return success("Decision recorded.");
  });
}
