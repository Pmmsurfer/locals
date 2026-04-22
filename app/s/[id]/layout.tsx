import { AppChrome } from "@/components/layout/AppChrome";

/**
 * When logged in, wrap the public share view in the same app shell as /feed
 * (bottom nav on mobile, left sidebar on desktop).
 */
export default function ShareSessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppChrome publicWhenLoggedOut>{children}</AppChrome>;
}
