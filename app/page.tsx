import { redirect } from "next/navigation";
import { Landing } from "@/components/landing/Landing";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/feed");
  }

  return <Landing />;
}
