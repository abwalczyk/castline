import type { ApprovalMode, CampaignStatus, PlacementSize, Role, Rotation } from "@/lib/constants";
import type { Decision } from "@/lib/approval";
import type { Quote } from "@/lib/pricing";

export type AccountStatus = "pending" | "active" | "suspended";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: AccountStatus;
};

export type Brand = {
  id: string;
  ownerId: string;
  companyName: string;
  website: string;
  industry: string;
  billingEmail: string;
  status: AccountStatus;
};

export type Agency = {
  id: string;
  ownerId: string;
  name: string;
  website: string;
  status: AccountStatus;
};

export type Streamer = {
  id: string;
  ownerId: string;
  agencyId: string | null;
  linkStatus: "none" | "pending" | "active";
  slug: string;
  displayName: string;
  twitchLogin: string;
  verificationStatus: VerificationStatus;
  bio: string;
  category: string;
  language: string;
  avgCcv: number;
  followerCount: number;
  dailyRateCents: number | null;
  minDailyRateCents: number | null;
  placementSize: PlacementSize;
  overlayWidth: number;
  overlayHeight: number;
  overlayPosition: string;
  overlayAudio: boolean;
  acceptingAds: boolean;
  maxConcurrent: number;
  minDays: number;
  maxDays: number;
  blockedTags: string[];
  approvalMode: ApprovalMode;
  overlayToken: string | null;
  publicDemo: boolean;
  stripeAccountId: string | null;
  status: AccountStatus;
};

export type Settings = {
  commissionBps: number;
  minPlaybacksToRelease: number;
  exclusivityMillis: number;
  rotationStandardMillis: number;
  rotationHighMillis: number;
  rotationMaxMillis: number;
  sizeSmallMillis: number;
  sizeMediumMillis: number;
  sizeLargeMillis: number;
  maxImageBytes: number;
  maxGifBytes: number;
  maxVideoBytes: number;
  maxVideoSeconds: number;
  currency: string;
  requireBrandApproval: boolean;
};

export type Tier = {
  id: string;
  name: string;
  minCcv: number;
  maxCcv: number | null;
  dailyRateCents: number;
  sortOrder: number;
  active: boolean;
};

export type Campaign = {
  id: string;
  brandId: string;
  name: string;
  status: CampaignStatus;
  vertical: string;
  restrictedTag: string;
  destinationUrl: string;
  brief: string;
  startDate: string | null;
  endDate: string | null;
  budgetCents: number;
  placementDurationSec: number;
  rotation: Rotation;
  placementSize: PlacementSize;
  exclusivity: boolean;
  adminReview: "pending" | "approved" | "rejected" | "changes_requested";
  adminNote: string;
  streamerCount?: number;
  quoteCents?: number;
  companyName?: string;
};

export type Participant = {
  campaignId: string;
  streamerId: string;
  status: "pending" | "approved" | "changes_requested" | "rejected";
  calculatedCents: number;
  overrideCents: number | null;
  rateCents: number;
  snapshot: Quote | null;
  note: string;
  streamerDecision: Decision;
  managerDecision: Decision;
  displayName: string;
  slug: string;
  avgCcv: number;
  approvalMode: ApprovalMode;
  ownerId: string;
  agencyId: string | null;
  linkStatus: string;
};

export type Creative = {
  id: string;
  campaignId: string;
  type: "image" | "gif" | "mp4";
  storageKey: string;
  originalName: string;
  mime: string;
  byteSize: number;
  status: "pending_review" | "approved" | "rejected";
  moderationNote: string;
};

export type Payment = {
  id: string;
  campaignId: string;
  amountCents: number;
  commissionCents: number;
  refundedCents: number;
  currency: string;
  status: "pending" | "paid" | "refunded" | "failed";
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
};

export type Earning = {
  id: string;
  streamerId: string;
  campaignId: string;
  paymentId: string | null;
  grossCents: number;
  commissionCents: number;
  netCents: number;
  status: "held" | "eligible" | "paid" | "reversed";
  payoutId: string | null;
  eligibleAt: string | null;
  campaignName?: string;
  streamerName?: string;
};

export type Payout = {
  id: string;
  streamerId: string;
  amountCents: number;
  status: "pending" | "paid" | "failed";
  method: "manual" | "stripe_connect";
  stripeTransferId: string | null;
  note: string;
  paidAt: string | null;
  streamerName?: string;
};

export type Dispute = {
  id: string;
  campaignId: string;
  paymentId: string | null;
  openedBy: string | null;
  reason: string;
  status: "open" | "resolved_refund" | "resolved_denied";
  amountCents: number;
  resolutionNote: string;
  campaignName?: string;
};

export type AuditEntry = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: string;
  createdAt: string;
  actorEmail?: string;
};
