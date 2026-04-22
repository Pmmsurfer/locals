"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatSessionDetailSummary } from "@/lib/format-session";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/input";
import {
  JoinConfirmationModal,
  type JoinConfirmationSession,
} from "@/components/feed/JoinConfirmationModal";
import { isUnlimitedMaxSpots } from "@/lib/session-capacity";
import type { Activity, Session, SessionAttendeeRow } from "@/types";

const activityBadge: Record<
  Activity,
  string
> = {
  running: "border-0 bg-[#E8FFF0] text-[#16A34A]",
  cycling: "border-0 bg-[#FFF4E8] text-[#D97706]",
  surfing: "border-0 bg-[#E8EEFF] text-[#1B3FF0]",
  swimming: "border-0 bg-[#E0F7FF] text-[#006994]",
  social: "border-0 bg-[#FFF3E0] text-[#E65100]",
};

const paceBadge =
  "inline-flex rounded-lg border border-border bg-background px-2 py-0.5 text-[11px] font-medium capitalize text-foreground";

const beginnerBadge =
  "inline-flex rounded-lg border-0 bg-[#E8EEFF] px-2 py-0.5 text-[11px] font-semibold text-accent";

function displayName(a: SessionAttendeeRow) {
  return (
    a.full_name?.trim() || a.username?.trim() || "Member"
  );
}

function toJoinConfirmation(
  session: Session,
  creatorName: string
): JoinConfirmationSession {
  return {
    title: session.title,
    activity: session.activity,
    starts_at: session.starts_at,
    duration_minutes: session.duration_minutes,
    location_name: session.location_name,
    address: session.address,
    pace_level: session.pace_level,
    creator_full_name: creatorName,
    creator_username: null,
  };
}

type Props = {
  session: Session;
  attendees: SessionAttendeeRow[];
  currentUserId: string;
  initialJoined: boolean;
  creatorDisplayName: string;
};

export function SessionDetail({
  session: initialSession,
  attendees,
  currentUserId,
  initialJoined,
  creatorDisplayName,
}: Props) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [isJoined, setIsJoined] = useState(initialJoined);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinConfirmation, setJoinConfirmation] =
    useState<JoinConfirmationSession | null>(null);
  const [waDraft, setWaDraft] = useState(session.whatsapp_link ?? "");
  const [waSaving, setWaSaving] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);

  useEffect(() => {
    setSession(initialSession);
    setIsJoined(initialJoined);
    setWaDraft(initialSession.whatsapp_link ?? "");
  }, [initialSession, initialJoined]);

  const isCreator = session.creator_id === currentUserId;
  const spotsLeft = session.max_spots - session.spots_filled;
  const unlimited = isUnlimitedMaxSpots(session.max_spots);
  const isFull = unlimited
    ? session.status === "cancelled" || session.status === "completed"
    : session.status !== "open" || spotsLeft <= 0;
  const showBeginner =
    session.activity === "surfing" && session.beginner_friendly === true;

  const summaryLine = useMemo(
    () =>
      formatSessionDetailSummary(session.starts_at, session.duration_minutes),
    [session.starts_at, session.duration_minutes]
  );

  const handleJoin = useCallback(async () => {
    if (joining || isJoined || isFull || isCreator) return;
    setJoining(true);
    setJoinError(null);
    const supabase = createClient();
    const { error } = await supabase.from("session_participants").insert({
      session_id: session.id,
      user_id: currentUserId,
      status: "joined",
    });
    setJoining(false);
    if (error) {
      setJoinError(error.message);
      return;
    }
    const nextSpots = session.spots_filled + 1;
    const nextStatus =
      isUnlimitedMaxSpots(session.max_spots) || nextSpots < session.max_spots
        ? session.status
        : ("full" as const);
    const nextSession: Session = {
      ...session,
      spots_filled: nextSpots,
      status: nextStatus,
    };
    setIsJoined(true);
    setSession(nextSession);
    setJoinConfirmation(toJoinConfirmation(nextSession, creatorDisplayName));
    router.refresh();
  }, [
    joining,
    isJoined,
    isFull,
    isCreator,
    session,
    currentUserId,
    creatorDisplayName,
    router,
  ]);

  const saveWhatsapp = useCallback(async () => {
    const trimmed = waDraft.trim();
    if (!trimmed) {
      setWaError("Enter a link or clear to skip.");
      return;
    }
    setWaSaving(true);
    setWaError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ whatsapp_link: trimmed })
      .eq("id", session.id)
      .eq("creator_id", currentUserId);
    setWaSaving(false);
    if (error) {
      setWaError(error.message);
      return;
    }
    setSession((s) => ({ ...s, whatsapp_link: trimmed }));
    router.refresh();
  }, [waDraft, session.id, currentUserId, router]);

  const waLink = session.whatsapp_link?.trim();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-4 pb-28 pt-6">
      <div className="mb-6">
        <Link
          href="/feed"
          className="inline-flex text-sm font-semibold text-accent underline-offset-4 hover:underline"
        >
          ← Back to feed
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <span
          className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${activityBadge[session.activity]}`}
        >
          {session.activity}
        </span>
        <div className="flex flex-wrap justify-end gap-2">
          {showBeginner ? (
            <span className={beginnerBadge}>Beginner friendly</span>
          ) : session.activity === "running" || session.activity === "cycling" ? (
            <span className={paceBadge}>{session.pace_level}</span>
          ) : null}
        </div>
      </div>

      <h1 className="mt-3 font-sans text-4xl font-extrabold tracking-wide text-foreground">
        {session.title}
      </h1>

      <p className="mt-2 text-base font-semibold text-accent">{summaryLine}</p>

      {session.location_name ? (
        <p className="mt-4 text-sm font-medium text-foreground">
          {session.location_name}
        </p>
      ) : null}
      {session.address ? (
        <p className="mt-1 text-sm text-muted">{session.address}</p>
      ) : null}

      <section className="mt-10">
        <h2 className="font-sans text-2xl font-extrabold tracking-wide text-foreground">
          Who&apos;s coming
        </h2>
        <ul className="mt-4 flex flex-wrap gap-6">
          {attendees.map((a) => (
            <li key={a.user_id} className="flex w-20 flex-col items-center text-center">
              <Avatar
                avatarId={a.avatar_id}
                name={displayName(a)}
                size="md"
                className="shrink-0"
              />
              <p className="mt-2 w-full truncate text-xs font-medium text-foreground">
                {displayName(a)}
              </p>
              {a.is_creator ? (
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  host
                </span>
              ) : (
                <span className="mt-0.5 h-3" aria-hidden />
              )}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          {unlimited
            ? "Open to all"
            : `${session.spots_filled} of ${session.max_spots} spots filled`}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-sans text-xl font-extrabold tracking-wide text-foreground">
          Group chat
        </h2>
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center rounded-button px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 sm:w-auto"
            style={{ backgroundColor: "#25D366" }}
          >
            Join the group chat
          </a>
        ) : isCreator ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted">
              Paste your WhatsApp group invite link so attendees can connect.
            </p>
            <Input
              label="WhatsApp group link"
              name="whatsapp"
              type="url"
              value={waDraft}
              onChange={(e) => setWaDraft(e.target.value)}
              placeholder="https://chat.whatsapp.com/…"
            />
            {waError ? (
              <p className="text-sm text-red-600" role="alert">
                {waError}
              </p>
            ) : null}
            <Button
              type="button"
              onClick={() => void saveWhatsapp()}
              disabled={waSaving}
            >
              {waSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No group link yet. The host may add one later.
          </p>
        )}
      </section>

      {joinError ? (
        <p className="mt-6 text-sm text-red-600" role="alert">
          {joinError}
        </p>
      ) : null}

      <div className="mt-auto pt-12">
        {isCreator ? (
          <span className="flex w-full justify-center rounded-lg bg-hosting py-3 text-sm font-bold uppercase tracking-wide text-accent">
            You&apos;re hosting
          </span>
        ) : isJoined ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-button border border-border bg-background py-3 text-sm font-bold text-muted"
          >
            You&apos;re in
          </button>
        ) : isFull ? (
          <Button type="button" variant="ghost" className="w-full" disabled>
            Session full
          </Button>
        ) : (
          <Button
            type="button"
            className="w-full"
            disabled={joining}
            onClick={() => void handleJoin()}
          >
            {joining ? "Joining…" : "Join session"}
          </Button>
        )}
      </div>

      <JoinConfirmationModal
        open={joinConfirmation !== null}
        onClose={() => setJoinConfirmation(null)}
        session={joinConfirmation}
      />
    </div>
  );
}
