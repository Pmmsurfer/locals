/** "More the merrier" / open capacity (stored in DB; join never blocked by this cap). */
export const UNLIMITED_MAX_SPOTS = 999;

export function isUnlimitedMaxSpots(
  maxSpots: number | null | undefined
): boolean {
  return maxSpots == null || maxSpots >= UNLIMITED_MAX_SPOTS;
}
