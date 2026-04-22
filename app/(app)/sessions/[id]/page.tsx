import { notFound, redirect } from "next/navigation";
import { SessionDetail } from "@/components/sessions/SessionDetail";
import { createClient } from "@/lib/supabase/server";
import type { Session, SessionAttendeeRow } from "@/types";

type PageProps = {
  params: { id: string };
};

export default async function SessionDetailPage({ params }: PageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/sessions/${params.id}`);
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (sessionError || !session) {
    notFound();
  }

  const row = session as Session;

  const { data: participants } = await supabase
    .from("session_participants")
    .select("id, user_id, status")
    .eq("session_id", params.id)
    .eq("status", "joined");

  const userIds = Array.from(
    new Set((participants ?? []).map((p) => p.user_id as string))
  );
  const idsForProfiles = Array.from(new Set([row.creator_id, ...userIds]));

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, avatar_id")
    .in("id", idsForProfiles);

  const profileById = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id as string, p])
  );

  const creatorProfile = profileById[row.creator_id];

  const attendeeRows: SessionAttendeeRow[] = [];
  const seen = new Set<string>();

  const pushRow = (userId: string, isCreator: boolean) => {
    if (seen.has(userId)) return;
    seen.add(userId);
    const p = profileById[userId];
    attendeeRows.push({
      user_id: userId,
      full_name: p?.full_name ?? null,
      username: p?.username ?? null,
      avatar_url: p?.avatar_url ?? null,
      avatar_id: p?.avatar_id != null ? (p.avatar_id as string) : null,
      is_creator: isCreator,
    });
  };

  pushRow(row.creator_id, true);
  for (const part of participants ?? []) {
    const uid = part.user_id as string;
    if (uid !== row.creator_id) {
      pushRow(uid, false);
    }
  }

  const creatorDisplay =
    creatorProfile?.full_name?.trim() ||
    creatorProfile?.username?.trim() ||
    "Host";

  const initialJoined = userIds.includes(user.id);

  return (
    <div className="bg-background text-foreground">
      <SessionDetail
        session={row}
        attendees={attendeeRows}
        currentUserId={user.id}
        initialJoined={initialJoined}
        creatorDisplayName={creatorDisplay}
      />
    </div>
  );
}
