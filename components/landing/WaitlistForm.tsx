"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CITIES = [
  "Los Angeles",
  "New York",
  "San Francisco",
  "Chicago",
  "Austin",
  "Miami",
  "Seattle",
  "Other",
] as const;

const ACTIVITIES = [
  "Running",
  "Cycling",
  "Surfing",
  "Swimming",
  "Social",
  "Hiking",
  "Yoga",
  "Climbing",
  "All of them",
] as const;

const fieldClass =
  "w-full rounded-button border border-border bg-surface p-3 text-[15px] text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [activity, setActivity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDuplicate(false);
    setSubmitting(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("waitlist").insert({
      email: email.trim(),
      neighborhood: city.trim() || null,
      activity: activity.trim() || null,
    });
    setSubmitting(false);
    if (insertError) {
      const code = (insertError as { code?: string }).code;
      const msg = insertError.message?.toLowerCase() ?? "";
      if (code === "23505" || msg.includes("duplicate") || msg.includes("unique")) {
        setDuplicate(true);
        return;
      }
      setError(insertError.message);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="text-center">
        <p className="font-sans text-[28px] font-extrabold text-accent">
          You&apos;re in! 🎉
        </p>
        <p className="mt-3 text-base text-muted">
          We&apos;ll reach out when we launch in your city.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      {duplicate ? (
        <p className="text-center text-base font-semibold text-accent" role="status">
          You&apos;re already on the list!
        </p>
      ) : null}

      <div>
        <label htmlFor="waitlist-email" className={labelClass}>
          Email
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setDuplicate(false);
            setEmail(e.target.value);
          }}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="waitlist-city" className={labelClass}>
          City
        </label>
        <select
          id="waitlist-city"
          name="city"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={fieldClass}
        >
          <option value="">Select your city</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="waitlist-activity" className={labelClass}>
          Favorite activity
        </label>
        <select
          id="waitlist-activity"
          name="activity"
          required
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          className={fieldClass}
        >
          <option value="">Choose one</option>
          {ACTIVITIES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-button bg-accent py-[14px] text-center text-base font-bold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Joining…" : "Join the waitlist"}
      </button>
    </form>
  );
}
