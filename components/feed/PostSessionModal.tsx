"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_FEED_LAT, DEFAULT_FEED_LNG } from "@/lib/feed-default-location";
import { toDatetimeLocalValue } from "@/lib/datetime-local";
import {
  isUnlimitedMaxSpots,
  UNLIMITED_MAX_SPOTS,
} from "@/lib/session-capacity";
import { usePostSession } from "@/contexts/PostSessionContext";
import type { Activity, Session, SessionPaceLevel } from "@/types";
import type { JoinConfirmationSession } from "./JoinConfirmationModal";
import {
  AddressAutocompleteField,
  type AddressPlaceResult,
} from "./AddressAutocompleteField";
import { SessionCover } from "@/components/sessions/SessionCover";

const ACTIVITIES: Activity[] = [
  "running",
  "cycling",
  "surfing",
  "swimming",
  "social",
];
const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "No end time" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "60 minutes" },
  { value: 90, label: "90 minutes" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "Half day (4 hours)" },
];
const PACES: SessionPaceLevel[] = ["easy", "moderate", "fast", "race"];

const MAX_NUMERIC_CHOICES = [2, 3, 4, 5, 6, 8, 10, 15, 20] as const;

type MaxSpotsPreset =
  | "unlimited"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "8"
  | "10"
  | "15"
  | "20"
  | "custom";

function maxSpotsToPreset(max: number): {
  preset: MaxSpotsPreset;
  custom: number;
} {
  if (isUnlimitedMaxSpots(max)) {
    return { preset: "unlimited", custom: 6 };
  }
  for (const n of MAX_NUMERIC_CHOICES) {
    if (n === max) {
      return { preset: String(n) as MaxSpotsPreset, custom: 6 };
    }
  }
  return { preset: "custom", custom: max };
}

function getMaxSpotsForDb(
  preset: MaxSpotsPreset,
  custom: number
): number {
  if (preset === "unlimited") return UNLIMITED_MAX_SPOTS;
  if (preset === "custom") {
    return Math.max(1, Math.min(500, Math.round(custom)));
  }
  return Number(preset);
}

type SessionPrivacy = "public" | "link_only";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (session: JoinConfirmationSession) => void;
  userId: string;
  hostDisplayName: string;
  editingSession: Session | null;
};

export function PostSessionModal({
  open,
  onClose,
  onSuccess,
  userId,
  hostDisplayName,
  editingSession,
}: Props) {
  const router = useRouter();
  const { notifySessionPosted } = usePostSession();
  const isEdit = Boolean(editingSession);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activity, setActivity] = useState<Activity>("running");
  const [startsAt, setStartsAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [paceLevel, setPaceLevel] = useState<SessionPaceLevel>("moderate");
  const [beginnerFriendly, setBeginnerFriendly] = useState(false);
  const [contactInfo, setContactInfo] = useState("");
  const [maxSpotsPreset, setMaxSpotsPreset] =
    useState<MaxSpotsPreset>("unlimited");
  const [maxSpotsCustom, setMaxSpotsCustom] = useState(6);
  const [mapLat, setMapLat] = useState(DEFAULT_FEED_LAT);
  const [mapLng, setMapLng] = useState(DEFAULT_FEED_LNG);
  const [privacy, setPrivacy] = useState<SessionPrivacy>("public");
  const [postedShare, setPostedShare] = useState<{
    id: string;
    confirmation: JoinConfirmationSession;
  } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPostedShare(null);
    setLinkCopied(false);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (editingSession) {
      setTitle(editingSession.title);
      setDescription(editingSession.description?.trim() ?? "");
      setActivity(editingSession.activity);
      setStartsAt(toDatetimeLocalValue(editingSession.starts_at));
      {
        const dm = editingSession.duration_minutes;
        const valid = DURATION_OPTIONS.some((o) => o.value === dm);
        setDurationMinutes(valid ? dm : 60);
      }
      setLocationName(editingSession.location_name?.trim() ?? "");
      setAddress(editingSession.address?.trim() ?? "");
      setInstructions(editingSession.instructions?.trim() ?? "");
      setPaceLevel(editingSession.pace_level);
      setBeginnerFriendly(editingSession.beginner_friendly === true);
      setContactInfo(editingSession.contact_info?.trim() ?? "");
      const m = maxSpotsToPreset(editingSession.max_spots);
      setMaxSpotsPreset(m.preset);
      setMaxSpotsCustom(m.custom);
      setMapLat(DEFAULT_FEED_LAT);
      setMapLng(DEFAULT_FEED_LNG);
      setPrivacy(
        editingSession.privacy === "link_only" ? "link_only" : "public"
      );
    } else {
      setTitle("");
      setDescription("");
      setActivity("running");
      setStartsAt("");
      setDurationMinutes(60);
      setLocationName("");
      setAddress("");
      setInstructions("");
      setPaceLevel("moderate");
      setBeginnerFriendly(false);
      setContactInfo("");
      setMaxSpotsPreset("unlimited");
      setMaxSpotsCustom(6);
      setMapLat(DEFAULT_FEED_LAT);
      setMapLng(DEFAULT_FEED_LNG);
      setPrivacy("public");
    }
  }, [open, editingSession]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onAddressPlaceResolved = useCallback((p: AddressPlaceResult) => {
    setMapLat(p.lat);
    setMapLng(p.lng);
    setLocationName((prev) => {
      if (prev.trim()) return prev;
      return p.nameOrShort?.trim() ?? prev;
    });
  }, []);

  if (!open) return null;

  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  const showPaceField = activity === "running" || activity === "cycling";
  const showBeginnerField = activity === "surfing";
  const maxSpotsForSubmit = getMaxSpotsForDb(
    maxSpotsPreset,
    maxSpotsCustom
  );

  const shareBaseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = postedShare
    ? `${shareBaseUrl}/s/${postedShare.id}`
    : "";

  const privacyValue = privacy === "link_only" ? "link_only" : "public";

  function buildPaceForDb(): SessionPaceLevel {
    if (activity === "surfing") return "easy";
    if (activity === "social" || activity === "swimming") return "moderate";
    return paceLevel;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (isEdit && editingSession) {
      if (
        !isUnlimitedMaxSpots(maxSpotsForSubmit) &&
        maxSpotsForSubmit < editingSession.spots_filled
      ) {
        setError(
          `Max spots must be at least ${editingSession.spots_filled} (already filled).`
        );
        return;
      }
    }
    if (maxSpotsPreset === "custom") {
      const c = getMaxSpotsForDb("custom", maxSpotsCustom);
      if (c < 1) {
        setError("Custom max spots must be at least 1.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const startsIso = new Date(startsAt).toISOString();
      const ewkt = `SRID=4326;POINT(${mapLng} ${mapLat})`;
      const isSurfing = activity === "surfing";
      const paceForDb = buildPaceForDb();
      const desc = description.trim() || null;
      const inst = instructions.trim() || null;
      const contact = contactInfo.trim() || null;

      if (isEdit && editingSession) {
        const { error: updateError } = await supabase
          .from("sessions")
          .update({
            title: title.trim(),
            description: desc,
            activity,
            starts_at: startsIso,
            duration_minutes: durationMinutes,
            location_name: locationName.trim() || null,
            address: address.trim() || null,
            instructions: inst,
            pace_level: paceForDb,
            beginner_friendly: isSurfing ? beginnerFriendly : false,
            contact_info: contact,
            max_spots: maxSpotsForSubmit,
            privacy: privacyValue,
            location: ewkt,
          })
          .eq("id", editingSession.id);

        if (updateError) {
          setError(updateError.message);
          return;
        }
        notifySessionPosted();
        router.refresh();
        onClose();
        return;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("sessions")
        .insert({
          creator_id: userId,
          title: title.trim(),
          description: desc,
          activity,
          starts_at: startsIso,
          duration_minutes: durationMinutes,
          location_name: locationName.trim() || null,
          address: address.trim() || null,
          instructions: inst,
          pace_level: paceForDb,
          beginner_friendly: isSurfing ? beginnerFriendly : false,
          contact_info: contact,
          max_spots: maxSpotsForSubmit,
          spots_filled: 0,
          status: "open",
          location: ewkt,
          privacy: privacyValue,
        })
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }
      if (!inserted?.id) {
        setError("Could not read new session id.");
        return;
      }

      const confirmation: JoinConfirmationSession = {
        title: title.trim(),
        activity,
        starts_at: startsIso,
        duration_minutes: durationMinutes,
        location_name: locationName.trim() || null,
        address: address.trim() || null,
        pace_level: paceForDb,
        creator_full_name: hostDisplayName,
        creator_username: null,
      };
      setPostedShare({ id: inserted.id as string, confirmation });
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyShareLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function handleDoneAfterShare() {
    if (!postedShare) return;
    onSuccess(postedShare.confirmation);
    setTitle("");
    setDescription("");
    setStartsAt("");
    setLocationName("");
    setAddress("");
    setInstructions("");
    setContactInfo("");
    setPrivacy("public");
    setMaxSpotsPreset("unlimited");
    setMaxSpotsCustom(6);
    setMapLat(DEFAULT_FEED_LAT);
    setMapLng(DEFAULT_FEED_LNG);
    setPostedShare(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-session-title"
        className="max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-t-card border border-card-border bg-surface shadow-xl sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <h2
            id="post-session-title"
            className="font-sans text-2xl font-extrabold tracking-wide text-foreground"
          >
            {postedShare
              ? "Session posted"
              : isEdit
                ? "Edit session"
                : "Post a session"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-button p-2 text-muted hover:bg-background hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {postedShare ? (
          <div className="space-y-5 px-4 py-6">
            <p className="font-sans text-lg font-extrabold text-foreground">
              Share your session
            </p>
            <p className="break-all text-sm text-muted">{shareUrl}</p>
            <button
              type="button"
              onClick={() => void copyShareLink()}
              className="w-full rounded-button border border-border bg-background py-3 text-sm font-bold text-foreground transition hover:bg-surface"
            >
              {linkCopied ? "Copied!" : "Copy link"}
            </button>
            <Button
              type="button"
              className="w-full"
              onClick={handleDoneAfterShare}
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pb-5">
            <div className="w-full">
              <div className="h-[160px] w-full overflow-hidden">
                <SessionCover
                  activity={activity}
                  height={160}
                  borderRadius="12px 12px 0 0"
                />
              </div>
              <p className="mb-4 text-center text-[11px] text-[#888880]">
                Cover updates based on your activity
              </p>
            </div>

            <div className="space-y-4 px-4">
              <div className="space-y-2">
                <p className="text-sm text-muted">Privacy</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPrivacy("public")}
                    className={`min-h-[44px] flex-1 rounded-lg px-2 py-2 text-center text-sm font-semibold transition ${
                      privacy === "public"
                        ? "border-0 bg-[#1B3FF0] text-white"
                        : "border border-[#DDDDD8] bg-white text-[#888880]"
                    }`}
                  >
                    🌍 Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrivacy("link_only")}
                    className={`min-h-[44px] flex-1 rounded-lg px-2 py-2 text-center text-sm font-semibold transition ${
                      privacy === "link_only"
                        ? "border-0 bg-[#1B3FF0] text-white"
                        : "border border-[#DDDDD8] bg-white text-[#888880]"
                    }`}
                  >
                    🔗 Link only
                  </button>
                </div>
                <p className="text-[12px] italic text-[#888880]">
                  {privacy === "public" ? (
                    <>Anyone nearby can find and join this session</>
                  ) : (
                    <>Only people with the link can join</>
                  )}
                </p>
              </div>

              <Input
                label="Title"
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sunrise miles"
              />

              <label className="flex flex-col gap-1.5 text-sm text-foreground">
                <span className="text-muted">Activity</span>
                <select
                  name="activity"
                  value={activity}
                  onChange={(e) => {
                    const next = e.target.value as Activity;
                    setActivity(next);
                    if (next !== "surfing") setBeginnerFriendly(false);
                  }}
                  className="rounded-button border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {ACTIVITIES.map((a) => (
                    <option key={a} value={a}>
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-1.5 text-sm text-foreground">
                <span className="text-muted">About this session</span>
                <textarea
                  name="description"
                  rows={3}
                  value={description}
                  maxLength={300}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What should people expect? Pace, vibe, what to bring..."
                  className="min-h-[4.5rem] rounded-button border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <p className="text-right text-xs text-muted" aria-live="polite">
                  {description.length}/300
                </p>
              </div>

              <Input
                label="Starts"
                name="startsAt"
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />

              <label className="flex flex-col gap-1.5 text-sm text-foreground">
                <span className="text-muted">Duration</span>
                <select
                  name="duration"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="rounded-button border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <Input
                label="Location name"
                name="locationName"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Park entrance, trailhead…"
              />

              <AddressAutocompleteField
                key={editingSession?.id ?? "new-session"}
                apiKey={googleMapsKey}
                value={address}
                onChange={setAddress}
                onPlaceResolved={onAddressPlaceResolved}
                disabled={submitting}
              />

              <div className="flex flex-col gap-1.5 text-sm text-foreground">
                <span className="text-muted">How to find us</span>
                <textarea
                  name="instructions"
                  rows={2}
                  value={instructions}
                  maxLength={200}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Where exactly to meet, what to look for, any parking tips..."
                  className="min-h-[3.25rem] rounded-button border border-border bg-surface px-3 py-2 text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {showPaceField ? (
                <label className="flex flex-col gap-1.5 text-sm text-foreground">
                  <span className="text-muted">Pace</span>
                  <select
                    name="pace"
                    value={paceLevel}
                    onChange={(e) =>
                      setPaceLevel(e.target.value as SessionPaceLevel)
                    }
                    className="rounded-button border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {PACES.map((p) => (
                      <option key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {showBeginnerField ? (
                <label className="flex cursor-pointer items-center gap-3 rounded-button border border-border bg-surface px-3 py-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    name="beginnerFriendly"
                    checked={beginnerFriendly}
                    onChange={(e) => setBeginnerFriendly(e.target.checked)}
                    className="h-4 w-4 rounded border border-border text-accent focus:ring-accent"
                  />
                  <span>Beginner friendly</span>
                </label>
              ) : null}

              <div>
                <Input
                  label="Contact"
                  name="contactInfo"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="e.g. +1 310 555 0123 or @yourhandle"
                />
                <p className="mt-1.5 text-xs text-muted">
                  How should people reach you? WhatsApp number, Instagram, or
                  anything else.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 text-sm text-foreground">
                <span className="text-muted">Max spots</span>
                <select
                  name="maxSpotsPreset"
                  value={maxSpotsPreset}
                  onChange={(e) =>
                    setMaxSpotsPreset(e.target.value as MaxSpotsPreset)
                  }
                  className="rounded-button border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="unlimited">More the merrier</option>
                  {MAX_NUMERIC_CHOICES.map((n) => (
                    <option key={n} value={String(n)}>
                      {n} people
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
                {maxSpotsPreset === "custom" ? (
                  <input
                    type="number"
                    name="maxSpotsCustom"
                    min={1}
                    max={500}
                    value={maxSpotsCustom}
                    onChange={(e) =>
                      setMaxSpotsCustom(Number(e.target.value) || 1)
                    }
                    className="rounded-button border border-border bg-surface px-3 py-2 text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                ) : null}
              </div>

              {error ? (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex gap-3 border-t border-border bg-surface px-4 pt-4">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting
                  ? isEdit
                    ? "Saving…"
                    : "Posting…"
                  : isEdit
                    ? "Save changes"
                    : "Post session"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
