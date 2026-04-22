export const AVATAR_IDS = [
  "bear",
  "fox",
  "wolf",
  "deer",
  "eagle",
  "shark",
  "lion",
  "owl",
  "dolphin",
  "hawk",
  "turtle",
  "panther",
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export const AVATAR_DEFAULT_ID: AvatarId = "bear";

const BG: Record<AvatarId, string> = {
  bear: "#8B6914",
  fox: "#E07B39",
  wolf: "#6B7280",
  deer: "#92694A",
  eagle: "#1B3FF0",
  shark: "#0891B2",
  lion: "#D97706",
  owl: "#7C3AED",
  dolphin: "#0D9488",
  hawk: "#DC2626",
  turtle: "#16A34A",
  panther: "#1A1A18",
};

export function avatarBackground(id: string | null | undefined): string {
  if (id && id in BG) return BG[id as AvatarId];
  return BG[AVATAR_DEFAULT_ID];
}

export function isAvatarId(s: string | null | undefined): s is AvatarId {
  return s != null && (AVATAR_IDS as readonly string[]).includes(s);
}
