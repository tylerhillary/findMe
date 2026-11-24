/**
 * The name the public sees: the business name when a pro has one, otherwise their own name.
 * The person's real name is still kept for ID checks, emails and request threads.
 */
export const publicName = (p: { name: string; businessName?: string | null }) => p.businessName?.trim() || p.name;
