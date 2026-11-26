/**
 * The name the public sees: the business name when a pro has one, otherwise their own name.
 * The person's real name is still kept for ID checks, emails and request threads.
 */
export const publicName = (p: { name: string; businessName?: string | null }) => p.businessName?.trim() || p.name;

/**
 * What clients see of a pro now that findMe arranges every job: the business name, or just the
 * first name. Surnames and contact details stay private so clients book through findMe.
 */
export const shownName = (p: { name: string; businessName?: string | null }) => p.businessName?.trim() || p.name.split(" ")[0];
