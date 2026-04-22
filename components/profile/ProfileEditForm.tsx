"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AVATAR_DEFAULT_ID, isAvatarId, type AvatarId } from "@/lib/avatars";
import {
  type PaceLevel,
  type Profile,
  type ProfileActivity,
  type ProfilePace,
  profileActivityHasPace,
} from "@/types";

const PROFILE_ACTIVITIES: ProfileActivity[] = [
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

type Props = {
  userId: string;
  initialProfile: Profile;
};

export function ProfileEditForm({ userId, initialProfile }: Props) {
  const router = useRouter();
  const [avatarId, setAvatarId] = useState<AvatarId>(
    isAvatarId(initialProfile.avatar_id)
      ? initialProfile.avatar_id
      : AVATAR_DEFAULT_ID
  );
  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [username, setUsername] = useState(initialProfile.username ?? "");
  const [bio, setBio] = useState(initialProfile.bio ?? "");
  const [neighborhood, setNeighborhood] = useState(
    initialProfile.neighborhood ?? ""
  );
  const [activities, setActivities] = useState<ProfileActivity[]>(
    (initialProfile.activities ?? []) as ProfileActivity[]
  );
  const [paceByActivity, setPaceByActivity] = useState<ProfilePace>(
    (initialProfile.pace ?? {}) as ProfilePace
  );
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(() => new Set(activities), [activities]);

  const checkUsername = useCallback(
    async (name: string) => {
      const u = name.trim().toLowerCase();
      if (!u || u === (initialProfile.username ?? "").trim().toLowerCase()) {
        setUsernameTaken(false);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", u)
        .maybeSingle();
      setUsernameTaken(!!data && (data as { id: string }).id !== userId);
    },
    [initialProfile.username, userId]
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      void checkUsername(username);
    }, 400);
    return () => window.clearTimeout(t);
  }, [username, checkUsername]);

  function toggleActivity(a: ProfileActivity) {
    setActivities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  function setPace(activity: ProfileActivity, level: PaceLevel) {
    setPaceByActivity((prev) => ({ ...prev, [activity]: level }));
  }

  async function save() {
    setError(null);
    if (!fullName.trim()) {
      setError("Name is required.");
      return;
    }
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (usernameTaken) {
      setError("That username is taken.");
      return;
    }
    if (activities.length < 1) {
      setError("Pick at least one activity.");
      return;
    }
    for (const a of activities) {
      if (profileActivityHasPace(a) && !paceByActivity[a]) {
        setError("Set a pace for each activity that uses pace.");
        return;
      }
    }
    setSaving(true);
    const supabase = createClient();
    const pace: ProfilePace = {};
    activities.forEach((a) => {
      if (!profileActivityHasPace(a)) return;
      const p = paceByActivity[a];
      if (p) pace[a] = p;
    });

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        avatar_id: avatarId,
        bio: bio.trim() || null,
        neighborhood: neighborhood.trim() || null,
        city: initialProfile.city,
        activities,
        pace,
        availability: initialProfile.availability,
        email_notifications: initialProfile.email_notifications ?? true,
        is_verified: initialProfile.is_verified ?? false,
        is_active: initialProfile.is_active ?? true,
      },
      { onConflict: "id" }
    );

    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    router.push("/profile");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-8">
      <h1 className="font-sans text-2xl font-extrabold text-foreground">
        Edit profile
      </h1>

      <section className="mt-8 space-y-4">
        <p className="text-sm font-semibold text-foreground">Avatar</p>
        <AvatarPicker value={avatarId} onChange={setAvatarId} />
      </section>

      <div className="mt-8 space-y-4">
        <Input
          label="Full name"
          name="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <div>
          <Input
            label="Username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            autoComplete="username"
          />
          {usernameTaken ? (
            <p className="mt-1 text-sm text-red-600">That username is taken.</p>
          ) : null}
        </div>
        <div>
          <Textarea
            label="Bio"
            name="bio"
            value={bio}
            maxLength={160}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short line about you"
          />
          <p className="mt-1 text-right text-xs text-muted">
            {bio.length} / 160
          </p>
        </div>
        <Input
          label="Neighborhood"
          name="neighborhood"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
        />
      </div>

      <section className="mt-10 space-y-3">
        <h2 className="text-sm font-bold text-foreground">Activities</h2>
        <div className="flex flex-wrap gap-2">
          {PROFILE_ACTIVITIES.map((a) => {
            const on = selected.has(a);
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
      </section>

      {activities.some((a) => profileActivityHasPace(a)) ? (
        <section className="mt-8 space-y-5">
          <h2 className="text-sm font-bold text-foreground">Pace</h2>
          {activities.filter(profileActivityHasPace).map((a) => (
            <div key={a} className="space-y-2">
              <p className="text-sm font-medium capitalize text-foreground">
                {a}
              </p>
              <div className="flex flex-wrap gap-2">
                {PACE_LEVELS.map((level) => {
                  const on = paceByActivity[a] === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPace(a, level)}
                      className={`rounded-button border px-3 py-1.5 text-xs font-semibold capitalize ${
                        on
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
        </section>
      ) : null}

      {error ? (
        <p className="mt-6 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex gap-3">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/profile")}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
