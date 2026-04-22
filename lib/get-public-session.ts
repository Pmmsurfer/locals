import { createClient } from "@/lib/supabase/server";
import type { Session, SessionAttendeeRow } from "@/types";

export type PublicSessionCreator = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  avatar_id: string | null;
};

export type PublicSessionBundle = {
  session: Session;
  creator: PublicSessionCreator;
  attendees: SessionAttendeeRow[];
};

export async function getPublicSessionBundle(
  sessionId: string
): Promise<PublicSessionBundle | null> {
  const supabase = createClient();

  const { data: sessionRow, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !sessionRow) {
    return null;
  }

  const row = sessionRow as Session;

  const { data: participants } = await supabase
    .from("session_participants")
    .select("id, user_id, status")
    .eq("session_id", sessionId)
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

  const attendees: SessionAttendeeRow[] = [];
  const seen = new Set<string>();

  const pushRow = (userId: string, isCreator: boolean) => {
    if (seen.has(userId)) return;
    seen.add(userId);
    const p = profileById[userId];
    attendees.push({
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

  return {
    session: row,
    creator: {
      full_name: creatorProfile?.full_name ?? null,
      username: creatorProfile?.username ?? null,
      avatar_url: creatorProfile?.avatar_url ?? null,
      avatar_id: creatorProfile?.avatar_id != null
        ? (creatorProfile.avatar_id as string)
        : null,
    },
    attendees,
  };
}
