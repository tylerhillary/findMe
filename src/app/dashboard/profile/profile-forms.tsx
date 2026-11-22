"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { addSkillAction, removeSkillAction, updateProfileAction, type FormState } from "@/app/actions";
import { CATEGORIES, SKILL_LEVELS } from "@/lib/categories";
import { Avatar, FieldError, Input, Label, Select, Textarea, btn, cn } from "@/components/ui";
import { Toast } from "@/components/toast";

type Profile = {
  name: string; email: string; role: string; headline: string; bio: string; location: string;
  category: string; hourly_rate: number; available: boolean; avatar: string | null;
};

async function resizeImage(file: File, size = 320): Promise<string> {
  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const s = Math.min(img.width, img.height);
  ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, {});
  const [avatar, setAvatar] = useState<string | null>(profile.avatar);
  const [newAvatar, setNewAvatar] = useState("");
  const [removed, setRemoved] = useState(false);
  const [listed, setListed] = useState(profile.role === "provider");
  const [available, setAvailable] = useState(profile.available);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const fileRef = useRef<HTMLInputElement>(null);

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

      <div className="relative h-28 bg-brand-gradient">
        <div className="grid-bg absolute inset-0 opacity-40" />
      </div>
      <div className="px-5 pb-6 sm:px-8 sm:pb-8">
        <div className="-mt-12 flex flex-wrap items-end gap-4">
          <div className="group relative">
            <Avatar name={name || "You"} src={avatar} size={104} ring className="shadow-lift" />
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
            <p className="font-semibold">Offer my skills on findIn</p>
            <p className="text-sm text-muted">Turn this on to appear in search and receive requests from clients.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!state.fieldErrors?.name} />
            <FieldError msg={state.fieldErrors?.name} />
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
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={profile.location} placeholder="City, Country" />
          </div>
          <div>
            <Label htmlFor="rate">Hourly rate (USD)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted">$</span>
              <Input id="rate" name="rate" type="number" min={0} defaultValue={profile.hourly_rate || ""} placeholder="0" className="pl-8" />
            </div>
          </div>
          <div>
            <Label>Availability</Label>
            <div className="flex h-[50px] items-center gap-3 rounded-xl border border-line bg-white px-4">
              <Toggle name="available" checked={available} onChange={setAvailable} label="Available for new work" />
              <span className="text-sm font-medium">{available ? "Available for new work" : "Currently busy"}</span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label>Email</Label>
            <Input value={profile.email} disabled className="bg-canvas text-muted" />
            <p className="mt-1.5 text-xs text-muted">Your email is never shown publicly. Clients contact you through findIn.</p>
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
      <p className="mt-1 text-sm text-muted">What people should find you for. Specific skills rank higher.</p>
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
