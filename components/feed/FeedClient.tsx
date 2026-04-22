"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { usePostSession } from "@/contexts/PostSessionContext";
import {
  useFeedFilter,
  FEED_FILTER_ITEMS,
  type FeedActivityFilter,
} from "@/contexts/FeedFilterContext";
import { DEFAULT_FEED_LAT, DEFAULT_FEED_LNG } from "@/lib/feed-default-location";
import { isUnlimitedMaxSpots } from "@/lib/session-capacity";
import type { FeedSession, ProfileActivity, SessionActivity } from "@/types";
import {
  JoinConfirmationModal,
  type JoinConfirmationSession,
} from "./JoinConfirmationModal";
import { SessionCard } from "./SessionCard";

function filterSessionsByFilter(
  rows: FeedSession[],
  activeFilter: FeedActivityFilter
): FeedSession[] {
  if (activeFilter === null) {
    return rows;
  }
  return rows.filter((s) => s.activity === activeFilter);
}

function labelForFilter(value: string): string {
  const found = FEED_FILTER_ITEMS.find((x) => x.value === value);
  return found?.label ?? value;
}

type Props = {
  userId: string;
  /** Profile `activities` order; used to sort filter pills. */
  profileActivityOrder: ProfileActivity[] | null;
};

export function FeedClient({ userId, profileActivityOrder }: Props) {
  const { postedVersion, openPostModalForCreate } = usePostSession();
  const { activeFilter, setActiveFilter } = useFeedFilter();
  const [feedSessions, setFeedSessions] = useState<FeedSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinConfirmation, setJoinConfirmation] =
    useState<JoinConfirmationSession | null>(null);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("nearby_sessions", {
      user_lat: DEFAULT_FEED_LAT,
      user_lng: DEFAULT_FEED_LNG,
      radius_meters: 10000,
      filter_activity: null,
    });
    setSessionsLoading(false);
    if (error) {
      setSessionsError(error.message);
      setFeedSessions([]);
      return;
    }
    const rows = (data ?? []) as FeedSession[];
    // `nearby_sessions` should only return public sessions; filter defensively.
    setFeedSessions(rows.filter((s) => s.privacy !== "link_only"));
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (postedVersion < 1) return;
    void loadSessions();
  }, [postedVersion, loadSessions]);

  const visibleSessions = useMemo(
    () => filterSessionsByFilter(feedSessions, activeFilter),
    [feedSessions, activeFilter]
  );

  useEffect(() => {
    if (activeFilter === null) {
      return;
    }
    if (feedSessions.length === 0) {
      setActiveFilter(null);
      return;
    }
    const inResults = new Set(
      feedSessions.map((s) => s.activity as SessionActivity)
    );
    if (!inResults.has(activeFilter as SessionActivity)) {
      setActiveFilter(null);
    }
  }, [activeFilter, feedSessions, setActiveFilter]);

  useEffect(() => {
    if (!userId || visibleSessions.length === 0) return;
    const ids = visibleSessions.map((s) => s.id);
    let cancelled = false;
    const supabase = createClient();
    void (async () => {
      const { data } = await supabase
        .from("session_participants")
        .select("session_id")
        .eq("user_id", userId)
        .in("session_id", ids)
        .eq("status", "joined");
      if (cancelled || !data) return;
      setJoinedIds(new Set(data.map((r) => r.session_id as string)));
    })();
    return () => {
      cancelled = true;
    };
  }, [visibleSessions, userId]);

  const handleJoin = useCallback(
    async (session: FeedSession) => {
      if (!userId || joiningId) return;
      setJoiningId(session.id);
      const prevFeed = feedSessions;
      const prevJoined = joinedIds;

      setFeedSessions((list) =>
        list.map((s) => {
          if (s.id !== session.id) return s;
          const nextFilled = s.spots_filled + 1;
          const nextStatus =
            isUnlimitedMaxSpots(s.max_spots) || nextFilled < s.max_spots
              ? s.status
              : ("full" as const);
          return {
            ...s,
            spots_filled: nextFilled,
            status: nextStatus,
          };
        })
      );
      setJoinedIds((prev) => new Set(prev).add(session.id));

      const supabase = createClient();
      const { error } = await supabase.from("session_participants").insert({
        session_id: session.id,
        user_id: userId,
        status: "joined",
      });

      if (error) {
        setFeedSessions(prevFeed);
        setJoinedIds(prevJoined);
        setSessionsError(error.message);
      } else {
        setSessionsError(null);
        setJoinConfirmation({
          title: session.title,
          activity: session.activity,
          starts_at: session.starts_at,
          duration_minutes: session.duration_minutes,
          location_name: session.location_name,
          address: session.address,
          pace_level: session.pace_level,
          creator_full_name: session.creator_full_name,
          creator_username: session.creator_username,
        });
        await loadSessions();
      }
      setJoiningId(null);
    },
    [userId, joiningId, feedSessions, joinedIds, loadSessions]
  );

  const pillValues = useMemo(() => {
    if (feedSessions.length === 0) {
      return [] as string[];
    }
    const available = new Set(
      feedSessions.map((s) => s.activity as string)
    );
    const inProfileOrder = (profileActivityOrder ?? []).filter(
      (a) => available.has(a)
    ) as string[];
    const inProfile = new Set(inProfileOrder);
    const rest = Array.from(available).filter((a) => !inProfile.has(a));
    const restOrder = (a: string, b: string) => {
      const ai = FEED_FILTER_ITEMS.findIndex((x) => x.value === a);
      const bi = FEED_FILTER_ITEMS.findIndex((x) => x.value === b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    };
    rest.sort(restOrder);
    return [...inProfileOrder, ...rest];
  }, [feedSessions, profileActivityOrder]);

  const pillScrollRef = useRef<HTMLDivElement>(null);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateScrollFade = useCallback(() => {
    const el = pillScrollRef.current;
    if (!el) {
      setShowRightFade(false);
      return;
    }
    const { scrollWidth, clientWidth, scrollLeft } = el;
    const overflow = scrollWidth > clientWidth + 1;
    const atEnd = scrollLeft + clientWidth >= scrollWidth - 2;
    setShowRightFade(overflow && !atEnd);
  }, []);

  useLayoutEffect(() => {
    updateScrollFade();
  }, [updateScrollFade, pillValues, feedSessions.length]);

  useEffect(() => {
    const el = pillScrollRef.current;
    if (!el) {
      return;
    }
    const onScroll = () => {
      updateScrollFade();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => {
      updateScrollFade();
    });
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [updateScrollFade, pillValues.length]);

  const filterPills = useMemo(
    () => (
      <div className="relative mb-4 lg:hidden">
        <div
          ref={pillScrollRef}
          className="-mx-2 flex max-w-full flex-nowrap gap-2 overflow-x-auto overflow-y-visible px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className={`shrink-0 rounded-button border px-3 py-1.5 text-sm font-semibold transition ${
              activeFilter === null
                ? "border-transparent bg-accent text-white"
                : "border border-border bg-surface text-foreground hover:bg-background"
            }`}
          >
            All
          </button>
          {pillValues.map((value) => {
            const v = value as NonNullable<FeedActivityFilter>;
            const active = activeFilter === v;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setActiveFilter(v)}
                className={`shrink-0 rounded-button border px-3 py-1.5 text-sm font-semibold capitalize transition ${
                  active
                    ? "border-transparent bg-accent text-white"
                    : "border border-border bg-surface text-foreground hover:bg-background"
                }`}
              >
                {labelForFilter(value)}
              </button>
            );
          })}
        </div>
        {showRightFade ? (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#F4F4F0] to-transparent"
            aria-hidden
          />
        ) : null}
      </div>
    ),
    [activeFilter, setActiveFilter, pillValues, showRightFade]
  );

  const openPost = openPostModalForCreate;

  const areaEmpty = !sessionsLoading && feedSessions.length === 0;
  const filterNoMatches =
    !sessionsLoading &&
    feedSessions.length > 0 &&
    visibleSessions.length === 0;

  return (
    <div className="w-full min-w-0 max-w-none">
      {filterPills}

      <div className="relative w-full min-w-0 max-w-full">
        {sessionsLoading ? (
          <p className="py-12 text-center text-sm text-muted">
            Loading nearby sessions…
          </p>
        ) : null}

        {sessionsError ? (
          <p className="mb-4 text-center text-sm text-red-600" role="alert">
            {sessionsError}
          </p>
        ) : null}

        {areaEmpty ? (
          <div className="flex w-full min-w-0 max-w-none flex-col items-center rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center">
            <p className="text-sm text-muted">
              No sessions nearby. Be the first to post one.
            </p>
            <button
              type="button"
              onClick={openPost}
              className="mt-6 text-sm font-bold text-[#1B3FF0] underline-offset-2 hover:underline"
            >
              Post a session
            </button>
          </div>
        ) : null}

        {filterNoMatches && !areaEmpty && activeFilter ? (
          <p className="mb-4 text-center text-sm text-muted">
            No {labelForFilter(String(activeFilter))} sessions right now. Try
            another filter.
          </p>
        ) : null}

        {!sessionsLoading && visibleSessions.length > 0 ? (
          <ul className="flex min-w-0 w-full flex-col gap-3">
            {visibleSessions.map((session) => (
              <li key={session.id}>
                <SessionCard
                  session={session}
                  userId={userId}
                  isJoined={joinedIds.has(session.id)}
                  joining={joiningId === session.id}
                  joinBusy={joiningId !== null}
                  onJoin={handleJoin}
                  onSessionChanged={loadSessions}
                />
              </li>
            ))}
          </ul>
        ) : null}

        <JoinConfirmationModal
          open={joinConfirmation !== null}
          onClose={() => setJoinConfirmation(null)}
          session={joinConfirmation}
        />
      </div>
    </div>
  );
}
