"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buildGoogleCalendarUrl } from "@/lib/calendar";
import { formatShareSessionDateLine } from "@/lib/format-session";
import type { PublicSessionBundle } from "@/lib/get-public-session";
import { createClient } from "@/lib/supabase/client";
import { isUnlimitedMaxSpots } from "@/lib/session-capacity";
import { usePostSession } from "@/contexts/PostSessionContext";
import type { Activity, Session, SessionAttendeeRow } from "@/types";
import { SessionCover } from "@/components/sessions/SessionCover";
import { Avatar } from "@/components/ui/Avatar";
import {
  JoinConfirmationModal,
  type JoinConfirmationSession,
} from "@/components/feed/JoinConfirmationModal";
import {
  contactActionButtonClass,
  contactInfoKind,
  contactWhatsAppButtonClass,
  smsHref,
  whatsappHref,
} from "@/lib/contact-display";

const activityBadge: Record<
  Activity,
  string
> = {
  running: "border-0 bg-[#E8FFF0] text-[#16A34A]",
  cycling: "border-0 bg-[#FFF4E8] text-[#D97706]",
  surfing: "border-0 bg-[#E8EEFF] text-accent",
  swimming: "border-0 bg-[#E0F7FF] text-[#006994]",
  social: "border-0 bg-[#FFF3E0] text-[#E65100]",
};

const paceBadge =
  "inline-flex rounded-lg border border-border bg-background px-2 py-0.5 text-xs font-semibold capitalize text-foreground";

const beginnerBadge =
  "inline-flex rounded-lg border-0 bg-[#E8EEFF] px-2 py-0.5 text-xs font-semibold text-accent";

function displayName(a: SessionAttendeeRow) {
  return a.full_name?.trim() || a.username?.trim() || "Member";
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

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconLink({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
      <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
    </svg>
  );
}

function GetInTouchBlock({
  value,
  onCopied,
  justCopied,
}: {
  value: string;
  onCopied: () => void;
  justCopied: boolean;
}) {
  const kind = contactInfoKind(value);
  if (kind === "phone") {
    return (
      <div className="mt-3 flex w-full gap-2">
        <a href={smsHref(value)} className={contactActionButtonClass}>
          Text us
        </a>
        <a
          href={whatsappHref(value)}
          target="_blank"
          rel="noopener noreferrer"
          className={contactWhatsAppButtonClass}
        >
          WhatsApp
        </a>
      </div>
    );
  }
  if (kind === "handle") {
    const h = value.trim();
    const uname = h.slice(1);
    return (
      <p className="mt-2 text-[15px] text-[#1A1A18]">
        Contact host:{" "}
        <a
          href={`https://www.instagram.com/${encodeURIComponent(uname)}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#1B3FF0] underline underline-offset-2"
        >
          {h}
        </a>
      </p>
    );
  }
  return (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <p className="min-w-0 break-words text-[15px] text-[#1A1A18]">
        {value}
      </p>
      <button
        type="button"
        onClick={() => {
          void (async () => {
            try {
              await navigator.clipboard.writeText(value);
              onCopied();
            } catch {
              /* ignore */
            }
          })();
        }}
        className="shrink-0 self-start rounded-lg border border-[#E8E8E4] bg-white px-3 py-1.5 text-sm font-semibold text-[#1A1A18] sm:self-center"
      >
        {justCopied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

type Props = {
  bundle: PublicSessionBundle;
  currentUserId: string | null;
  initialJoined: boolean;
  sessionId: string;
  /** When true, the main app bottom nav is shown — offset the mobile CTA above it. */
  inAppShell?: boolean;
  /** Current user&apos;s profile avatar (for the synthetic &quot;You&quot; tile). */
  viewerAvatarId?: string | null;
};

export function SessionSharePage({
  bundle,
  currentUserId,
  initialJoined,
  sessionId,
  inAppShell = false,
  viewerAvatarId = null,
}: Props) {
  const router = useRouter();
  const [session, setSession] = useState(bundle.session);
  const [isJoined, setIsJoined] = useState(initialJoined);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinJustSucceeded, setJoinJustSucceeded] = useState(false);
  const [joinConfirmation, setJoinConfirmation] =
    useState<JoinConfirmationSession | null>(null);
  const [topShareCopied, setTopShareCopied] = useState(false);
  const [contactCopied, setContactCopied] = useState(false);
  const [copied, setCopied] = useState(false);
  const [blastMessage, setBlastMessage] = useState("");
  const [blastSent, setBlastSent] = useState(false);
  const [sessionUrl, setSessionUrl] = useState("");
  const [hostDeleteConfirm, setHostDeleteConfirm] = useState(false);
  const [hostDeleting, setHostDeleting] = useState(false);
  const { openPostModalForEdit } = usePostSession();

  const creatorName = useMemo(
    () =>
      bundle.creator.full_name?.trim() ||
      bundle.creator.username?.trim() ||
      "Host",
    [bundle.creator]
  );

  const spotsLeft = session.max_spots - session.spots_filled;
  const unlimited = isUnlimitedMaxSpots(session.max_spots);
  const isFull = unlimited
    ? session.status === "cancelled" || session.status === "completed"
    : session.status !== "open" || spotsLeft <= 0;
  const isCreator = currentUserId !== null && currentUserId === session.creator_id;
  const showBeginner =
    session.activity === "surfing" && session.beginner_friendly === true;

  const joinersBase = useMemo(
    () => bundle.attendees.filter((a) => !a.is_creator),
    [bundle.attendees]
  );

  const joiners = useMemo(() => {
    if (
      !currentUserId ||
      !isJoined ||
      joinersBase.some((j) => j.user_id === currentUserId)
    ) {
      return joinersBase;
    }
    return [
      ...joinersBase,
      {
        user_id: currentUserId,
        full_name: "You",
        username: null,
        avatar_url: null,
        avatar_id: viewerAvatarId,
        is_creator: false,
      } satisfies SessionAttendeeRow,
    ];
  }, [joinersBase, currentUserId, isJoined, viewerAvatarId]);

  const joinersShown = joiners.slice(0, 8);
  const joinersMore = Math.max(0, joiners.length - 8);
  const participants = joiners;

  useEffect(() => {
    setSessionUrl(
      typeof window !== "undefined" ? window.location.href : ""
    );
  }, []);

  const formattedDate = useMemo(
    () => formatShareSessionDateLine(session.starts_at),
    [session.starts_at]
  );

  const buildInviteMessage = useCallback(() => {
    const url =
      typeof window !== "undefined" ? window.location.href : sessionUrl;
    return `Hey! Join my ${session.activity} session on Locals 🏃
${session.title}
📅 ${formattedDate}
📍 ${session.location_name?.trim() || "TBD"}${session.address ? `\n${session.address}` : ""}
Join here: ${url}`;
  }, [session, formattedDate, sessionUrl]);

  const handleWhatsAppShare = useCallback(() => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(buildInviteMessage())}`,
      "_blank"
    );
  }, [buildInviteMessage]);

  const handleCopyInvite = useCallback(async () => {
    await navigator.clipboard.writeText(buildInviteMessage());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [buildInviteMessage]);

  const handleBlast = useCallback(() => {
    const url =
      typeof window !== "undefined" ? window.location.href : sessionUrl;
    const fullMessage = `Message from ${creatorName} 
about "${session.title}":

${blastMessage}

Session link: ${url}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(fullMessage)}`,
      "_blank"
    );
    setBlastSent(true);
    window.setTimeout(() => setBlastSent(false), 3000);
  }, [creatorName, session.title, blastMessage, sessionUrl]);

  const calendarUrl = useMemo(
    () =>
      buildGoogleCalendarUrl({
        title: session.title,
        activity: session.activity,
        starts_at: session.starts_at,
        duration_minutes: session.duration_minutes,
        location_name: session.location_name ?? "",
        address: session.address ?? undefined,
        pace_level: session.pace_level,
      }),
    [session]
  );

  const copyPageUrl = useCallback(async () => {
    const url =
      typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleTopShare = useCallback(async () => {
    const ok = await copyPageUrl();
    if (ok) {
      setTopShareCopied(true);
      window.setTimeout(() => setTopShareCopied(false), 2000);
    }
  }, [copyPageUrl]);

  const handleJoin = useCallback(async () => {
    if (!currentUserId || joining || isJoined || isFull || isCreator) return;
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
    setSession(nextSession);
    setIsJoined(true);
    setJoinJustSucceeded(true);
    router.refresh();
  }, [currentUserId, joining, isJoined, isFull, isCreator, session, router]);

  const openCalendarFromSuccess = useCallback(() => {
    setJoinConfirmation(toJoinConfirmation(session, creatorName));
  }, [session, creatorName]);

  const handleOpenEdit = useCallback(() => {
    setHostDeleteConfirm(false);
    openPostModalForEdit(session);
  }, [openPostModalForEdit, session]);

  const handleHostDelete = useCallback(async () => {
    if (hostDeleting) return;
    setHostDeleting(true);
    setJoinError(null);
    try {
      const supabase = createClient();
      const { error: delError } = await supabase
        .from("sessions")
        .delete()
        .eq("id", session.id);
      if (delError) {
        setJoinError(delError.message);
        return;
      }
      router.push("/feed");
    } finally {
      setHostDeleting(false);
    }
  }, [hostDeleting, session.id, router]);

  const waLink = session.whatsapp_link?.trim();

  const hostActionBtnBase =
    "rounded-lg border border-[#DDDDD8] bg-white px-4 py-2 text-[13px] font-medium";

  const ctaBlock = (
    <div className="flex w-full flex-col gap-3">
      {!currentUserId ? (
        <Link
          href={`/signup?redirect=${encodeURIComponent(`/s/${sessionId}`)}`}
          className="flex w-full items-center justify-center rounded-xl bg-accent py-3.5 text-center text-base font-bold text-white transition hover:opacity-90"
        >
          Sign up to join
        </Link>
      ) : isCreator ? (
        <div className="space-y-3">
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-border bg-background py-3.5 text-center text-base font-bold text-muted"
          >
            You&apos;re hosting
          </button>
          {!hostDeleteConfirm ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleOpenEdit}
                className={`flex-1 ${hostActionBtnBase} text-[#1A1A18]`}
              >
                Edit session
              </button>
              <button
                type="button"
                onClick={() => setHostDeleteConfirm(true)}
                className={`flex-1 ${hostActionBtnBase} text-[#DC2626]`}
              >
                Delete session
              </button>
            </div>
          ) : (
            <div className="space-y-2 rounded-lg border border-[#E8E8E4] bg-white p-3">
              <p className="text-center text-sm text-[#1A1A18]">Are you sure?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleHostDelete()}
                  disabled={hostDeleting}
                  className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 disabled:opacity-50"
                >
                  {hostDeleting ? "…" : "Yes, delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setHostDeleteConfirm(false)}
                  disabled={hostDeleting}
                  className="flex-1 rounded-lg border border-[#E8E8E4] bg-white px-3 py-2 text-sm font-medium text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex w-full items-center justify-center gap-2 text-base font-bold text-accent transition hover:underline"
          >
            Share this session →
          </button>
        </div>
      ) : isJoined && joinJustSucceeded ? (
        <button
          type="button"
          onClick={openCalendarFromSuccess}
          className="w-full rounded-xl border border-accent/30 bg-surface py-3.5 text-center text-base font-bold text-accent transition hover:bg-hosting/50"
        >
          You&apos;re in! Add to Google Calendar →
        </button>
      ) : isJoined ? (
        <div className="space-y-3">
          <button
            type="button"
            disabled
            className="w-full cursor-default rounded-xl bg-hosting py-3.5 text-center text-base font-bold text-accent"
          >
            You&apos;re in ✓
          </button>
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full justify-center text-base font-bold text-accent underline-offset-2 hover:underline"
          >
            Add to Google Calendar →
          </a>
        </div>
      ) : (
        <button
          type="button"
          disabled={joining || isFull}
          onClick={() => void handleJoin()}
          className="w-full rounded-xl bg-accent py-3.5 text-center text-base font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {isFull
            ? "Session full"
            : joining
              ? "Joining…"
              : "Join session"}
        </button>
      )}
    </div>
  );

  const desktopSidebarBottomCta =
    !currentUserId ? (
      <div className="flex w-full flex-col gap-3">
        <Link
          href={`/signup?redirect=${encodeURIComponent(`/s/${sessionId}`)}`}
          className="flex w-full items-center justify-center rounded-xl bg-accent py-3.5 text-center text-base font-bold text-white transition hover:opacity-90"
        >
          Sign up to join
        </Link>
      </div>
    ) : isCreator ? null : (
      <div className="flex w-full flex-col gap-3">
        {isJoined && joinJustSucceeded ? (
          <button
            type="button"
            onClick={openCalendarFromSuccess}
            className="w-full rounded-xl border border-accent/30 bg-surface py-3.5 text-center text-base font-bold text-accent transition hover:bg-hosting/50"
          >
            You&apos;re in! Add to Google Calendar →
          </button>
        ) : isJoined ? (
          <div className="space-y-3">
            <button
              type="button"
              disabled
              className="w-full cursor-default rounded-xl bg-hosting py-3.5 text-center text-base font-bold text-accent"
            >
              You&apos;re in ✓
            </button>
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full justify-center text-base font-bold text-accent underline-offset-2 hover:underline"
            >
              Add to Google Calendar →
            </a>
          </div>
        ) : (
          <button
            type="button"
            disabled={joining || isFull}
            onClick={() => void handleJoin()}
            className="w-full rounded-xl bg-accent py-3.5 text-center text-base font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isFull
              ? "Session full"
              : joining
                ? "Joining…"
                : "Join session"}
          </button>
        )}
      </div>
    );

  const sectionLabelDesktop =
    "mb-2 text-[11px] font-bold uppercase leading-none tracking-[2px] text-[#888880]";

  function SidebarSections({ desktopMode }: { desktopMode: boolean }) {
    return (
      <>
        {desktopMode && isCreator ? (
          <div className="flex w-full flex-col gap-2">
            <button
              type="button"
              disabled
              className="h-11 w-full cursor-not-allowed rounded-lg border-0 bg-[#E8EEFF] text-center font-['Nunito',system-ui,sans-serif] text-sm font-bold text-[#1B3FF0]"
            >
              You&apos;re hosting
            </button>
            {!hostDeleteConfirm ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className={`flex-1 ${hostActionBtnBase} text-[#1A1A18]`}
                >
                  Edit session
                </button>
                <button
                  type="button"
                  onClick={() => setHostDeleteConfirm(true)}
                  className={`flex-1 ${hostActionBtnBase} text-[#DC2626]`}
                >
                  Delete session
                </button>
              </div>
            ) : (
              <div className="space-y-2 rounded-lg border border-[#E8E8E4] bg-white p-3">
                <p className="text-center text-sm text-[#1A1A18]">Are you sure?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleHostDelete()}
                    disabled={hostDeleting}
                    className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 disabled:opacity-50"
                  >
                    {hostDeleting ? "…" : "Yes, delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHostDeleteConfirm(false)}
                    disabled={hostDeleting}
                    className="flex-1 rounded-lg border border-[#E8E8E4] bg-white px-3 py-2 text-sm font-medium text-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full text-center font-['Nunito',system-ui,sans-serif] text-sm font-bold text-[#1B3FF0]"
            >
              Share this session →
            </button>
          </div>
        ) : null}

        <section>
          <p
            className={
              desktopMode
                ? sectionLabelDesktop
                : "text-[12px] font-semibold uppercase tracking-[1px] text-muted"
            }
          >
            Hosted by
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Avatar
              avatarId={bundle.creator.avatar_id}
              name={creatorName}
              size="md"
              className="shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate font-sans text-base font-bold text-foreground">
                {creatorName}
              </p>
              <p className="text-sm text-muted">
                {unlimited
                  ? "Open to all"
                  : `${Math.max(0, session.max_spots - session.spots_filled)} spots left`}
              </p>
            </div>
          </div>
        </section>

        <section>
          <p
            className={
              desktopMode
                ? sectionLabelDesktop
                : "text-[12px] font-semibold uppercase tracking-[1px] text-muted"
            }
          >
            Who&apos;s coming
          </p>
          {joiners.length === 0 ? (
            <p className="mt-3 text-sm italic text-muted">
              Be the first to join
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {joinersShown.map((a) => (
                <div
                  key={a.user_id}
                  title={displayName(a)}
                  className="flex h-10 w-10 items-center justify-center"
                >
                  <Avatar
                    avatarId={a.avatar_id}
                    name={displayName(a)}
                    size="sm"
                  />
                </div>
              ))}
              {joinersMore > 0 ? (
                <span className="text-sm font-semibold text-muted">
                  +{joinersMore} more
                </span>
              ) : null}
            </div>
          )}
        </section>

        <div className={desktopMode ? "" : "mt-6"}>
          <p className="mb-1 text-[11px] font-bold uppercase leading-none tracking-[2px] text-[#888880]">
            INVITE FRIENDS
          </p>
          <p className="mb-3 text-[13px] text-[#888880]">
            Share this session with your crew
          </p>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="mb-2 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-[#25D366] font-['Nunito',system-ui,sans-serif] text-sm font-bold text-white"
          >
            Share to WhatsApp
          </button>

          <button
            type="button"
            onClick={() => void handleCopyInvite()}
            className={`flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#DDDDD8] bg-white font-['Nunito',system-ui,sans-serif] text-sm font-bold ${
              copied ? "text-[#16A34A]" : "text-[#1A1A18]"
            }`}
          >
            {copied ? "Copied! ✓" : "Copy invite link"}
          </button>
        </div>

        {isCreator ? (
          <div className="border-t border-[#E8E8E4] pt-6">
            <div className="mb-3 flex min-w-0 items-center gap-2">
              <p className="shrink-0 font-['Nunito',system-ui,sans-serif] text-sm font-bold leading-tight text-[#1A1A18]">
                Message attendees
              </p>
              <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#E8EEFF] px-2 py-0.5 align-middle text-[11px] font-bold text-[#1B3FF0]">
                {participants.length} going
              </span>
            </div>

            <textarea
              value={blastMessage}
              onChange={(e) => setBlastMessage(e.target.value)}
              placeholder="Send a message to everyone joining... e.g. 'See you tomorrow! Meet at the main entrance 🙌'"
              maxLength={300}
              rows={3}
              className="w-full rounded-lg border border-[#DDDDD8] p-3 font-['Nunito',system-ui,sans-serif] text-[13px] text-[#1A1A18] outline-none"
            />
            <p className="mt-1 text-right text-[11px] text-[#888880]">
              {blastMessage.length}/300
            </p>

            <button
              type="button"
              onClick={handleBlast}
              disabled={!blastMessage.trim() || participants.length === 0}
              className={`mt-2 flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border-0 bg-[#1B3FF0] font-['Nunito',system-ui,sans-serif] text-sm font-bold text-white disabled:cursor-not-allowed ${
                !blastMessage.trim() || participants.length === 0
                  ? "opacity-50"
                  : ""
              }`}
            >
              {blastSent
                ? "✓ Message ready in WhatsApp"
                : "Send to all attendees"}
            </button>
          </div>
        ) : null}

        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-bold text-white transition hover:opacity-95 font-['Nunito',system-ui,sans-serif]"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white font-sans text-sm font-extrabold text-[#25D366]"
              aria-hidden
            >
              W
            </span>
            Join the group chat
          </a>
        ) : null}

        {desktopMode ? desktopSidebarBottomCta : null}
      </>
    );
  }

  const heroCard = (
    <div className="overflow-hidden rounded-[20px] border border-card-border bg-surface shadow-sm">
      <div className="lg:hidden">
        <SessionCover activity={session.activity} height={200} />
      </div>
      <div className="hidden lg:block">
        <SessionCover activity={session.activity} height={240} />
      </div>

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${activityBadge[session.activity]}`}
          >
            {session.activity}
          </span>
          {session.privacy === "link_only" ? (
            <span className="inline-flex rounded-md bg-[#FFF4E8] px-2 py-0.5 text-[11px] font-semibold text-[#D97706]">
              🔗 Link only
            </span>
          ) : null}
        </div>

        <h1 className="mt-2 font-sans text-[28px] font-extrabold leading-tight text-foreground">
          {session.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-accent">
          <IconCalendar className="shrink-0 text-accent" />
          <span className="text-base font-bold">
            {formatShareSessionDateLine(session.starts_at)}
          </span>
        </div>
        {session.duration_minutes > 0 ? (
          <p className="mt-1 text-base text-muted">
            {session.duration_minutes} minutes
          </p>
        ) : null}

        <div className="my-5 h-px w-full bg-[#E8E8E4]" aria-hidden />

        <div className="flex gap-2">
          <IconPin className="mt-0.5 shrink-0 text-foreground" />
          <div className="min-w-0">
            {session.location_name ? (
              <p className="font-sans text-base font-bold text-foreground">
                {session.location_name}
              </p>
            ) : (
              <p className="text-base font-semibold text-muted">
                Location TBD
              </p>
            )}
            {session.address ? (
              <p className="mt-1 text-[13px] text-muted">{session.address}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          {showBeginner ? (
            <span className={beginnerBadge}>Beginner friendly</span>
          ) : session.activity === "running" || session.activity === "cycling" ? (
            <span className={paceBadge}>{session.pace_level}</span>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen bg-[#F4F4F0] text-foreground lg:pb-12 ${
        inAppShell ? "pb-40" : "pb-32"
      }`}
    >
      <div className="mx-auto flex w-full min-h-screen max-w-[1000px] flex-col lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6 bg-[#F4F4F0] p-4 pt-4 sm:px-6 sm:pb-6 lg:p-8">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handleTopShare()}
              className="inline-flex items-center gap-1.5 rounded-button border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground shadow-sm transition hover:bg-background"
            >
              <IconLink className="text-muted" />
              {topShareCopied ? "Copied!" : "Share"}
            </button>
          </div>
          {heroCard}

          {session.description?.trim() ? (
            <section>
              <p className="text-[12px] font-semibold uppercase tracking-[1px] text-[#888880]">
                About
              </p>
              <p
                className="mt-2 text-[15px] text-[#1A1A18]"
                style={{ lineHeight: 1.6 }}
              >
                {session.description.trim()}
              </p>
            </section>
          ) : null}

          {session.instructions?.trim() ? (
            <section>
              <div className="flex items-center gap-1.5">
                <IconPin
                  className="h-3.5 w-3.5 shrink-0 text-[#888880]"
                  aria-hidden
                />
                <p className="text-[12px] font-semibold uppercase tracking-[1px] text-[#888880]">
                  How to find us
                </p>
              </div>
              <p className="mt-2 text-[15px] text-[#1A1A18]">
                {session.instructions.trim()}
              </p>
            </section>
          ) : null}

          {session.contact_info?.trim() ? (
            <section>
              <p className="text-[12px] font-semibold uppercase tracking-[1px] text-[#888880]">
                GET IN TOUCH
              </p>
              <GetInTouchBlock
                value={session.contact_info.trim()}
                onCopied={() => {
                  setContactCopied(true);
                  window.setTimeout(() => setContactCopied(false), 2000);
                }}
                justCopied={contactCopied}
              />
            </section>
          ) : null}

          <div className="space-y-8 lg:hidden">
            <SidebarSections desktopMode={false} />
          </div>
        </div>

        <div className="hidden min-h-screen w-80 min-w-80 shrink-0 flex-col gap-6 border-l border-[#E8E8E4] bg-white p-8 lg:flex">
          <SidebarSections desktopMode={true} />
        </div>
      </div>

      <div className="mx-auto mt-12 w-full max-w-[1000px] px-4 pb-4 text-center sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-sans text-sm font-extrabold tracking-wide text-accent"
        >
          LOCALS
        </Link>
        <p className="mt-1 text-[13px] text-muted">
          Find your people. Show up.
        </p>
      </div>

      {joinError ? (
        <p
          className="mx-auto max-w-[1000px] px-4 text-center text-sm text-red-600 sm:px-6 lg:px-8"
          role="alert"
        >
          {joinError}
        </p>
      ) : null}

      <div
        className={`fixed left-0 right-0 z-40 border-t border-[#E8E8E4] bg-surface px-6 py-4 lg:hidden ${
          inAppShell ? "bottom-16" : "bottom-0"
        }`}
      >
        <div className="mx-auto w-full max-w-[480px]">{ctaBlock}</div>
      </div>

      <JoinConfirmationModal
        open={joinConfirmation !== null}
        onClose={() => {
          setJoinConfirmation(null);
          setJoinJustSucceeded(false);
        }}
        session={joinConfirmation}
      />
    </div>
  );
}
