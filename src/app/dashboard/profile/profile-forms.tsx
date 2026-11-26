"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, CheckCircle2, ImagePlus, Loader2, Phone, PhoneIncoming, Plus, Save, Trash2, X } from "lucide-react";
import { PhoneInput } from "@/components/phone-input";
import { RateUnitPicker } from "@/components/rate-unit-picker";
import type { RateUnit } from "@/lib/price";
import { formatNgPhone } from "@/lib/phone";
import { addSkillAction, removeSkillAction, updateProfileAction, type FormState } from "@/app/actions";
import { CATEGORIES, SKILL_LEVELS } from "@/lib/categories";
import { Avatar, FieldError, Input, Label, LocationInput, Select, Textarea, btn, cn } from "@/components/ui";
import { Toast } from "@/components/toast";

type Profile = {
  name: string; business_name: string; email: string; role: string; headline: string; bio: string; location: string;
  category: string; hourly_rate: number; rate_unit: RateUnit; available: boolean; avatar: string | null;
  phone: string; whatsapp: boolean; show_phone: boolean; phone_verified: boolean; cover: string | null;
};

/** Crops a picture to a wide 3:1 banner and shrinks it so it stays small to store and load. */
async function resizeCover(file: File, width = 1500, height = 500): Promise<string> {
  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const scale = Math.max(width / img.width, height / img.height);
  const w = width / scale;
  const h = height / scale;
  ctx.drawImage(img, (img.width - w) / 2, (img.height - h) / 2, w, h, 0, 0, width, height);
  // Step the quality down until it fits comfortably under the server's limit.
  for (const q of [0.82, 0.72, 0.6, 0.5]) {
    const url = canvas.toDataURL("image/jpeg", q);
    if (url.length < 600_000) return url;
  }
  return canvas.toDataURL("image/jpeg", 0.4);
}

async function resizeImage(file: File, size = 320): Promise<string> {
  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const s = Math.min(img.width, img.height);
  ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function ProfileForm({ profile, startListed }: { profile: Profile; startListed?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, {});
  const [avatar, setAvatar] = useState<string | null>(profile.avatar);
  const [newAvatar, setNewAvatar] = useState("");
  const [removed, setRemoved] = useState(false);
  const [listed, setListed] = useState(startListed || profile.role === "provider");
  const [available, setAvailable] = useState(profile.available);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [cover, setCover] = useState<string | null>(profile.cover);
  const [newCover, setNewCover] = useState("");
  const [coverRemoved, setCoverRemoved] = useState(false);

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const url = await resizeCover(f);
    setCover(url);
    setNewCover(url);
    setCoverRemoved(false);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await resizeImage(f);
    setAvatar(url);
    setNewAvatar(url);
    setRemoved(false);
  }

  return (
    <form action={action} className="card overflow-hidden">
      <Toast message={state.message} trigger={state} />
      <input type="hidden" name="avatar" value={newAvatar} />
      <input type="hidden" name="removeAvatar" value={removed ? "1" : ""} />
      <input type="hidden" name="cover" value={newCover} />
      <input type="hidden" name="removeCover" value={coverRemoved ? "1" : ""} />

      <div className="relative h-28 overflow-hidden bg-brand-gradient sm:h-44">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="grid-bg absolute inset-0 opacity-40" />
        )}
        <div className="absolute right-3 top-3 flex gap-2">
          <button type="button" onClick={() => coverRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-full bg-ink/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-ink/70 sm:text-sm">
            <ImagePlus className="size-4" /> {cover ? "Change cover" : "Add cover photo or logo"}
          </button>
          {cover && (
            <button type="button" onClick={() => { setCover(null); setNewCover(""); setCoverRemoved(true); }} className="grid size-8 place-items-center rounded-full bg-ink/55 text-white backdrop-blur hover:bg-ink/70" aria-label="Remove cover">
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={onCover} />
      </div>
      <div className="px-4 pb-5 sm:px-8 sm:pb-8">
        <div className="-mt-10 flex flex-wrap items-end gap-3 sm:-mt-12 sm:gap-4">
          <div className="group relative">
            <Avatar name={name || "You"} src={avatar} size={76} ring className="shadow-lift sm:hidden" />
            <Avatar name={name || "You"} src={avatar} size={104} ring className="shadow-lift max-sm:hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 grid place-items-center rounded-full bg-ink/50 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Change photo"
            >
              <Camera className="size-6" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>
          <div className="flex gap-2 pb-1">
            <button type="button" onClick={() => fileRef.current?.click()} className={btn("outline", "sm")}>
              <Camera className="size-4" /> Upload photo
            </button>
            {avatar && (
              <button type="button" onClick={() => { setAvatar(null); setNewAvatar(""); setRemoved(true); }} className={btn("ghost", "sm")}>
                <Trash2 className="size-4" /> Remove
              </button>
            )}
          </div>
        </div>

        {/* listed toggle */}
        <div className={cn("mt-8 flex items-start gap-4 rounded-2xl border p-4 transition-colors", listed ? "border-brand-200 bg-brand-50/60" : "border-line bg-canvas")}>
          <Toggle name="listed" checked={listed} onChange={setListed} label="Show me in search results" />
          <div>
            <p className="font-semibold">Offer my skills on findMe</p>
            <p className="text-sm text-muted">Turn on to appear in search and receive requests.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!state.fieldErrors?.name} />
            <FieldError msg={state.fieldErrors?.name} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="businessName" hint="Optional">Business name</Label>
            <Input id="businessName" name="businessName" defaultValue={profile.business_name} maxLength={80} placeholder="e.g. Amara Designs" />
            <p className="mt-1 text-xs text-muted">Clients see this instead of your name. Your full name stays on your account.</p>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="headline">Headline</Label>
            <Input id="headline" name="headline" defaultValue={profile.headline} maxLength={120} placeholder="e.g. Wedding photographer capturing honest moments" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="bio" hint={`${bio.length}/1500`}>About you</Label>
            <Textarea id="bio" name="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1500} rows={5} placeholder="Your experience, what you love doing, and what clients can expect when they work with you." />
          </div>
          <div>
            <Label htmlFor="category">Main category</Label>
            <Select id="category" name="category" defaultValue={profile.category} aria-invalid={!!state.fieldErrors?.category}>
              <option value="">Choose a category</option>
              {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </Select>
            <FieldError msg={state.fieldErrors?.category} />
          </div>
          <div>
            <Label htmlFor="location" hint="Area, State">Location</Label>
            <LocationInput id="location" name="location" defaultValue={profile.location} />
          </div>
          <div>
            <Label htmlFor="rate" hint="optional">Your rate (₦)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-muted sm:left-4">₦</span>
              <Input id="rate" name="rate" type="number" min={0} defaultValue={profile.hourly_rate || ""} placeholder="0" className="pl-9 sm:pl-10" />
            </div>
            <RateUnitPicker name="rateUnit" defaultValue={profile.rate_unit} />
          </div>
          <div>
            <Label>Availability</Label>
            <div className="flex h-[50px] items-center gap-3 rounded-xl border border-line bg-white px-4">
              <Toggle name="available" checked={available} onChange={setAvailable} label="Available for new work" />
              <span className="text-sm font-medium">{available ? "Available for new work" : "Currently busy"}</span>
            </div>
          </div>
          <div className="sm:col-span-2 rounded-2xl border border-line bg-canvas/60 p-4 sm:p-5">
            <p className="flex items-center gap-2 font-semibold"><Phone className="size-4 text-brand-600" /> Contact number</p>
            <p className="mt-1 text-sm text-muted">
              {listed ? "Only findMe sees it. We call you about jobs; clients never get your number." : "Only findMe and the pro we send to your job see it."}
            </p>
            <div className="mt-4">
              <Label htmlFor="phone" hint={listed ? "Required for pros" : "Optional"}>Phone or business line</Label>
              <PhoneInput id="phone" name="phone" defaultValue={profile.phone ? formatNgPhone(profile.phone).replace(/^\+234 /, "") : ""} aria-invalid={!!state.fieldErrors?.phone} />
              <FieldError msg={state.fieldErrors?.phone} />
              <PhoneConfirm phone={profile.phone} verified={profile.phone_verified} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled className="bg-canvas text-muted" />
            <p className="mt-1.5 text-xs text-muted">Your email is never shown publicly.</p>
          </div>
        </div>

        {state.error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.error}</p>}

        <div className="mt-8 flex justify-end">
          <button disabled={pending} className={btn("primary", "lg", "w-full sm:w-auto")}>
            {pending ? <Loader2 className="size-5 animate-spin" /> : <><Save className="size-4.5" /> Save profile</>}
          </button>
        </div>
      </div>
    </form>
  );
}

function Toggle({ name, checked, onChange, label }: { name: string; checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="relative inline-flex shrink-0 cursor-pointer">
      <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" aria-label={label} />
      <span className={cn("h-7 w-12 rounded-full transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-brand-200", checked ? "bg-brand-600" : "bg-zinc-300")} />
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className={cn("absolute top-1 size-5 rounded-full bg-white shadow", checked ? "right-1" : "left-1")} />
    </label>
  );
}

export function SkillsManager({ skills }: { skills: { id: string; name: string; level: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const res = await addSkillAction(prev, fd);
    if (res.ok) formRef.current?.reset();
    return res;
  }, {});
  const [removing, startRemove] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="card p-5 sm:p-6">
      <h2 className="text-lg font-bold">Skills</h2>
      <p className="mt-1 text-sm text-muted">Specific skills rank higher in search.</p>
      <form ref={formRef} action={action} className="mt-5 space-y-2">
        <Input name="name" placeholder="e.g. Kitchen remodelling" maxLength={40} />
        <div className="flex gap-2">
          <Select name="level" defaultValue="Intermediate" className="flex-1">
            {SKILL_LEVELS.map((l) => <option key={l}>{l}</option>)}
          </Select>
          <button disabled={pending} className={btn("dark", "md", "h-[50px] rounded-xl")}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add
          </button>
        </div>
        {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      </form>
      <ul className="mt-5 space-y-2">
        <AnimatePresence initial={false}>
          {skills.map((s) => (
            <motion.li
              key={s.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-2.5">
                <span className="size-2 rounded-full bg-brand-gradient" />
                <span className="flex-1 text-sm font-semibold">{s.name}</span>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">{s.level}</span>
                <button
                  onClick={() => { setRemovingId(s.id); startRemove(() => removeSkillAction(s.id)); }}
                  className="grid size-7 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${s.name}`}
                >
                  {removing && removingId === s.id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
        {skills.length === 0 && <li className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">No skills yet. Add your first one above.</li>}
      </ul>
    </div>
  );
}

/** Whether findMe has verified the saved number by phone call yet. */
function PhoneConfirm({ phone, verified }: { phone: string; verified: boolean }) {
  if (!phone) return null;
  return verified ? (
    <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
      <CheckCircle2 className="size-4" /> Verified by findMe
    </p>
  ) : (
    <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
      <PhoneIncoming className="size-4" /> Not verified yet. Expect a call from findMe to verify it.
    </p>
  );
}
