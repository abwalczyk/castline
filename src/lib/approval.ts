import type { ApprovalMode } from "@/lib/constants";

export type Decision = "approved" | "rejected" | "changes_requested" | null;

export function actorCanDecide(mode: ApprovalMode, actor: "streamer" | "manager") {
  if (actor === "streamer") return mode === "self" || mode === "either" || mode === "both";
  return mode === "manager" || mode === "either" || mode === "both";
}

export function resolveParticipant(mode: ApprovalMode, streamer: Decision, manager: Decision) {
  const relevant: Decision[] =
    mode === "self" ? [streamer] : mode === "manager" ? [manager] : [streamer, manager];
  if (relevant.includes("rejected")) return "rejected" as const;
  if (relevant.includes("changes_requested")) return "changes_requested" as const;
  if (mode === "self") return streamer === "approved" ? ("approved" as const) : ("pending" as const);
  if (mode === "manager") return manager === "approved" ? ("approved" as const) : ("pending" as const);
  if (mode === "either") {
    return streamer === "approved" || manager === "approved" ? ("approved" as const) : ("pending" as const);
  }
  return streamer === "approved" && manager === "approved" ? ("approved" as const) : ("pending" as const);
}
