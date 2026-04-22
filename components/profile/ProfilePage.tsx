import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import type { PaceLevel, Profile, ProfileActivity } from "@/types";

const activityColors: Record<ProfileActivity, string> = {
  running: "bg-[#E8FFF0] text-[#15803D]",
  cycling: "bg-[#FFF4E8] text-[#D97706]",
  surfing: "bg-[#E8EEFF] text-[#1B3FF0]",
  swimming: "bg-[#E0F7FF] text-[#006994]",
  social: "bg-[#FFF3E0] text-[#E65100]",
  hiking: "bg-[#F0FDF4] text-[#166534]",
  yoga: "bg-[#FDF4FF] text-[#9333EA]",
  climbing: "bg-[#FEF2F2] text-[#B91C1C]",
  tennis: "bg-[#ECFDF5] text-[#0D9488]",
};

const paceLabel: Record<PaceLevel, string> = {
  easy: "Easy",
  moderate: "Moderate",
  fast: "Fast",
  race: "Race",
};

export type ProfileStats = {
  sessionsHosted: number;
  sessionsAttended: number;
  sessionsThisMonth: number;
};

type Props = {
  profile: Profile;
  displayName: string;
  stats: ProfileStats;
};

function formatActivity(a: ProfileActivity) {
  return a.charAt(0).toUpperCase() + a.slice(1);
}

export function ProfilePage({ profile, displayName, stats }: Props) {
  const username = profile.username?.trim() || "";
  const locationLine = [profile.neighborhood?.trim(), profile.city?.trim()]
    .filter(Boolean)
    .join(" · ");
  const activities = (profile.activities ?? []) as ProfileActivity[];
  const pace = profile.pace ?? {};

  return (
    <div className="mx-auto max-w-lg px-4 pb-12 pt-8 lg:max-w-2xl">
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
        <Avatar avatarId={profile.avatar_id} name={displayName} size="lg" />
        <div className="mt-4 min-w-0 flex-1 sm:mt-0">
          <h1 className="font-sans text-2xl font-extrabold">
            {profile.full_name?.trim() || displayName}
          </h1>
          {username ? (
            <p className="mt-0.5 text-sm text-muted">@{username}</p>
          ) : null}
          {locationLine ? (
            <p className="mt-2 text-sm text-foreground">{locationLine}</p>
          ) : null}
          {profile.bio?.trim() ? (
            <p className="mt-3 text-sm leading-relaxed text-foreground">
              {profile.bio.trim()}
            </p>
          ) : null}
          <Link
            href="/profile/edit"
            className="mt-4 inline-block rounded-button bg-accent px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
          >
            Edit profile
          </Link>
        </div>
      </div>

      {activities.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
            Activities
          </h2>
          <div className="flex flex-wrap gap-2">
            {activities.map((a) => (
              <span
                key={a}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold capitalize ${activityColors[a]}`}
              >
                {formatActivity(a)}
                {pace[a] ? (
                  <span className="text-xs font-medium opacity-90">
                    · {paceLabel[pace[a]!]}
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-card border border-card-border bg-surface p-4 text-center shadow-sm">
          <p className="font-sans text-2xl font-extrabold text-foreground">
            {stats.sessionsHosted}
          </p>
          <p className="text-xs font-semibold text-muted">Sessions hosted</p>
        </div>
        <div className="rounded-card border border-card-border bg-surface p-4 text-center shadow-sm">
          <p className="font-sans text-2xl font-extrabold text-foreground">
            {stats.sessionsAttended}
          </p>
          <p className="text-xs font-semibold text-muted">Sessions attended</p>
        </div>
        <div className="rounded-card border border-card-border bg-surface p-4 text-center shadow-sm">
          <p className="font-sans text-2xl font-extrabold text-foreground">
            {stats.sessionsThisMonth}
          </p>
          <p className="text-xs font-semibold text-muted">This month</p>
        </div>
      </section>
    </div>
  );
}
