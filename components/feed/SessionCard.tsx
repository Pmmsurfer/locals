"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePostSession } from "@/contexts/PostSessionContext";
import { isUnlimitedMaxSpots } from "@/lib/session-capacity";
import { formatSessionStartsAt } from "@/lib/format-session";
import type { FeedSession, Session, SessionActivity } from "@/types";
import { SessionCover } from "@/components/sessions/SessionCover";
import { Avatar } from "@/components/ui/Avatar";

type Props = {
  session: FeedSession;
  userId: string;
  isJoined: boolean;
  joining: boolean;
  joinBusy: boolean;
  onJoin: (session: FeedSession) => Promise<void>;
  onSessionChanged?: () => void;
};

export function SessionCard({
  session,
  userId,
  isJoined,
  joining,
  joinBusy,
  onJoin,
  onSessionChanged,
}: Props) {
  const router = useRouter();
  const { openPostModalForEdit } = usePostSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const coverMenuRef = useRef<HTMLDivElement>(null);
  const isHost = session.creator_id === userId;
  const unlimited = isUnlimitedMaxSpots(session.max_spots);
  const isAtCapacity = unlimited
    ? false
    : session.status === "full" || session.spots_filled >= session.max_spots;
  const isFull = unlimited
    ? session.status === "cancelled" || session.status === "completed"
    : session.status !== "open" || isAtCapacity;
  const creatorName =
    session.creator_full_name?.trim() ||
    session.creator_username?.trim() ||
    "Host";
  const act = session.activity as SessionActivity;
  const joinDisabled = isFull || isJoined || joining || joinBusy;

  const descPreview = (() => {
    const t = session.description?.trim();
    if (!t) return null;
    return t.length > 80 ? `${t.slice(0, 80)}…` : t;
  })();

  const spotsLabel = unlimited
    ? "Open to all"
    : session.max_spots - session.spots_filled > 0
      ? `${session.max_spots - session.spots_filled} spot${
          session.max_spots - session.spots_filled === 1 ? "" : "s"
        } left`
      : "Full";

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirm) {
      return;
    }
    setMenuOpen((o) => !o);
    setDeleteError(null);
  };

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (
        coverMenuRef.current &&
        !coverMenuRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
        if (!deleting) {
          setDeleteConfirm(false);
        }
      }
    };
    if (!menuOpen && !deleteConfirm) {
      return;
    }
    document.addEventListener("click", close, true);
    return () => document.removeEventListener("click", close, true);
  }, [menuOpen, deleteConfirm, deleting]);

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setMenuOpen(false);
      setDeleteError(null);
      openPostModalForEdit(session as Session);
    },
    [openPostModalForEdit, session]
  );

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setDeleteConfirm(true);
  }, []);

  const runDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const supabase = createClient();
      const { error: delError } = await supabase
        .from("sessions")
        .delete()
        .eq("id", session.id);
      if (delError) {
        setDeleteError(delError.message);
        return;
      }
      setMenuOpen(false);
      setDeleteConfirm(false);
      onSessionChanged?.();
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article
      className="relative box-border w-full min-w-0 max-w-full overflow-hidden rounded-[12px] border border-[#E8E8E4] bg-white transition-[border-color] duration-150 ease-out hover:border-[#1B3FF0] lg:mr-8"
    >
      <div
        className="relative w-full"
        style={{ width: "100%", height: 120 }}
        ref={coverMenuRef}
      >
        <SessionCover activity={act} height={120} borderRadius="0" />
        <span
          className="absolute capitalize text-white [backdrop-filter:blur(8px)]"
          style={{
            position: "absolute",
            bottom: 10,
            left: 12,
            background: "rgba(255,255,255,0.25)",
            color: "white",
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 20,
          }}
        >
          {session.activity}
        </span>
        {isHost ? (
          <>
            <button
              type="button"
              onClick={handleMenuClick}
              className="flex cursor-pointer items-center justify-center border-0 text-white [backdrop-filter:blur(8px)]"
              style={{
                position: "absolute",
                top: 10,
                right: 12,
                background: "rgba(0,0,0,0.3)",
                border: "none",
                color: "white",
                borderRadius: 20,
                width: 32,
                height: 32,
                fontSize: 14,
                letterSpacing: 1,
              }}
              aria-expanded={deleteConfirm ? false : menuOpen}
              aria-haspopup="true"
              aria-label="Session actions"
            >
              •••
            </button>
            {menuOpen && !deleteConfirm ? (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: 46,
                  right: 12,
                  background: "white",
                  border: "1px solid #E8E8E4",
                  borderRadius: 10,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  minWidth: 140,
                  zIndex: 50,
                }}
                role="menu"
              >
                <button
                  type="button"
                  onClick={handleEdit}
                  className="w-full border-0 bg-transparent text-left"
                  style={{
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1A1A18",
                    cursor: "pointer",
                    fontFamily: "Nunito, system-ui, sans-serif",
                  }}
                >
                  Edit session
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full border-0 bg-transparent text-left"
                  style={{
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#DC2626",
                    cursor: "pointer",
                    fontFamily: "Nunito, system-ui, sans-serif",
                  }}
                >
                  Delete session
                </button>
              </div>
            ) : null}
            {deleteConfirm ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="rounded-[10px] border border-[#E8E8E4] bg-white p-3 [box-shadow:0_4px_16px_rgba(0,0,0,0.08)]"
                style={{
                  position: "absolute",
                  top: 46,
                  right: 12,
                  zIndex: 50,
                  minWidth: 200,
                }}
              >
                <p
                  className="text-center text-sm"
                  style={{ color: "#1A1A18" }}
                >
                  Delete this session?
                </p>
                {deleteError ? (
                  <p
                    className="mt-1 text-center text-xs text-red-600"
                    role="alert"
                  >
                    {deleteError}
                  </p>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void runDelete();
                    }}
                    disabled={deleting}
                    className="min-h-9 flex-1 cursor-pointer rounded-lg border-0 font-semibold text-white disabled:opacity-50"
                    style={{ background: "#DC2626", fontFamily: "Nunito, system-ui, sans-serif" }}
                  >
                    {deleting ? "…" : "Yes, delete"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(false);
                      setDeleteError(null);
                    }}
                    disabled={deleting}
                    className="min-h-9 flex-1 cursor-pointer rounded-lg border font-semibold disabled:opacity-50"
                    style={{
                      background: "white",
                      borderColor: "#DDDDD8",
                      color: "#1A1A18",
                      fontFamily: "Nunito, system-ui, sans-serif",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="bg-white" style={{ padding: "1rem 1.25rem" }}>
        <Link
          href={`/s/${session.id}`}
          className="no-underline"
          onClick={(e) => e.stopPropagation()}
        >
          <h3
            className="font-sans text-[18px] font-bold leading-snug"
            style={{ color: "#1A1A18" }}
          >
            {session.title}
          </h3>
          {session.location_name ? (
            <p className="mt-1 text-[13px]" style={{ color: "#888880" }}>
              {session.location_name}
            </p>
          ) : null}
          <p
            className="mt-2 text-[13px] font-bold"
            style={{ color: "#1B3FF0" }}
          >
            {formatSessionStartsAt(session.starts_at)}
          </p>
          {descPreview ? (
            <p
              className="mt-1 text-[13px] italic"
              style={{ color: "#888880" }}
            >
              {descPreview}
            </p>
          ) : null}
        </Link>

        <div
          className="mt-3 flex items-center justify-between"
          style={{ marginTop: 12 }}
        >
          <Link
            href={`/s/${session.id}`}
            className="flex min-w-0 flex-1 items-center gap-2 no-underline"
            style={{ gap: 8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar
              avatarId={session.creator_avatar_id}
              name={creatorName}
              size="sm"
              className="shrink-0"
            />
            <div className="min-w-0">
              <p
                className="truncate"
                style={{ fontSize: 13, fontWeight: 600, color: "#1A1A18" }}
              >
                {creatorName}
              </p>
              <p className="text-xs" style={{ color: "#888880", fontSize: 12 }}>
                {spotsLabel}
              </p>
            </div>
          </Link>

          {isHost ? (
            <span
              className="shrink-0"
              style={{
                background: "#E8EEFF",
                color: "#1B3FF0",
                borderRadius: 20,
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "Nunito, system-ui, sans-serif",
              }}
            >
              Hosting
            </span>
          ) : isJoined ? (
            <span
              className="shrink-0"
              style={{
                background: "#E8EEFF",
                color: "#1B3FF0",
                borderRadius: 20,
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "Nunito, system-ui, sans-serif",
              }}
            >
              Joined
            </span>
          ) : isFull ? (
            <span
              className="shrink-0"
              style={{
                background: "#F4F4F0",
                color: "#888880",
                borderRadius: 20,
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "Nunito, system-ui, sans-serif",
              }}
            >
              Full
            </span>
          ) : (
            <button
              type="button"
              disabled={joinDisabled}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                void onJoin(session);
              }}
              className="shrink-0 border-0 font-bold disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: "#1B3FF0",
                color: "white",
                border: "none",
                borderRadius: 20,
                padding: "6px 18px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "Nunito, system-ui, sans-serif",
              }}
            >
              {joining ? "Joining…" : "Join"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
