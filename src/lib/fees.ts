// findMe's cut of every job, and what the pro is paid. Pros are told this up front.
// findMe keeps 10% of the client price, but never less than ₦1,000, so small jobs still cover
// payment fees and the work of arranging them.
export const FINDME_FEE_RATE = 0.1;
export const FINDME_MIN_FEE = 1_000;
export const FINDME_FEE_LABEL = "10% (min ₦1,000)";
/** Smallest price findMe can quote, so the pro is always paid at least as much as findMe keeps. */
export const MIN_JOB_PRICE = 2 * FINDME_MIN_FEE;

/** findMe's fee on a client price (rounded to the naira). */
export const findMeFeeFor = (price: number) => Math.min(price, Math.max(FINDME_MIN_FEE, Math.round(price * FINDME_FEE_RATE)));
/** What the pro receives from a client price. */
export const proPayoutFor = (price: number) => price - findMeFeeFor(price);
/** The fee actually taken on a job: from the pay saved when it was priced, so older jobs keep their terms. */
export const feeOnJob = (job: { price: number; proPayout?: number }) => (job.proPayout ? job.price - job.proPayout : findMeFeeFor(job.price));
