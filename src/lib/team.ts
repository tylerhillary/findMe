import "server-only";

/** Emails of the findMe team (ADMIN_EMAILS on Vercel). */
export const teamEmails = () => (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/** True for findMe team accounts. They get the gold "findMe team" badge wherever their name shows. */
export const isTeamEmail = (email: string | null | undefined) => !!email && teamEmails().includes(email.toLowerCase());

/** Gold badge: findMe team emails automatically, plus any account an admin gave the badge to. */
export const hasTeamBadge = (u: { email?: string | null; teamBadge?: boolean } | null | undefined) => !!u && (!!u.teamBadge || isTeamEmail(u.email));
