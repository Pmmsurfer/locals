import { redirect } from "next/navigation";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export default async function ProfileRoute() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profileRow, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profileRow) {
    redirect("/onboarding");
  }

  const profile = profileRow as Profile;

  const { count: hosted } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", user.id);

  const { count: attended } = await supabase
    .from("session_participants")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("showed_up_at", "is", null);

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const { data: hostedInRange } = await supabase
    .from("sessions")
    .select("id")
    .eq("creator_id", user.id)
    .gte("starts_at", sinceIso);

  const monthSessionIds = new Set<string>();
  (hostedInRange ?? []).forEach((r) => monthSessionIds.add(r.id as string));

  const { data: partRows } = await supabase
    .from("session_participants")
    .select("session_id, sessions!inner(starts_at)")
    .eq("user_id", user.id);

  for (const row of partRows ?? []) {
    const r = row as unknown as {
      session_id: string;
      sessions: { starts_at: string } | null;
    };
    if (r.sessions && new Date(r.sessions.starts_at) >= since) {
      monthSessionIds.add(r.session_id);
    }
  }

  const displayName =
    profile.full_name?.trim() ||
    profile.username?.trim() ||
    user.email?.split("@")[0] ||
    "You";

  return (
    <ProfilePage
      profile={profile}
      displayName={displayName}
      stats={{
        sessionsHosted: hosted ?? 0,
        sessionsAttended: attended ?? 0,
        sessionsThisMonth: monthSessionIds.size,
      }}
    />
  );
}
