// Firestore document shapes. Timestamps are epoch milliseconds.
import type { RequestStatus } from "./categories";

export type Skill = { id: string; name: string; level: string };

/** users/{uid} — uid is the Firebase Auth uid. Contains PII (email, phone): server access only. */
export type UserDoc = {
  name: string;
  email: string;
  role: "client" | "provider";
  /** Optional trading name shown publicly in place of the person's name (e.g. "Amara Designs"). */
  businessName?: string;
  headline?: string;
  bio?: string;
  location?: string;
  category?: string;
  hourlyRate?: number;
  /** How hourlyRate is charged: per hour (default) or one price per job, paid when it's done. */
  rateUnit?: "hour" | "job";
  available?: boolean;
  avatar?: string | null; // small JPEG data URL
  phone?: string; // E.164 (+234…)
  whatsapp?: boolean;
  showPhone?: boolean;
  /** Legacy: from the old WhatsApp number check (no longer used). */
  phoneVerified?: boolean;
  /** The number (E.164) a findMe admin confirmed by phone call. Only counts while it equals `phone`. */
  verifiedPhone?: string;
  /** Public copy of "the current number is verified" (no number in it), for the Phone verified badge. */
  phoneConfirmed?: boolean;
  /** 4-digit code the person reads out when findMe calls, proving the right person answered. */
  callCode?: string;
  /** When an admin last called (or tried to). */
  lastCallAt?: number;
  /** Copy of Firebase Auth's "email confirmed" flag, so public pages can show it without extra lookups. */
  emailVerified?: boolean;
  /** NIN confirmed with NIMC (via Dojah). Pros without it are kept out of search and can't get requests. */
  ninVerified?: boolean;
  skills?: Skill[];
  // Denormalised counters, kept up to date by server actions.
  ratingSum?: number;
  reviewCount?: number;
  jobsDone?: number;
  startingPrice?: number | null;
  /** Number of different people who have reported this user. */
  reportCount?: number;
  /** Hidden from search after repeated reports, until an admin reviews it. */
  flagged?: boolean;
  /** Banned by an admin: can't sign in, hidden everywhere. */
  banned?: boolean;
  /** Gold "findMe team" badge given by an admin (team emails get it automatically). */
  teamBadge?: boolean;
  createdAt: number;
};

/** reports/{reporterId}__{reportedId} — one report per pair, so nobody can pile on alone. */
export type ReportDoc = {
  reporterId: string;
  reportedId: string;
  requestId: string | null;
  reason: string;
  details: string;
  status: "open" | "reviewed" | "dismissed";
  createdAt: number;
  /** What the admin decided, and when. */
  outcome?: "dismissed" | "hidden" | "banned";
  decidedAt?: number;
};

/** blocks/{blockerId}__{blockedId} — blocker no longer hears from blocked, and vice versa. */
export type BlockDoc = { blockerId: string; blockedId: string; createdAt: number };

/** services/{id} */
export type ServiceDoc = {
  userId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  priceUnit: "hour" | "project";
  deliveryDays: number;
  createdAt: number;
};

/** requests/{id} — messages live in requests/{id}/messages */
export type RequestDoc = {
  clientId: string;
  providerId: string;
  participants: string[];
  serviceId: string | null;
  title: string;
  budget: number;
  status: RequestStatus;
  lastMessage?: string;
  messageCount?: number;
  /** True once the client has left a review (false until then). */
  reviewed?: boolean;
  /** When the pro said the job is done; the client confirms, or it auto-confirms after 3 days. */
  doneRequestedAt?: number;
  /** Set when the job was completed and its chat deleted. */
  chatClearedAt?: number;
  /** Completed while a report was open: the chat is kept as evidence until an admin decides. */
  chatHeldForReport?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type MessageDoc = { senderId: string; body: string; createdAt: number };

/** reviews/{requestId} — one review per completed request */
export type ReviewDoc = {
  requestId: string;
  providerId: string;
  clientId: string;
  rating: number;
  comment: string;
  createdAt: number;
};

export type NotificationKind = "request" | "message" | "status" | "review";

/** notifications/{id} — what a user sees under the bell (and may also get by email). */
export type NotificationDoc = {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  requestId: string | null;
  read: boolean;
  createdAt: number;
};

/** support/{id} — messages sent through the contact form. */
export type SupportDoc = {
  name: string;
  email: string;
  topic: string;
  message: string;
  userId: string | null;
  status: "open" | "closed";
  createdAt: number;
};

/** identity/{uid} — NIN check state. Never holds the full NIN. Server access only. */
export type IdentityDoc = {
  status?: "verified" | "failed";
  /** HMAC-SHA256 of the NIN (see src/lib/nin.ts); also the id of ninIndex/{hash} → { uid }. */
  ninHash?: string;
  ninLast4?: string;
  provider?: "dojah";
  verifiedAt?: number;
  lastError?: string | null;
  attemptsDay?: string;
  attempts?: number;
  lastTriedAt?: number;
};

/**
 * covers/{uid}: a pro's cover image (wide banner photo or logo) as a JPEG data URL. Kept out of
 * users/{uid} so search and lists never load it; only the profile pages read it.
 */
export type CoverDoc = { image: string; updatedAt: number };

/**
 * jobs/{id}: a client's request to findMe. findMe quotes a price (the client can bargain), takes
 * payment, assigns a pro, and pays the pro once the client confirms the work. Client and pro never
 * get each other's contact through the site; only the assigned pro sees the client's number.
 */
export type JobStatus = "new" | "quoted" | "paid" | "assigned" | "completed" | "cancelled";
export type JobDoc = {
  clientId: string;
  clientName: string;
  clientPhone: string; // E.164; shown only to the assigned pro and admins
  title: string;
  details: string;
  category: string;
  location: string; // area / address for the pro
  when: string; // e.g. "This weekend", "ASAP"
  /** Pro the client picked on findMe, if any (findMe may still assign someone else). */
  preferredProId: string | null;
  /** What the client would like to pay (their bargain), if they made an offer. */
  clientOffer: number;
  status: JobStatus;
  /** The price findMe quoted / agreed with the client. */
  price: number;
  /** What the pro receives: price minus findMe's fee. */
  proPayout: number;
  proId: string | null;
  quotedAt?: number;
  paymentClaimedAt?: number; // client tapped "I've paid"
  paidAt?: number; // admin confirmed the money arrived
  assignedAt?: number;
  doneRequestedAt?: number; // pro said it's done; client confirms or it auto-confirms
  completedAt?: number;
  proPaidAt?: number; // admin paid the pro
  cancelledAt?: number;
  reviewed?: boolean;
  adminNote?: string;
  createdAt: number;
  updatedAt: number;
};

/** payouts/{uid}: where findMe sends a pro's pay. Private: only the pro and admins see it. */
export type PayoutDoc = { bankName: string; accountNumber: string; accountName: string; updatedAt: number };
