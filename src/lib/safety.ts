/** Reasons people can give when reporting someone. Keys are stored; labels are shown. */
export const REPORT_REASONS = [
  { key: "scam", label: "Scam or fraud", hint: "Took money and disappeared, fake job, stolen items" },
  { key: "upfront", label: "Asked for money upfront or off the platform", hint: "Pressure to pay before any agreement or work" },
  { key: "fake", label: "Fake profile or impersonation", hint: "Not a real person, or pretending to be someone else" },
  { key: "abuse", label: "Harassment or abusive behaviour", hint: "Threats, insults or unwanted contact" },
  { key: "no_show", label: "Didn't show up or deliver", hint: "Accepted the job, then vanished" },
  { key: "other", label: "Something else", hint: "Tell us what happened" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["key"];

/** A pro reported by this many different people is hidden from search until reviewed. */
export const AUTO_HIDE_AFTER = 3;
