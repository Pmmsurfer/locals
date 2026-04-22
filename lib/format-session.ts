/** e.g. "Tomorrow 6:00am", "Today 6:00pm" */
export function formatSessionStartsAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  const sameCalendar = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const timeStr = date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\s/g, "")
    .toLowerCase();

  if (sameCalendar(date, now)) {
    return `Today ${timeStr}`;
  }
  if (sameCalendar(date, tomorrow)) {
    return `Tomorrow ${timeStr}`;
  }

  const datePart = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${datePart} ${timeStr}`;
}

/** e.g. "Tomorrow · 8:00am · 60 min" */
export function formatSessionDetailSummary(
  iso: string,
  durationMinutes: number
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  const sameCalendar = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const timeStr = date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\s/g, "")
    .toLowerCase();

  let datePart: string;
  if (sameCalendar(date, now)) {
    datePart = "Today";
  } else if (sameCalendar(date, tomorrow)) {
    datePart = "Tomorrow";
  } else {
    datePart = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  if (durationMinutes > 0) {
    return `${datePart} · ${timeStr} · ${durationMinutes} min`;
  }
  return `${datePart} · ${timeStr}`;
}

/** e.g. "Tomorrow · 6:00am" for public share hero */
export function formatShareSessionDateLine(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  const sameCalendar = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const timeStr = date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\s/g, "")
    .toLowerCase();

  let dateLabel: string;
  if (sameCalendar(date, now)) {
    dateLabel = "Today";
  } else if (sameCalendar(date, tomorrow)) {
    dateLabel = "Tomorrow";
  } else {
    dateLabel = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  return `${dateLabel} · ${timeStr}`;
}
