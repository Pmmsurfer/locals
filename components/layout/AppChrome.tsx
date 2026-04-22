import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";
import { AppLayout } from "./AppLayout";

type Props = {
  children: React.ReactNode;
  /** When true, unauthenticated users see children with no app shell (e.g. public share page). */
  publicWhenLoggedOut?: boolean;
};

export async function AppChrome({
  children,
  publicWhenLoggedOut = false,
}: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (publicWhenLoggedOut) {
      return <>{children}</>;
    }
    redirect("/login");
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileRow as Profile | null;
  const displayName =
    profile?.full_name?.trim() ||
    profile?.username?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "You";

  return (
    <AppLayout
      userId={user.id}
      profile={profile}
      displayName={displayName}
    >
      {children}
    </AppLayout>
  );
}
