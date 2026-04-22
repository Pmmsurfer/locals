"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Session, SessionParticipant } from "@/types";
import { SessionListCard } from "./SessionListCard";

export type AttendedSession = Session & { participant: SessionParticipant };

type Props = {
  hosting: Session[];
  attended: AttendedSession[];
};

function partitionHost(sessions: Session[]) {
  const now = new Date();
  const upcoming: Session[] = [];
  const past: Session[] = [];
  for (const s of sessions) {
    if (new Date(s.starts_at) >= now) upcoming.push(s);
    else past.push(s);
  }
  upcoming.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
  past.sort(
    (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
  );
  return [...upcoming, ...past];
}

function partitionAttended(sessions: AttendedSession[]) {
  const now = new Date();
  const upcoming: AttendedSession[] = [];
  const past: AttendedSession[] = [];
  for (const s of sessions) {
    if (new Date(s.starts_at) >= now) upcoming.push(s);
    else past.push(s);
  }
  upcoming.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
  past.sort(
    (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
  );
  return [...upcoming, ...past];
}

export function ProfileSessionsPage({ hosting, attended }: Props) {
  const [tab, setTab] = useState<"hosting" | "attended">("hosting");

  const hostingList = useMemo(() => partitionHost(hosting), [hosting]);
  const attendedList = useMemo(() => partitionAttended(attended), [attended]);

  const list = tab === "hosting" ? hostingList : attendedList;

  return (
    <div className="mx-auto max-w-lg px-4 pb-12 pt-6 lg:max-w-2xl">
      <h1 className="font-sans text-2xl font-extrabold text-foreground">
        My sessions
      </h1>
      <div
        className="mt-6 flex rounded-lg border border-border bg-surface p-1"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "hosting"}
          onClick={() => setTab("hosting")}
          className="flex-1 rounded-md py-2 text-sm font-bold transition"
          style={
            tab === "hosting"
              ? { background: "#E8EEFF", color: "#1B3FF0" }
              : { color: "#888880" }
          }
        >
          Hosting
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "attended"}
          onClick={() => setTab("attended")}
          className="flex-1 rounded-md py-2 text-sm font-bold transition"
          style={
            tab === "attended"
              ? { background: "#E8EEFF", color: "#1B3FF0" }
              : { color: "#888880" }
          }
        >
          Attended
        </button>
      </div>

      {tab === "hosting" && hostingList.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">
          You haven&apos;t hosted any sessions yet.{" "}
          <Link
            href="/feed"
            className="font-bold text-accent underline-offset-2 hover:underline"
          >
            Post your first one →
          </Link>
        </p>
      ) : null}

      {tab === "attended" && attendedList.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">
          You haven&apos;t joined any sessions yet.{" "}
          <Link
            href="/feed"
            className="font-bold text-accent underline-offset-2 hover:underline"
          >
            Browse the feed →
          </Link>
        </p>
      ) : null}

      {list.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-3">
          {list.map((s) => {
            const now = new Date();
            const past = new Date(s.starts_at) < now;
            if (tab === "hosting") {
              return (
                <SessionListCard
                  key={s.id}
                  session={s}
                  kind="hosting"
                  isPast={past}
                />
              );
            }
            const a = s as AttendedSession;
            return (
              <SessionListCard
                key={a.id}
                session={a}
                kind="attended"
                isPast={past}
                showedUp={past ? a.participant.showed_up_at != null : undefined}
              />
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
