// findMe's cut of every job, and what the pro is paid. Pros are told this up front.
export const FINDME_FEE_RATE = 0.03;
export const FINDME_FEE_LABEL = "3%";

/** What the pro receives from a client price (rounded to the naira). */
export const proPayoutFor = (price: number) => Math.round(price * (1 - FINDME_FEE_RATE));
export const findMeFeeFor = (price: number) => price - proPayoutFor(price);
