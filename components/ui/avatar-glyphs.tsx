import type { AvatarId } from "@/lib/avatars";

const w = "fill-white";

/** 48×48 viewBox, white animal silhouettes. */
export function AvatarGlyph({ id, className }: { id: AvatarId; className?: string }) {
  return (
    <g className={className} aria-hidden>
      {id === "bear" && (
        <>
          <circle cx="16" cy="14" r="6" className={w} />
          <circle cx="32" cy="14" r="6" className={w} />
          <circle cx="24" cy="28" r="12" className={w} />
        </>
      )}
      {id === "fox" && (
        <path
          className={w}
          d="M6 36 L8 8 L20 20 L24 4 L28 20 L40 8 L42 36 L32 28 L24 34 L16 28 Z"
        />
      )}
      {id === "wolf" && (
        <path
          className={w}
          d="M4 8 L8 2 L16 8 L20 0 L24 4 L28 0 L32 8 L40 2 L44 8 L44 36 L4 36 Z M18 8 L20 2 L22 8 M26 8 L28 2 L30 8"
        />
      )}
      {id === "deer" && (
        <>
          <path
            className={w}
            d="M18 2 L20 0 L20 6 M30 2 L28 0 L28 6"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <ellipse cx="24" cy="28" rx="10" ry="12" className={w} />
        </>
      )}
      {id === "eagle" && (
        <path
          className={w}
          d="M2 16 Q8 4 24 2 Q40 4 46 16 Q40 32 24 40 Q8 32 2 16 Z M20 0 L20 4 M24 0 L24 2 M28 0 L28 4"
        />
      )}
      {id === "shark" && (
        <path
          className={w}
          d="M0 20 Q4 4 32 4 L48 6 L40 20 L48 22 L32 20 Q4 28 0 20 Z M36 2 L48 0 L40 4 Z"
        />
      )}
      {id === "lion" && (
        <path
          className={w}
          d="M6 4 Q2 20 4 32 Q8 40 20 40 Q32 40 40 32 Q44 20 40 4 Q28 0 20 0 Q12 0 6 4 Z"
        />
      )}
      {id === "owl" && (
        <>
          <path className={w} d="M8 4 Q24 0 40 4 L40 32 Q24 36 8 32 Z" />
          <ellipse cx="18" cy="16" rx="3" ry="4" className={w} />
          <ellipse cx="30" cy="16" rx="3" ry="4" className={w} />
        </>
      )}
      {id === "dolphin" && (
        <path
          className={w}
          d="M0 20 Q6 4 32 2 Q48 2 48 20 Q32 32 0 30 Q-2 24 0 20 Z M36 4 Q44 0 48 0 L44 6 Z"
        />
      )}
      {id === "hawk" && (
        <path
          className={w}
          d="M4 32 L2 4 L24 0 L46 4 L44 32 L24 40 Z M18 0 L20 0 L20 2 M24 0 L24 0 M28 0 L30 0 L30 2"
        />
      )}
      {id === "turtle" && (
        <>
          <ellipse cx="24" cy="18" rx="18" ry="10" className={w} />
          <circle cx="4" cy="18" r="4" className={w} />
        </>
      )}
      {id === "panther" && (
        <>
          <ellipse cx="24" cy="12" rx="4" ry="2" className={w} />
          <path
            className={w}
            d="M6 4 Q0 2 0 6 L2 20 Q4 32 8 40 Q24 44 40 40 Q44 32 48 20 L48 6 Q48 2 44 2 Q36 0 30 0 Q24 0 18 0 Q10 0 6 4 Z"
          />
        </>
      )}
    </g>
  );
}
