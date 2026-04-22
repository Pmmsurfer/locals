export type SessionActivity =
  | "running"
  | "cycling"
  | "surfing"
  | "swimming"
  | "social";

export type ProfileActivity =
  | "running"
  | "cycling"
  | "surfing"
  | "swimming"
  | "social"
  | "hiking"
  | "yoga"
  | "climbing"
  | "tennis";

/** @deprecated use SessionActivity for session rows; kept as alias. */
export type Activity = SessionActivity;

export type PaceLevel = "easy" | "moderate" | "fast" | "race";

/** Pace preferences keyed by profile activity (stored as JSONB). */
export type ProfilePace = Partial<Record<ProfileActivity, PaceLevel>>;

export type Weekday =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

export type DayPart = "morning" | "afternoon" | "evening";

/** Typical shape for `availability` JSONB on profiles. */
export type ProfileAvailability = {
  days: Weekday[];
  times: DayPart[];
};

/** Profile pace step: swimming & social are optional (no pace chips). */
export function profileActivityHasPace(a: ProfileActivity): boolean {
  return a !== "social" && a !== "swimming";
}

export type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  /** Animal avatar key: bear, fox, … */
  avatar_id: string | null;
  bio: string | null;
  neighborhood: string | null;
  city: string | null;
  /** Saved coordinates on profile; when missing, feed shows a location banner. */
  latitude?: number | null;
  longitude?: number | null;
  activities: ProfileActivity[] | null;
  pace: ProfilePace | null;
  availability: ProfileAvailability | null;
  email_notifications: boolean | null;
  is_verified: boolean | null;
  is_active: boolean | null;
};

export type SessionPaceLevel = PaceLevel;

export type SessionStatus = "open" | "full" | "cancelled" | "completed";

export type Session = {
  id: string;
  creator_id: string;
  activity: SessionActivity;
  title: string;
  description: string | null;
  /** Meeting / wayfinding text for attendees. */
  instructions: string | null;
  starts_at: string;
  duration_minutes: number;
  location_name: string | null;
  address: string | null;
  pace_level: SessionPaceLevel;
  beginner_friendly?: boolean | null;
  max_spots: number;
  spots_filled: number;
  status: SessionStatus;
  /** Optional: how to reach the host (WhatsApp, IG, etc.). */
  contact_info?: string | null;
  /** When not public, session may be hidden from the public feed (see `nearby_sessions`). */
  privacy?: string | null;
  whatsapp_link?: string | null;
};

/** Session row returned by `nearby_sessions` RPC (may include creator fields). */
export type FeedSession = Session & {
  creator_full_name?: string | null;
  creator_username?: string | null;
  creator_avatar_url?: string | null;
  creator_avatar_id?: string | null;
  distance_meters?: number | null;
};

/** Attendee row for session detail (creator first, then participants). */
export type SessionAttendeeRow = {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  avatar_id: string | null;
  is_creator: boolean;
};

export type SessionParticipant = {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
  showed_up_at: string | null;
};
