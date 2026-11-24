"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Clock, ExternalLink, Loader2, Package, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteServiceAction, saveServiceAction, type FormState } from "@/app/actions";
import { CATEGORIES, categoryName } from "@/lib/categories";
import type { MyService } from "@/lib/queries";
import { CategoryIcon } from "@/components/category-icon";
import { FadeIn } from "@/components/motion";
import { FieldError, Input, Label, Select, Textarea, btn, cn, formatMoney } from "@/components/ui";
import { Toast } from "@/components/toast";

export function ServicesManager({ services, defaultCategory, openNew, userId }: { services: MyService[]; defaultCategory: string; openNew: boolean; userId: string }) {
  const [editing, setEditing] = useState<MyService | "new" | null>(openNew ? "new" : null);
  const [toast, setToast] = useState<{ msg: string; at: number } | null>(null);
  const [deleting, startDelete] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (openNew) window.history.replaceState(null, "", "/dashboard/services");
  }, [openNew]);

  return (
    <div>
      <Toast message={toast?.msg} trigger={toast?.at} />
      <FadeIn className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-[1.5rem] font-extrabold leading-tight tracking-tight sm:text-4xl">My services</h1>
          <p className="mt-1 text-sm text-ink-soft sm:mt-2 sm:text-base">Fixed-price services clients can request from your profile.</p>
        </div>
        <div className="flex gap-2">
          {services.length > 0 && (
            <Link href={`/pro/${userId}`} className={btn("outline")}>
              <ExternalLink className="size-4" /> Preview
            </Link>
          )}
          <button onClick={() => setEditing("new")} className={btn("primary")}>
            <Plus className="size-4" /> New service
          </button>
        </div>
      </FadeIn>

      {services.length === 0 ? (
        <FadeIn delay={0.1} className="card mt-5 rounded-2xl px-5 py-10 text-center sm:mt-8 sm:rounded-[1.25rem] sm:px-6 sm:py-16">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <Package className="size-8" />
          </span>
          <h2 className="mt-6 text-xl font-bold">Publish your first service</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            Describe a service and set a price. Clients can request it from your profile.
          </p>
          <button onClick={() => setEditing("new")} className={btn("primary", "lg", "mt-6")}>
            <Plus className="size-4.5" /> Create a service
          </button>
        </FadeIn>
      ) : (
        <motion.div layout className="mt-8 grid gap-4 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {services.map((s, i) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group card flex flex-col rounded-2xl p-4 transition-shadow hover:shadow-lift sm:rounded-[1.25rem] sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                    <CategoryIcon slug={s.category} className="size-3.5" /> {categoryName(s.category)}
                  </span>
                  <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <button onClick={() => setEditing(s)} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-brand-50 hover:text-brand-700" aria-label="Edit service">
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm(`Delete "${s.title}"? This can't be undone.`)) return;
                        setDeletingId(s.id);
                        startDelete(async () => {
                          await deleteServiceAction(s.id);
                          setToast({ msg: "Service deleted", at: Date.now() });
                        });
                      }}
                      className="grid size-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete service"
                    >
                      {deleting && deletingId === s.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </button>
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-bold leading-snug">{s.title}</h3>
                <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-soft">{s.description || "No description."}</p>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <p className="text-xl font-extrabold">
                    {formatMoney(s.price)}
                    <span className="text-sm font-medium text-muted">{s.price_unit === "hour" ? "/hr" : " fixed"}</span>
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-muted"><Clock className="size-3.5" /> {s.delivery_days}d delivery</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {editing && (
          <ServiceDrawer
            key={editing === "new" ? "new" : editing.id}
            service={editing === "new" ? null : editing}
            defaultCategory={defaultCategory}
            onClose={() => setEditing(null)}
            onSaved={(msg) => {
              setEditing(null);
              setToast({ msg, at: Date.now() });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ServiceDrawer({ service, defaultCategory, onClose, onSaved }: { service: MyService | null; defaultCategory: string; onClose: () => void; onSaved: (msg: string) => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const res = await saveServiceAction(prev, fd);
    if (res.ok) onSaved(res.message ?? "Saved");
    return res;
  }, {});
  const [unit, setUnit] = useState(service?.price_unit ?? "project");

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-[100] flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <motion.form
        action={action}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 34 }}
        className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 id="drawer-title" className="text-xl font-extrabold">{service ? "Edit service" : "New service"}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full text-muted hover:bg-brand-50" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <input type="hidden" name="id" value={service?.id ?? ""} />
          <div>
            <Label htmlFor="title">Service title</Label>
            <Input id="title" name="title" defaultValue={service?.title} placeholder="e.g. Professional logo with 3 concepts" maxLength={100} aria-invalid={!!state.fieldErrors?.title} autoFocus />
            <FieldError msg={state.fieldErrors?.title} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={service?.description} rows={5} maxLength={1200} placeholder="What's included, how you work, and what the client receives." />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select id="category" name="category" defaultValue={service?.category ?? defaultCategory} aria-invalid={!!state.fieldErrors?.category}>
              <option value="">Choose a category</option>
              {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </Select>
            <FieldError msg={state.fieldErrors?.category} />
          </div>
          <div>
            <Label>Pricing</Label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-canvas p-1">
              {(["project", "hour"] as const).map((u) => (
                <button type="button" key={u} onClick={() => setUnit(u)} className={cn("relative rounded-lg py-2.5 text-sm font-semibold transition-colors", unit === u ? "text-ink" : "text-muted")}>
                  {unit === u && <motion.span layoutId="unit" className="absolute inset-0 rounded-lg bg-white shadow-soft" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                  <span className="relative">{u === "project" ? "Fixed price" : "Hourly rate"}</span>
                </button>
              ))}
            </div>
            <input type="hidden" name="priceUnit" value={unit} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (₦)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted">₦</span>
                <Input id="price" name="price" type="number" min={1} defaultValue={service?.price} placeholder="50000" className="pl-8" aria-invalid={!!state.fieldErrors?.price} />
              </div>
              <FieldError msg={state.fieldErrors?.price} />
            </div>
            <div>
              <Label htmlFor="deliveryDays">Delivery (days)</Label>
              <Input id="deliveryDays" name="deliveryDays" type="number" min={1} defaultValue={service?.delivery_days ?? 3} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 border-t border-line px-6 py-5">
          <button type="button" onClick={onClose} className={btn("outline", "lg", "flex-1")}>Cancel</button>
          <button disabled={pending} className={btn("primary", "lg", "flex-[2]")}>
            {pending ? <Loader2 className="size-5 animate-spin" /> : service ? "Save changes" : "Publish service"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
