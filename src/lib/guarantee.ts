import type { JobDoc } from "./schema";

/**
 * The findMe Guarantee. After the pro says a job is done, the client has GUARANTEE_DAYS to
 * confirm it or report a problem (the same window before a job is confirmed automatically),
 * so the pro is never paid while a problem is open. Keep in step with AUTO_CONFIRM_MS in jobs.ts
 * (that file is server-only; this one is also used in the browser).
 */
export const GUARANTEE_DAYS = 3;

export const CLAIM_REASONS = [
  "The work wasn't done properly",
  "The work is unfinished",
  "Something was damaged",
  "The pro didn't do what was agreed",
  "Something else",
] as const;

/** A problem report findMe is still looking into. */
export const claimOpen = (j: Pick<JobDoc, "claim">) => !!j.claim && !j.claim.resolvedAt;
