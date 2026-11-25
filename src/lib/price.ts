// How a pro charges: by the hour, or one price per job paid once the work is done.
export type RateUnit = "hour" | "job";

export const asRateUnit = (v: unknown): RateUnit => (v === "job" ? "job" : "hour");

/** "/hr" or "/job", shown after the amount. */
export const rateSuffix = (u: RateUnit) => (u === "job" ? "/job" : "/hr");
