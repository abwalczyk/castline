const LABELS: Record<string, string> = {
  pending_approval: "Pending Approval",
  changes_requested: "Changes Requested",
  payment_pending: "Payment Pending",
  pending_review: "Pending Review",
  resolved_refund: "Refunded",
  resolved_denied: "Denied",
  stripe_connect: "Stripe Connect",
};

export function labelize(status: string) {
  if (LABELS[status]) return LABELS[status];
  return status
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function roleLabel(role: string) {
  if (role === "brand") return "Advertiser";
  if (role === "streamer") return "Creator";
  if (role === "manager") return "Agency";
  if (role === "admin") return "Administrator";
  return labelize(role);
}

export type Tone = "neutral" | "good" | "warn" | "bad" | "accent";

export function statusTone(status: string): Tone {
  if (["active", "approved", "verified", "paid", "eligible"].includes(status)) return "good";
  if (["rejected", "cancelled", "suspended", "failed", "reversed", "refunded"].includes(status)) {
    return "bad";
  }
  if (
    [
      "pending_approval",
      "changes_requested",
      "pending",
      "pending_review",
      "held",
      "open",
      "unverified",
    ].includes(status)
  ) {
    return "warn";
  }
  if (["payment_pending", "scheduled"].includes(status)) return "accent";
  return "neutral";
}
