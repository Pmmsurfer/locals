import { redirect } from "next/navigation";
import { ProfileSessionsPage } from "@/components/profile/ProfileSessionsPage";
import { createClient } from "@/lib/supabase/server";
import type { Session, SessionParticipant } from "@/types";

export default async function ProfileSessionsRoute() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: hostingRows } = await supabase
    .from("sessions")
    .select("*")
    .eq("creator_id", user.id)
    .order("starts_at", { ascending: false });

  const hosting = (hostingRows ?? []) as Session[];

  const { data: partData } = await supabase
    .from("session_participants")
    .select("id, session_id, user_id, status, showed_up_at, sessions(*)")
    .eq("user_id", user.id);

  const attended: (Session & { participant: SessionParticipant })[] = [];

  for (const row of partData ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    const sess = r.sessions as Session | undefined;
    if (sess && sess.creator_id !== user.id) {
      attended.push({
        ...sess,
        participant: {
          id: r.id,
          session_id: r.session_id,
          user_id: r.user_id,
          status: r.status,
          showed_up_at: r.showed_up_at,
        } as SessionParticipant,
      });
    }
  }

  return <ProfileSessionsPage hosting={hosting} attended={attended} />;
}
