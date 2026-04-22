import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SessionSharePage } from "@/components/sessions/SessionSharePage";
import { getPublicSessionBundle } from "@/lib/get-public-session";
import { formatSessionStartsAt } from "@/lib/format-session";
import { isUnlimitedMaxSpots } from "@/lib/session-capacity";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: { id: string };
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const bundle = await getPublicSessionBundle(params.id);
  if (!bundle) {
    return { title: "Session · Locals" };
  }
  const { session } = bundle;
  const spotBlurb = isUnlimitedMaxSpots(session.max_spots)
    ? "Open to all"
    : `${Math.max(0, session.max_spots - session.spots_filled)} spots left`;
  const description = [
    session.activity,
    formatSessionStartsAt(session.starts_at),
    session.location_name?.trim() || "Location TBD",
    spotBlurb,
  ].join(" · ");

  const title = `${session.title} · Locals`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PublicShareSessionPage({ params }: PageProps) {
  const bundle = await getPublicSessionBundle(params.id);
  if (!bundle) {
    notFound();
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? null;
  let initialJoined = false;
  let viewerAvatarId: string | null = null;
  if (userId) {
    const { data: row } = await supabase
      .from("session_participants")
      .select("id")
      .eq("session_id", params.id)
      .eq("user_id", userId)
      .eq("status", "joined")
      .maybeSingle();
    initialJoined = !!row;

    const { data: vp } = await supabase
      .from("profiles")
      .select("avatar_id")
      .eq("id", userId)
      .maybeSingle();
    viewerAvatarId = (vp?.avatar_id as string | undefined) ?? null;
  }

  return (
    <SessionSharePage
      bundle={bundle}
      currentUserId={userId}
      initialJoined={initialJoined}
      sessionId={params.id}
      inAppShell={!!userId}
      viewerAvatarId={viewerAvatarId}
    />
  );
}
