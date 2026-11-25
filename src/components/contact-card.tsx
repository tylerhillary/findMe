import { CircleAlert, Lock, Phone } from "lucide-react";
import { formatNgPhone, isMobile, maskNgPhone, telLink, whatsappLink } from "@/lib/phone";
import { cn } from "./ui";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.4h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.38 9.38 0 0 1-1.44-5c0-5.18 4.22-9.4 9.41-9.4 2.51 0 4.87.98 6.65 2.76a9.34 9.34 0 0 1 2.75 6.65c0 5.18-4.22 9.4-9.4 9.4m8-17.41A11.24 11.24 0 0 0 12.05.7C5.83.7.77 5.76.77 11.98c0 1.99.52 3.93 1.5 5.64L.67 23.3l5.82-1.53a11.3 11.3 0 0 0 5.4 1.38h.01c6.22 0 11.28-5.06 11.28-11.28 0-3.01-1.17-5.85-3.3-7.98" />
    </svg>
  );
}

/** Shown under a number findMe hasn't verified by call yet. Informational only; nothing is blocked. */
export function UnverifiedNote({ name }: { name: string }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
      <CircleAlert className="mt-px size-3.5 shrink-0" /> findMe hasn&apos;t verified {name}&apos;s number yet. We&apos;ll call to confirm it soon.
    </p>
  );
}

/** Call / WhatsApp buttons for a revealed number. */
export function ContactButtons({
  phone, whatsapp, waMessage, compact, unverifiedName,
}: { phone: string; whatsapp: boolean; waMessage?: string; compact?: boolean; unverifiedName?: string }) {
  const canWhatsApp = whatsapp && isMobile(phone);
  return (
    <div>
      <a href={telLink(phone)} className="block text-lg font-extrabold tracking-tight text-ink hover:text-brand-700">
        {formatNgPhone(phone)}
      </a>
      <div className={cn("mt-3 grid gap-2", canWhatsApp && "grid-cols-2")}>
        <a href={telLink(phone)} className={cn("inline-flex items-center justify-center gap-2 rounded-full bg-ink font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black", compact ? "h-10 text-sm" : "h-11 text-sm")}>
          <Phone className="size-4" /> Call
        </a>
        {canWhatsApp && (
          <a
            href={whatsappLink(phone, waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1ebe5a]", compact ? "h-10 text-sm" : "h-11 text-sm")}
          >
            <WhatsAppIcon className="size-4" /> WhatsApp
          </a>
        )}
      </div>
      {unverifiedName && <UnverifiedNote name={unverifiedName} />}
    </div>
  );
}

/** Masked number with an explanation of when it unlocks. */
export function LockedPhone({ phone, reason, unverifiedName }: { phone: string; reason: string; unverifiedName?: string }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink-soft">
        <Lock className="size-4 text-muted" /> {maskNgPhone(phone)}
      </p>
      <p className="mt-1.5 text-sm text-muted">{reason}</p>
      {unverifiedName && <UnverifiedNote name={unverifiedName} />}
    </div>
  );
}
