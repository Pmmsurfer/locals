"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { AVATAR_DEFAULT_ID, type AvatarId } from "@/lib/avatars";
import {
  type DayPart,
  type PaceLevel,
  type ProfileActivity,
  type ProfileAvailability,
  type ProfilePace,
  type Weekday,
  profileActivityHasPace,
} from "@/types";

const ACTIVITIES: ProfileActivity[] = [
  "running",
  "cycling",
  "surfing",
  "swimming",
  "social",
  "hiking",
  "yoga",
  "climbing",
  "tennis",
];
const PACE_LEVELS: PaceLevel[] = ["easy", "moderate", "fast", "race"];
const WEEKDAYS: { id: Weekday; label: string }[] = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];
const TIMES: { id: DayPart; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
];

const STEPS = 5;

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "local"
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [avatarId, setAvatarId] = useState<AvatarId>(AVATAR_DEFAULT_ID);
  const [activities, setActivities] = useState<ProfileActivity[]>([]);
  const [paceByActivity, setPaceByActivity] = useState<ProfilePace>({});
  const [neighborhood, setNeighborhood] = useState("");
  const [days, setDays] = useState<Weekday[]>([]);
  const [times, setTimes] = useState<DayPart[]>([]);
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedActivities = useMemo(
    () => new Set(activities),
    [activities]
  );

  function toggleActivity(a: ProfileActivity) {
    setActivities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  function setPace(activity: ProfileActivity, level: PaceLevel) {
    setPaceByActivity((prev) => ({ ...prev, [activity]: level }));
  }

  function toggleDay(d: Weekday) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function toggleTime(t: DayPart) {
    setTimes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function validateStep(current: number): string | null {
    if (current === 1 && !avatarId) {
      return "Choose an avatar.";
    }
    if (current === 2 && activities.length < 1) {
      return "Pick at least one activity.";
    }
    if (current === 3) {
      for (const a of activities) {
        if (profileActivityHasPace(a) && !paceByActivity[a]) {
          return "Set a pace for each activity that uses pace.";
        }
      }
    }
    if (current === 4) {
      if (!neighborhood.trim()) {
        return "Add your neighborhood.";
      }
      if (days.length < 1 || times.length < 1) {
        return "Choose at least one day and one time.";
      }
    }
    return null;
  }

  function goNext() {
    const msg = validateStep(step);
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  async function complete() {
    const msg = validateStep(4);
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("You need to be signed in.");
      return;
    }

    const fullName =
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      user.email?.split("@")[0] ||
      "Local";

    const usernameBase = slugify(fullName);
    const username = `${usernameBase}-${user.id.slice(0, 6)}`;

    const pace: ProfilePace = {};
    activities.forEach((a) => {
      if (!profileActivityHasPace(a)) return;
      const p = paceByActivity[a];
      if (p) pace[a] = p;
    });

    const availability: ProfileAvailability = { days, times };

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: fullName,
        username,
        avatar_id: avatarId,
        avatar_url: null,
        bio: bio.trim() || null,
        neighborhood: neighborhood.trim(),
        city: null,
        activities,
        pace,
        availability,
        email_notifications: true,
        is_verified: false,
        is_active: true,
      },
      { onConflict: "id" }
    );

    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    router.push("/feed");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background px-4 py-10 text-foreground">
      <header className="mb-8 space-y-2">
        <p className="font-sans text-3xl font-extrabold tracking-wide text-accent">
          LOCALS
        </p>
        <h1 className="text-xl font-semibold text-foreground">
          Tell us how you move
        </h1>
        <div className="flex items-center gap-2 pt-2">
          {Array.from({ length: STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < step ? "bg-accent" : "bg-border"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted">
          Step {step} of {STEPS}
        </p>
      </header>

      <section className="flex-1 space-y-6 rounded-card border border-card-border bg-surface p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-sans text-2xl font-extrabold tracking-wide text-foreground">
              Choose your avatar
            </h2>
            <p className="text-sm text-muted">
              Pick one — you can change it later in your profile.
            </p>
            <AvatarPicker value={avatarId} onChange={setAvatarId} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="font-sans text-2xl font-extrabold tracking-wide text-foreground">
              Activities
            </h2>
            <p className="text-sm text-muted">
              Choose everything you want to do with others (pick at least
              one).
            </p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITIES.map((a) => {
                const on = selectedActivities.has(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleActivity(a)}
                    className={`rounded-button border px-3 py-2 text-sm font-semibold capitalize transition ${
                      on
                        ? "border-transparent bg-accent text-white"
                        : "border border-border bg-surface text-foreground hover:bg-background"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-sans text-2xl font-extrabold tracking-wide text-foreground">
              Pace
            </h2>
            {activities.some((a) => profileActivityHasPace(a)) ? (
              <p className="text-sm text-muted">
                Set your usual pace for each activity.
              </p>
            ) : (
              <p className="text-sm text-muted">
                Pace doesn&apos;t apply to the activities you picked — you can
                continue.
              </p>
            )}
            {activities.filter(profileActivityHasPace).map((a) => (
              <div key={a} className="space-y-2">
                <p className="text-sm font-medium capitalize text-foreground">
                  {a}
                </p>
                <div className="flex flex-wrap gap-2">
                  {PACE_LEVELS.map((level) => {
                    const selected = paceByActivity[a] === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setPace(a, level)}
                        className={`rounded-button border px-3 py-1.5 text-xs font-semibold capitalize ${
                          selected
                            ? "border-transparent bg-accent text-white"
                            : "border border-border bg-surface text-foreground hover:bg-background"
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="font-sans text-2xl font-extrabold tracking-wide text-foreground">
              Where &amp; when
            </h2>
            <Input
              label="Neighborhood"
              name="neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="e.g. Mission, Venice"
            />
            <div className="space-y-2">
              <span className="text-sm text-muted">Days</span>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(({ id, label }) => {
                  const on = days.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleDay(id)}
                      className={`rounded-button border px-3 py-1.5 text-xs font-semibold ${
                        on
                          ? "border-transparent bg-accent text-white"
                          : "border border-border bg-surface text-foreground hover:bg-background"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-muted">Times</span>
              <div className="flex flex-wrap gap-2">
                {TIMES.map(({ id, label }) => {
                  const on = times.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleTime(id)}
                      className={`rounded-button border px-3 py-1.5 text-xs font-semibold ${
                        on
                          ? "border-transparent bg-accent text-white"
                          : "border border-border bg-surface text-foreground hover:bg-background"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <h2 className="font-sans text-2xl font-extrabold tracking-wide text-foreground">
              Bio
            </h2>
            <p className="text-sm text-muted">
              Optional — a short line helps people recognize you.
            </p>
            <Textarea
              label="About you"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Weekend trail runner, coffee after miles…"
            />
          </div>
        )}

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <footer className="mt-8 flex justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={step === 1 || saving}
        >
          Back
        </Button>
        {step < STEPS ? (
          <Button type="button" onClick={goNext} disabled={saving}>
            Continue
          </Button>
        ) : (
          <Button type="button" onClick={complete} disabled={saving}>
            {saving ? "Saving…" : "Finish"}
          </Button>
        )}
      </footer>
    </div>
  );
}
