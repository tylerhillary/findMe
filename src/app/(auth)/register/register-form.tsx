"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { authErrorMessage, clientAuth, sendConfirmationEmail } from "@/lib/firebase-client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Briefcase, Check, Eye, EyeOff, Loader2, Plus, Search, Sparkles, X } from "lucide-react";
import { registerAction, startSessionAction, type FormState } from "@/app/actions";
import { CATEGORIES, SKILL_LEVELS } from "@/lib/categories";
import { normalizeNgPhone } from "@/lib/phone";
import { PhoneInput } from "@/components/phone-input";
import { RateUnitPicker } from "@/components/rate-unit-picker";
import type { RateUnit } from "@/lib/price";
import { CategoryIcon } from "@/components/category-icon";
import { FieldError, Input, Label, LocationInput, btn, cn } from "@/components/ui";

const SUGGESTIONS: Record<string, string[]> = {
  design: ["Logo Design", "UI Design", "Illustration", "Figma", "Branding"],
  development: ["React", "Website Development", "Node.js", "Python", "WordPress"],
  writing: ["Copywriting", "Proofreading", "Translation", "Blog Writing", "CV Writing"],
  marketing: ["Social Media Marketing", "SEO", "Google Ads", "Email Marketing"],
  home: ["Plumbing", "Electrical Wiring", "Cleaning", "Painting", "POP Ceiling", "Tiling"],
  repairs: ["Laptop Repair", "Phone Screen Replacement", "Network Setup", "AC Repair"],
  tutoring: ["Mathematics", "English", "JAMB Preparation", "WAEC Preparation", "Coding for Kids"],
  photo: ["Photography", "Video Editing", "Drone Footage", "Photo Editing"],
  music: ["Mixing", "Guitar Lessons", "Beat Production", "Voice Over"],
  business: ["Bookkeeping", "Tax Filing", "Business Plans", "Excel"],
  wellness: ["Personal Training", "Yoga", "Nutrition Coaching", "Massage"],
  events: ["Makeup", "Gele Tying", "Event Planning", "DJ", "MC", "Event Decoration"],
  fashion: ["Tailoring", "Ankara Styles", "Aso-ebi", "Agbada", "Hair Braiding"],
  auto: ["Car Diagnostics", "Car Servicing", "Panel Beating", "Car AC Repair", "Vulcanizing"],
  power: ["Solar Installation", "Inverter Installation", "Generator Repair", "Changeover Installation"],
  logistics: ["Dispatch Delivery", "Same-day Delivery", "Moving & Haulage", "Interstate Delivery"],
  food: ["Private Chef", "Event Catering", "Small Chops", "Cake Baking", "Nigerian Soups", "Meal Prep"],
  cleaning: ["House Cleaning", "Deep Cleaning", "Fumigation", "Laundry", "Dry Cleaning"],
};

type Role = "client" | "provider";
type Skill = { name: string; level: string };

const EASE = [0.22, 1, 0.36, 1] as const;

export function RegisterForm({ ninEnabled }: { ninEnabled: boolean }) {
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();

  const [role, setRole] = useState<Role | null>(params.get("role") === "provider" ? "provider" : null);
  const [step, setStep] = useState(params.get("role") === "provider" ? 1 : 0);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [nin, setNin] = useState("");
  const [whatsapp, setWhatsapp] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [headline, setHeadline] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [rate, setRate] = useState("");
  const [rateUnit, setRateUnit] = useState<RateUnit>("hour");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [skillLevel, setSkillLevel] = useState("Intermediate");

  const steps = role === "provider" ? ["Role", "Account", "Profile", "Skills"] : ["Role", "Account"];
  const last = steps.length - 1;

  // Server-side field errors: show them and jump back to the step that owns the field.
  useEffect(() => {
    if (!state.fieldErrors) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrors(state.fieldErrors);
    const f = Object.keys(state.fieldErrors);
    if (f.some((k) => ["name", "email", "password", "phone", "nin"].includes(k))) setStep(1);
    else if (f.some((k) => ["headline", "category"].includes(k))) setStep(2);
    else if (f.includes("skills")) setStep(3);
  }, [state]);

  const strength = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password) || /[^a-zA-Z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  function validate(s: number) {
    const e: Record<string, string> = {};
    if (s === 0 && !role) e.role = "Choose how you'll use findMe.";
    if (s === 1) {
      if (name.trim().length < 2) e.name = "Please enter your full name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = "Enter a valid email address.";
      if (password.length < 8) e.password = "Use at least 8 characters.";
      if (phone.trim() && !normalizeNgPhone(phone)) e.phone = "Enter a valid Nigerian number, e.g. 0803 123 4567.";
      else if (role === "provider" && !phone.trim()) e.phone = "Add a number clients can reach you on.";
      if (nin.trim() && !/^\d{11}$/.test(nin.replace(/\D/g, ""))) e.nin = "Enter the 11 digits on your NIN slip, or leave it blank.";
    }
    if (s === 2) {
      if (headline.trim().length < 6) e.headline = "Tell people what you do in a few words.";
      if (!category) e.category = "Pick the category that fits you best.";
    }
    if (s === 3 && skills.length === 0) e.skills = "Add at least one skill.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function go(to: number) {
    if (to > step && !validate(step)) return;
    setErrors({});
    setDir(to > step ? 1 : -1);
    setStep(to);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < last) return go(step + 1);
    if (!validate(step)) return;
    const fd = new FormData();
    Object.entries({ name, businessName: role === "provider" ? businessName : "", email, password, phone, nin: ninEnabled ? nin : "", whatsapp: whatsapp ? "1" : "0", role: role ?? "client", headline, category, location, rate, rateUnit, next }).forEach(([k, v]) => fd.set(k, v));
    fd.set("skills", JSON.stringify(skills));
    startTransition(async () => {
      // 1) Server validates and creates the Firebase account + profile.
      const res = await registerAction({}, fd);
      if (!res.ok) return setState(res);
      // 2) Sign in with the new account and start the server session.
      try {
        const cred = await signInWithEmailAndPassword(clientAuth(), email.trim().toLowerCase(), password);
        // Firebase emails a confirmation link (free). Requests need a confirmed email.
        const mailError = await sendConfirmationEmail(cred.user);
        if (mailError) console.warn("[findMe] confirmation email not sent:", mailError);
        const session = await startSessionAction(await cred.user.getIdToken(), next || "/dashboard?welcome=1");
        if (session?.error) setState({ error: session.error });
      } catch (err) {
        // A successful sign-in ends in a redirect, which arrives here as a special error — not a failure.
        if (String((err as { digest?: string }).digest ?? "").startsWith("NEXT_REDIRECT")) return;
        setState({ error: `Your account was created, but signing in failed: ${authErrorMessage((err as { code?: string }).code)} Try signing in.` });
      }
    });
  }

  function addSkill(n = skillInput) {
    const v = n.trim();
    if (!v || skills.some((s) => s.name.toLowerCase() === v.toLowerCase())) return;
    setSkills((s) => [...s, { name: v, level: skillLevel }]);
    setSkillInput("");
    setErrors((e) => ({ ...e, skills: "" }));
  }

  const pwColors = ["bg-red-400", "bg-orange-400", "bg-amber-400", "bg-emerald-500"];
  const pwLabels = ["Too weak", "Okay", "Good", "Strong"];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-muted">
          <span>
            Step {step + 1} of {steps.length}
          </span>
          <span className="text-brand-700">{steps[step]}</span>
        </div>
        <div className="mt-2.5 flex gap-1.5">
          {steps.map((s, i) => (
            <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <motion.div className="h-full rounded-full bg-brand-gradient" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.5, ease: EASE }} />
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="relative">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              {step === 0 && (
                <div>
                  <h1 className="font-display text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Join findMe</h1>
                  <p className="mt-2 text-[15px] text-ink-soft sm:mt-3 sm:text-base">How will you use findMe? You can do both later.</p>
                  <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4">
                    {([
                      { v: "client", icon: Search, t: "I want to hire", d: "Find skilled people and get things done." },
                      { v: "provider", icon: Briefcase, t: "I want to offer my skills", d: "List your services and get hired." },
                    ] as const).map(({ v, icon: Icon, t, d }) => {
                      const active = role === v;
                      return (
                        <button
                          type="button"
                          key={v}
                          onClick={() => {
                            setRole(v);
                            setErrors({});
                          }}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-2xl border-2 bg-white p-4 text-left transition-all duration-200 sm:gap-4 sm:p-5",
                            active ? "border-brand-500 shadow-lift" : "border-line hover:border-brand-200 hover:shadow-soft"
                          )}
                        >
                          <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl transition-colors sm:size-13 sm:rounded-2xl", active ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-600")}>
                            <Icon className="size-5 sm:size-6" />
                          </span>
                          <span className="flex-1">
                            <span className="block text-[15px] font-bold sm:text-lg">{t}</span>
                            <span className="block text-[13px] text-muted sm:text-sm">{d}</span>
                          </span>
                          <span className={cn("grid size-6 place-items-center rounded-full border-2 transition-all", active ? "border-brand-600 bg-brand-600" : "border-line")}>
                            <AnimatePresence>
                              {active && (
                                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                  <Check className="size-3.5 text-white" strokeWidth={3} />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <FieldError msg={errors.role} />
                </div>
              )}

              {step === 1 && (
                <div>
                  <h1 className="font-display text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Create your account</h1>
                  <p className="mt-2 text-[15px] text-ink-soft sm:mt-3 sm:text-base">It takes less than a minute.</p>
                  <div className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
                    <div>
                      <Label htmlFor="name" hint={ninEnabled ? "As on your NIN" : undefined}>Full name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="e.g. Amara Okafor" aria-invalid={!!errors.name} autoFocus />
                      <FieldError msg={errors.name} />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} />
                      <FieldError msg={errors.email} />
                    </div>
                    <div>
                      <Label htmlFor="phone" hint={role === "provider" ? "Mobile or business line" : "Optional"}>Phone number</Label>
                      <PhoneInput id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!errors.phone} />
                      <FieldError msg={errors.phone} />
                      <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
                        <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} className="size-4 accent-brand-600" />
                        This number is on WhatsApp
                      </label>
                      <p className="mt-1 text-xs text-muted">Shared only after a request is accepted.</p>
                    </div>
                    {ninEnabled && (
                      <div>
                        <Label htmlFor="nin" hint="Optional">National Identification Number (NIN)</Label>
                        <Input
                          id="nin"
                          inputMode="numeric"
                          autoComplete="off"
                          maxLength={14}
                          value={nin}
                          onChange={(e) => setNin(e.target.value.replace(/[^\d ]/g, ""))}
                          placeholder="e.g. 12345678901"
                          aria-invalid={!!errors.nin}
                        />
                        <FieldError msg={errors.nin} />
                        <p className="mt-1 text-xs text-muted">
                          Adds an ID verified badge{role === "provider" ? " and ranks you higher" : ""}. We check it with NIMC and that it matches your
                          name above, keep only the last 4 digits, and never show it to anyone. <a href="/privacy#nin" target="_blank" className="font-semibold text-brand-700 hover:underline">How we use it</a>
                        </p>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="password" hint="8+ characters">Password</Label>
                      <div className="relative">
                        <Input id="password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="Create a password" aria-invalid={!!errors.password} className="pr-12" />
                        <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-brand-50 hover:text-brand-700" aria-label={showPw ? "Hide password" : "Show password"}>
                          {showPw ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                        </button>
                      </div>
                      {password && (
                        <div className="mt-2.5 flex items-center gap-3">
                          <div className="flex flex-1 gap-1">
                            {[0, 1, 2, 3].map((i) => (
                              <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                                <motion.div className={cn("h-full", pwColors[Math.max(0, strength - 1)])} initial={false} animate={{ width: i < strength ? "100%" : "0%" }} transition={{ duration: 0.3 }} />
                              </div>
                            ))}
                          </div>
                          <span className="w-16 text-right text-xs font-semibold text-muted">{pwLabels[Math.max(0, strength - 1)]}</span>
                        </div>
                      )}
                      <FieldError msg={errors.password} />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h1 className="font-display text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Your professional profile</h1>
                  <p className="mt-2 text-[15px] text-ink-soft sm:mt-3 sm:text-base">This is what clients see in search.</p>
                  <div className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
                    <div>
                      <Label htmlFor="businessName" hint="Optional">Business name</Label>
                      <Input id="businessName" value={businessName} maxLength={80} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Amara Designs" />
                      <p className="mt-1 text-xs text-muted">If you add one, clients see it instead of your name.</p>
                    </div>
                    <div>
                      <Label htmlFor="headline" hint={`${headline.length}/120`}>Headline</Label>
                      <Input id="headline" value={headline} maxLength={120} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Certified electrician for homes & offices" aria-invalid={!!errors.headline} autoFocus />
                      <FieldError msg={errors.headline} />
                    </div>
                    <div>
                      <Label>Main category</Label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {CATEGORIES.map((c) => (
                          <button
                            type="button"
                            key={c.slug}
                            onClick={() => setCategory(c.slug)}
                            className={cn(
                              "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition-all",
                              category === c.slug ? "border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-200" : "border-line bg-white text-ink-soft hover:border-brand-200"
                            )}
                          >
                            <CategoryIcon slug={c.slug} className="size-4 shrink-0" />
                            <span className="leading-tight">{c.name}</span>
                          </button>
                        ))}
                      </div>
                      <FieldError msg={errors.category} />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="location" hint="Area, State">Location</Label>
                        <LocationInput id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="rate" hint="optional">Your rate (₦)</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted">₦</span>
                          <Input id="rate" type="number" min={0} value={rate} onChange={(e) => setRate(e.target.value)} placeholder="10000" className="pl-8" />
                        </div>
                        <RateUnitPicker value={rateUnit} onChange={setRateUnit} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h1 className="font-display text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-4xl">What are you good at?</h1>
                  <p className="mt-2 text-[15px] text-ink-soft sm:mt-3 sm:text-base">Add the skills you want to be found for. Be specific.</p>
                  <div className="mt-6 sm:mt-8">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                        placeholder="Type a skill and press Enter"
                        aria-invalid={!!errors.skills}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <div className="flex rounded-xl border border-line bg-white p-1">
                          {SKILL_LEVELS.map((l) => (
                            <button
                              type="button"
                              key={l}
                              onClick={() => setSkillLevel(l)}
                              className={cn("relative rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors", skillLevel === l ? "text-white" : "text-muted hover:text-ink")}
                            >
                              {skillLevel === l && <motion.span layoutId="lvl" className="absolute inset-0 rounded-lg bg-ink" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                              <span className="relative">{l}</span>
                            </button>
                          ))}
                        </div>
                        <button type="button" onClick={() => addSkill()} className={btn("dark", "md", "size-12 shrink-0 rounded-xl px-0")} aria-label="Add skill">
                          <Plus className="size-5" />
                        </button>
                      </div>
                    </div>
                    <FieldError msg={errors.skills} />

                    <div className="mt-5 flex min-h-12 flex-wrap gap-2">
                      <AnimatePresence>
                        {skills.map((s) => (
                          <motion.span
                            key={s.name}
                            layout
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            className="inline-flex items-center gap-2 rounded-full bg-brand-600 py-1.5 pl-3.5 pr-1.5 text-sm font-semibold text-white"
                          >
                            {s.name}
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wide">{s.level}</span>
                            <button type="button" onClick={() => setSkills((k) => k.filter((x) => x.name !== s.name))} className="grid size-6 place-items-center rounded-full hover:bg-white/20" aria-label={`Remove ${s.name}`}>
                              <X className="size-3.5" />
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                      {skills.length === 0 && <p className="self-center text-sm text-muted">No skills yet. Add one or pick a suggestion.</p>}
                    </div>

                    {category && (
                      <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4">
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700">
                          <Sparkles className="size-3.5" /> Suggested for you
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(SUGGESTIONS[category] ?? [])
                            .filter((s) => !skills.some((k) => k.name === s))
                            .map((s) => (
                              <button type="button" key={s} onClick={() => addSkill(s)} className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:-translate-y-0.5 hover:border-brand-400">
                                <Plus className="size-3.5" /> {s}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {state.error && <p className="mt-4 text-sm font-medium text-red-600">{state.error}</p>}

        <div className="mt-7 flex items-center gap-3 sm:mt-10">
          {step > 0 && (
            <button type="button" onClick={() => go(step - 1)} className={btn("outline", "lg", "size-13 px-0")} aria-label="Back">
              <ArrowLeft className="size-5" />
            </button>
          )}
          <button type="submit" disabled={pending} className={btn("primary", "lg", "group flex-1")}>
            {pending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : step === last ? (
              <>
                Create my account <Check className="size-5" />
              </>
            ) : (
              <>
                Continue <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </form>

      <p className="mt-5 text-center text-xs leading-relaxed text-muted">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="font-semibold text-ink-soft underline-offset-2 hover:underline">Terms of Service</Link> and{" "}
        <Link href="/privacy" className="font-semibold text-ink-soft underline-offset-2 hover:underline">Privacy Policy</Link>.
      </p>

      <p className="mt-4 text-center text-sm text-muted sm:mt-6">
        Already have an account?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
