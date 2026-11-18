export const SESSION_COOKIE = "castline_session";

export const CONTENT_CATEGORIES = [
  "Just Chatting",
  "IRL",
  "Gaming",
  "Music",
  "Sports",
  "Art",
  "Technology",
  "Food",
  "News",
  "ASMR",
] as const;

export const BRAND_VERTICALS = [
  "Consumer goods",
  "Software",
  "Food and beverage",
  "Apparel",
  "Finance",
  "Entertainment",
  "Automotive",
  "Other",
] as const;

export const RESTRICTED_TAGS = [
  "Alcohol",
  "Gambling",
  "Politics",
  "Supplements",
  "Dating",
  "Crypto",
] as const;

export const LANGUAGES = [
  ["en", "English"],
  ["es", "Spanish"],
  ["pt", "Portuguese"],
  ["fr", "French"],
  ["de", "German"],
  ["ko", "Korean"],
  ["ja", "Japanese"],
] as const;

export const PLACEMENT_SIZES = ["small", "medium", "large"] as const;
export const ROTATIONS = ["standard", "high", "max"] as const;
export const POSITIONS = [
  "bottom-right",
  "bottom-left",
  "top-right",
  "top-left",
  "center",
] as const;
export const DURATIONS = [10, 15, 30, 45, 60] as const;

export const ROLES = ["brand", "streamer", "manager", "admin"] as const;
export const APPROVAL_MODES = ["self", "manager", "either", "both"] as const;

export type Role = (typeof ROLES)[number];
export type PlacementSize = (typeof PLACEMENT_SIZES)[number];
export type Rotation = (typeof ROTATIONS)[number];
export type Position = (typeof POSITIONS)[number];
export type ApprovalMode = (typeof APPROVAL_MODES)[number];

export const CAMPAIGN_STATUSES = [
  "draft",
  "pending_approval",
  "changes_requested",
  "approved",
  "payment_pending",
  "scheduled",
  "active",
  "completed",
  "rejected",
  "cancelled",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const SPONSOR_LABEL = "Sponsored";
export const MAX_CAMPAIGN_DAYS = 90;
