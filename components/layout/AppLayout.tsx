"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { PostSessionModal } from "@/components/feed/PostSessionModal";
import { usePostSession } from "@/contexts/PostSessionContext";
import {
  FeedFilterProvider,
  FEED_FILTER_ITEMS,
  useFeedFilter,
  type FeedActivityFilter,
} from "@/contexts/FeedFilterContext";
import { Avatar } from "@/components/ui/Avatar";
import type { JoinConfirmationSession } from "@/components/feed/JoinConfirmationModal";
import { JoinConfirmationModal } from "@/components/feed/JoinConfirmationModal";
import type { Profile } from "@/types";

const accent = "#1B3FF0";
const border = "#E8E8E4";
const muted = "#888880";
const SIDEBAR_W = 260;

type NavIconProps = { active: boolean; size: 20 | 22 };

function IconHouse({ active, size }: NavIconProps) {
  const c = active ? accent : muted;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <path
        d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V14.5H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
        fill={c}
      />
    </svg>
  );
}

function IconCalendar({ active, size }: NavIconProps) {
  const c = active ? accent : muted;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <rect
        x="3"
        y="4.5"
        width="18"
        height="17.5"
        rx="2"
        stroke={c}
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M8 2.5V5.5M16 2.5V5.5M3.5 9.5H20.5"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPerson({ active, size }: NavIconProps) {
  const c = active ? accent : muted;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <circle cx="12" cy="8.5" r="3.5" fill={c} />
      <path
        d="M4.5 20.5C4.5 16.4 7.8 13 12 13C16.2 13 19.5 16.4 19.5 20.5V21H4.5V20.5Z"
        fill={c}
      />
    </svg>
  );
}

function IconPostCircle() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <circle cx="14" cy="14" r="14" fill={accent} />
      <path
        d="M14 8.5V19.5M8.5 14H19.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const navLinkClass = (active: boolean) =>
  [
    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-l-[3px] py-2 pl-4 pr-4 text-left font-sans text-[14px] font-semibold transition-colors",
    active
      ? "border-l-[#1B3FF0] bg-[#E8EEFF] text-[#1B3FF0]"
      : "border-l-transparent text-[#888880] hover:bg-[#F4F4F0]",
  ].join(" ");

const FILTER_DOT_COLOR: Record<string, string> = {
  All: "#9CA3AF",
  Running: "#16A34A",
  Cycling: "#D97706",
  Surfing: "#1B3FF0",
  Swimming: "#0099CC",
  Social: "#FF6B6B",
  Hiking: "#7C2D12",
  Yoga: "#7C3AED",
  Climbing: "#DC2626",
  Tennis: "#0D9488",
};

function filterItemClass(active: boolean) {
  return [
    "flex w-full cursor-pointer items-center gap-2 rounded-md py-[0.4rem] px-3 text-left font-sans text-[13px] font-medium transition-colors",
    active
      ? "bg-[#E8EEFF] text-[#1B3FF0]"
      : "text-[#888880] hover:bg-[#F4F4F0]",
  ].join(" ");
}

function SidebarActivityFilters() {
  const { activeFilter, setActiveFilter } = useFeedFilter();

  return (
    <>
      <div
        className="mx-4 my-3 h-px w-[calc(100%-2rem)] bg-[#E8E8E4]"
        aria-hidden
      />
      <p
        className="mb-2 px-4 font-sans text-[10px] font-semibold uppercase tracking-[2px]"
        style={{ color: muted }}
      >
        Activity
      </p>
      <nav className="flex flex-col gap-0.5 px-2" aria-label="Activity filters">
        {FEED_FILTER_ITEMS.map(({ label, value }) => {
          const active =
            value === null
              ? activeFilter === null
              : activeFilter === value;
          const dotColor = FILTER_DOT_COLOR[label] ?? muted;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setActiveFilter(value as FeedActivityFilter)}
              className={filterItemClass(active)}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: dotColor }}
                aria-hidden
              />
              {label}
            </button>
          );
        })}
      </nav>
    </>
  );
}

type InnerProps = {
  userId: string;
  profile: Profile | null;
  displayName: string;
  children: React.ReactNode;
};

function AppLayoutInner({ userId, profile, displayName, children }: InnerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    setPostModalOpen,
    postModalOpen,
    notifySessionPosted,
    editingSession,
    setEditingSession,
    openPostModalForCreate,
  } = usePostSession();
  const [postConfirm, setPostConfirm] = useState<JoinConfirmationSession | null>(null);

  const hostName =
    profile?.full_name?.trim() || profile?.username?.trim() || displayName;

  const neighborhood = profile?.neighborhood?.trim() || null;

  const onPostSuccess = useCallback(
    (s: JoinConfirmationSession) => {
      notifySessionPosted();
      setPostConfirm(s);
      router.refresh();
    },
    [notifySessionPosted, router]
  );

  const isFeed = pathname === "/feed";
  const isSessions =
    pathname === "/profile/sessions" ||
    (pathname != null && pathname.startsWith("/sessions/"));
  const isProfile = pathname === "/profile" || pathname === "/profile/edit";

  const sidebarW = `${SIDEBAR_W}px`;

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <aside
          className="fixed left-0 top-0 z-50 hidden h-screen flex-col justify-between border-r bg-white lg:flex"
          style={{ width: sidebarW, borderColor: border }}
        >
          <div>
            <div
              className="border-b font-sans text-[22px] font-extrabold"
              style={{
                color: accent,
                fontWeight: 800,
                padding: "1.5rem 1.5rem 1rem",
                borderColor: border,
              }}
            >
              LOCALS
            </div>

            <nav className="px-2 py-2" aria-label="Main">
              <Link href="/feed" className={navLinkClass(isFeed)}>
                <IconHouse active={isFeed} size={20} />
                Feed
              </Link>
              <Link href="/profile/sessions" className={navLinkClass(isSessions)}>
                <IconCalendar active={isSessions} size={20} />
                My Sessions
              </Link>
              <Link href="/profile" className={navLinkClass(isProfile)}>
                <IconPerson active={isProfile} size={20} />
                Profile
              </Link>
            </nav>

            {isFeed ? <SidebarActivityFilters /> : null}

            <button
              type="button"
              onClick={openPostModalForCreate}
              className="m-4 w-[calc(100%-2rem)] max-w-full rounded-lg p-3 font-sans text-sm font-bold text-white transition hover:opacity-95"
              style={{ background: accent, fontWeight: 700 }}
            >
              + Post a session
            </button>
          </div>

          <div
            className="border-t"
            style={{ borderColor: border, padding: "1rem 1.5rem" }}
          >
            <div className="flex gap-2">
              <Avatar
                avatarId={profile?.avatar_id}
                name={displayName}
                size="nav"
                className="shrink-0"
              />
              <div className="min-w-0">
                <p
                  className="truncate font-sans text-sm font-bold leading-tight text-foreground"
                  style={{ fontWeight: 700, fontSize: "14px" }}
                >
                  {displayName}
                </p>
                {neighborhood ? (
                  <p
                    className="mt-0.5 truncate font-sans leading-tight"
                    style={{ color: muted, fontSize: "12px" }}
                  >
                    {neighborhood}
                  </p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                await supabase.auth.signOut();
                router.push("/login");
                router.refresh();
              }}
              className="mt-3 w-full text-left font-sans text-xs text-[#888880] transition hover:text-[#1A1A18]"
            >
              Sign out
            </button>
          </div>
        </aside>

        <main
          className="box-border min-h-screen w-full max-w-[720px] pt-0 pb-[calc(72px+env(safe-area-inset-bottom,0px))] lg:ml-[260px] lg:p-8"
        >
          {children}
        </main>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex h-16 min-h-[4rem] w-full items-stretch border-t bg-white px-1 lg:hidden"
        style={{
          borderColor: border,
          paddingBottom: "max(0px, env(safe-area-inset-bottom))",
        }}
        aria-label="Main"
      >
        <Link
          href="/feed"
          className="flex min-h-[4rem] min-w-0 flex-1 flex-col items-center justify-center gap-1"
        >
          <IconHouse active={isFeed} size={22} />
          <span
            className="text-center font-sans text-[10px] font-semibold"
            style={{ color: isFeed ? accent : muted }}
          >
            Feed
          </span>
        </Link>
        <Link
          href="/profile/sessions"
          className="flex min-h-[4rem] min-w-0 flex-1 flex-col items-center justify-center gap-1"
        >
          <IconCalendar active={isSessions} size={22} />
          <span
            className="text-center font-sans text-[10px] font-semibold"
            style={{ color: isSessions ? accent : muted }}
          >
            My Sessions
          </span>
        </Link>
        <button
          type="button"
          onClick={openPostModalForCreate}
          className="flex min-h-[4rem] min-w-0 flex-1 flex-col items-center justify-center gap-1"
          aria-label="Post a session"
        >
          <IconPostCircle />
          <span
            className="text-center font-sans text-[10px] font-semibold"
            style={{ color: accent }}
          >
            Post
          </span>
        </button>
        <Link
          href="/profile"
          className="flex min-h-[4rem] min-w-0 flex-1 flex-col items-center justify-center gap-1"
        >
          <IconPerson active={isProfile} size={22} />
          <span
            className="text-center font-sans text-[10px] font-semibold"
            style={{ color: isProfile ? accent : muted }}
          >
            Profile
          </span>
        </Link>
      </nav>

      <PostSessionModal
        open={postModalOpen}
        onClose={() => {
          setEditingSession(null);
          setPostModalOpen(false);
        }}
        onSuccess={onPostSuccess}
        userId={userId}
        hostDisplayName={hostName}
        editingSession={editingSession}
      />
      <JoinConfirmationModal
        open={postConfirm !== null}
        onClose={() => setPostConfirm(null)}
        session={postConfirm}
      />
    </>
  );
}

type Props = {
  userId: string;
  profile: Profile | null;
  displayName: string;
  children: React.ReactNode;
};

export function AppLayout(props: Props) {
  return (
    <FeedFilterProvider>
      <AppLayoutInner {...props} />
    </FeedFilterProvider>
  );
}
