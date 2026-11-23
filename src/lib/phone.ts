// Nigerian phone numbers. Stored as E.164 ("+2348031234567"); safe to use on server and client.

/**
 * Accepts the ways people actually type Nigerian numbers — "0803 123 4567", "+234 803 123 4567",
 * "2348031234567", or a business landline like "01 234 5678" — and returns E.164, or null if invalid.
 */
export function normalizeNgPhone(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("234")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  // Mobile: 70x, 80x, 81x, 90x, 91x + 7 digits.
  if (digits.length === 10) return /^[789][01]\d{8}$/.test(digits) ? `+234${digits}` : null;
  // Landline / business line: area code + local number, 8–9 digits, e.g. 1 234 5678 (Lagos).
  if (digits.length === 8 || digits.length === 9) return /^[1-9]\d+$/.test(digits) ? `+234${digits}` : null;
  return null;
}

export const isMobile = (e164: string) => /^\+234[789][01]\d{8}$/.test(e164);

/** "+234 803 123 4567" for mobiles, "+234 1 234 5678" style for landlines. */
export function formatNgPhone(e164: string): string {
  const n = e164.replace(/^\+234/, "");
  if (n.length === 10) return `+234 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  if (n.length === 8) return `+234 ${n.slice(0, 1)} ${n.slice(1, 4)} ${n.slice(4)}`;
  return `+234 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`;
}

/** "+234 803 *** **67" — enough to show a number exists without revealing it. */
export function maskNgPhone(e164: string): string {
  // Keep "+234" and the network/area group; hide the rest except the last two digits.
  const [cc, group, ...rest] = formatNgPhone(e164).split(" ");
  const tail = rest.join(" ");
  return `${cc} ${group} ${tail.slice(0, -2).replace(/\d/g, "*")}${tail.slice(-2)}`;
}

export const telLink = (e164: string) => `tel:${e164}`;

export const whatsappLink = (e164: string, text?: string) =>
  `https://wa.me/${e164.replace(/^\+/, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
