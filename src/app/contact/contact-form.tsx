"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { contactAction, type FormState } from "@/app/actions";
import { FieldError, Input, Label, Select, Textarea, btn } from "@/components/ui";

const TOPICS = [
  { v: "general", l: "General question" },
  { v: "account", l: "Help with my account" },
  { v: "safety", l: "Safety or a scam" },
  { v: "feedback", l: "Feedback or idea" },
  { v: "partnership", l: "Partnership or press" },
];

export function ContactForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(contactAction, {});

  if (state.ok) {
    return (
      <div className="card rounded-2xl p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-7" />
        </span>
        <h2 className="mt-4 text-xl font-bold">Message sent</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-soft">Thanks for getting in touch. We&apos;ll reply to your email, usually within one working day.</p>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-4 rounded-2xl p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Your name</Label>
          <Input id="name" name="name" defaultValue={name} autoComplete="name" required />
          <FieldError msg={state.fieldErrors?.name} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={email} autoComplete="email" required />
          <FieldError msg={state.fieldErrors?.email} />
        </div>
      </div>
      <div>
        <Label htmlFor="topic">Topic</Label>
        <Select id="topic" name="topic" defaultValue="general">
          {TOPICS.map((t) => (
            <option key={t.v} value={t.v}>{t.l}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={6} maxLength={3000} required placeholder="Tell us what's going on — include any names, dates or links that help." />
        <FieldError msg={state.fieldErrors?.message} />
      </div>
      {state.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.error}</p>}
      <button disabled={pending} className={btn("primary", "lg", "w-full sm:w-auto")}>
        {pending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-4.5" />} Send message
      </button>
    </form>
  );
}
