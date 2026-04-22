"use client";

import { useEffect } from "react";
import { buildGoogleCalendarUrl } from "@/lib/calendar";
import { formatSessionStartsAt } from "@/lib/format-session";
import { Button } from "@/components/ui/button";
import type { Activity } from "@/types";

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

export type JoinConfirmationSession = {
  title: string;
  activity: Activity;
  starts_at: string;
  duration_minutes: number;
  location_name: string | null;
  address?: string | null;
  pace_level?: string;
  creator_full_name?: string | null;
  creator_username?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  session: JoinConfirmationSession | null;
};

function creatorLabel(s: JoinConfirmationSession) {
  return (
    s.creator_full_name?.trim() ||
    s.creator_username?.trim() ||
    "the host"
  );
}

export function JoinConfirmationModal({ open, onClose, session }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !session) return null;

  const calendarSession = {
    title: session.title,
    activity: session.activity,
    starts_at: session.starts_at,
    duration_minutes: session.duration_minutes,
    location_name: session.location_name ?? "",
    address: session.address ?? undefined,
    pace_level: session.pace_level,
  };
  const calendarUrl = buildGoogleCalendarUrl(calendarSession);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/20 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-confirm-title"
        className="w-full max-w-md rounded-card border border-card-border bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <svg
            className="mb-4 h-14 w-14 shrink-0 text-accent"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <circle
              cx="24"
              cy="24"
              r="22"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M14 24l7 7 13-14"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <h2
            id="join-confirm-title"
            className="font-sans text-3xl font-extrabold tracking-wide text-foreground"
          >
            You&apos;re in!
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Don&apos;t forget to show up — {creatorLabel(session)} is counting
            on you.
          </p>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-background/60 p-4 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${activityBadge[session.activity]}`}
            >
              {session.activity}
            </span>
          </div>
          <p className="mt-2 font-sans text-xl font-extrabold tracking-wide text-foreground">
            {session.title}
          </p>
          <p className="mt-1 text-sm font-semibold text-accent">
            {formatSessionStartsAt(session.starts_at)}
          </p>
          {session.location_name ? (
            <p className="mt-1 text-sm text-muted">
              {session.location_name}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              window.open(calendarUrl, "_blank", "noopener,noreferrer");
            }}
          >
            Add to Google Calendar
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="text-center text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
