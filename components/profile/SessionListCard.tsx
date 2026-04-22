import Link from "next/link";
import { formatSessionStartsAt } from "@/lib/format-session";
import { isUnlimitedMaxSpots } from "@/lib/session-capacity";
import type { Activity, Session, SessionStatus } from "@/types";
import { SessionCover } from "@/components/sessions/SessionCover";

const statusStyle: Record<SessionStatus, string> = {
  open: "bg-[#E8EEFF] text-[#1B3FF0]",
  full: "bg-[#F5F5F2] text-muted",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-[#F5F5F2] text-muted",
};

type Props = {
  session: Session;
  kind: "hosting" | "attended";
  showedUp?: boolean;
  isPast: boolean;
};

export function SessionListCard({ session, kind, showedUp, isPast }: Props) {
  const spotsOrOpen = isUnlimitedMaxSpots(session.max_spots)
    ? "Open to all"
    : `${session.spots_filled} / ${session.max_spots} filled`;

  return (
    <li>
      <Link
        href={`/sessions/${session.id}`}
        className={`flex gap-3 rounded-card border border-card-border bg-surface p-3 shadow-sm transition hover:opacity-95 ${
          isPast ? "opacity-80" : ""
        }`}
      >
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border">
          <SessionCover
            activity={session.activity as Activity}
            height={64}
            borderRadius="8px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-sans text-base font-extrabold text-foreground line-clamp-2">
            {session.title}
          </h3>
          <p className="text-sm font-medium text-accent">
            {formatSessionStartsAt(session.starts_at)}
          </p>
          <p className="text-xs text-muted">{spotsOrOpen}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold capitalize ${statusStyle[session.status]}`}
            >
              {session.status}
            </span>
            {kind === "attended" && isPast && showedUp !== undefined ? (
              <span className="text-[11px] text-muted">
                {showedUp ? "Attended" : "No show"}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  );
}
