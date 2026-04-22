import { redirect } from "next/navigation";
import { FeedClient } from "@/components/feed/FeedClient";
import { createClient } from "@/lib/supabase/server";
import type { Profile, ProfileActivity } from "@/types";

function firstName(display: string) {
  const t = display.trim();
  if (!t) return "there";
  return t.split(/\s+/)[0] || t;
}

export default async function FeedPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileRow as Profile | null;

  const display =
    profile?.full_name?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "there";

  const areaLabel = profile?.neighborhood?.trim() || "you";

  const profileActivityOrder =
    (profile?.activities as ProfileActivity[] | null) ?? null;

  return (
    <div className="min-h-screen" style={{ background: "#F4F4F0" }}>
      <div style={{ maxWidth: "720px", padding: "2rem" }}>
        <header className="mb-5">
          <h1
            className="font-sans text-2xl font-extrabold text-[#1A1A18] lg:text-[28px] lg:font-extrabold"
            style={{ fontWeight: 800 }}
          >
            Hey, {firstName(display)}
          </h1>
          <p className="mt-1 font-sans text-sm text-[#888880]">
            Sessions near {areaLabel}
          </p>
          <div className="mt-5 h-px w-full max-w-full bg-[#E8E8E4]" aria-hidden />
        </header>

        <FeedClient
          userId={user.id}
          profileActivityOrder={profileActivityOrder}
        />
      </div>
    </div>
  );
}
