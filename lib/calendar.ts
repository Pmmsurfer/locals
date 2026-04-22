export function buildGoogleCalendarUrl(session: {
  title: string;
  activity: string;
  starts_at: string;
  duration_minutes: number;
  location_name?: string | null;
  address?: string;
  pace_level?: string;
}) {
  const start = new Date(session.starts_at);
  const durationMins =
    session.duration_minutes > 0 ? session.duration_minutes : 120;
  const end = new Date(start.getTime() + durationMins * 60000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0];

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${session.title} · Locals`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Activity: ${session.activity} | Pace: ${session.pace_level ?? "n/a"} | Added via Locals app`,
    location: (session.address ?? session.location_name) || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
