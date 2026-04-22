import { avatarBackground, isAvatarId } from "@/lib/avatars";
import { AvatarGlyph } from "@/components/ui/avatar-glyphs";

const sizeClass = {
  sm: "h-8 w-8 min-h-8 min-w-8 text-[11px]",
  /** 36px — e.g. app sidebar */
  nav: "h-9 w-9 min-h-9 min-w-9 text-xs",
  md: "h-11 w-11 min-h-11 min-w-11 text-sm",
  lg: "h-[72px] w-[72px] min-h-[72px] min-w-[72px] text-lg",
} as const;

type Props = {
  avatarId?: string | null;
  name: string;
  size?: "sm" | "nav" | "md" | "lg";
  className?: string;
};

function initialsFromName(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}

export function Avatar({ avatarId, name, size = "md", className = "" }: Props) {
  const sc = sizeClass[size];
  const id = isAvatarId(avatarId) ? avatarId : null;
  const bg = id ? avatarBackground(id) : null;

  if (!id) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full border border-border bg-background font-sans font-bold text-accent ${sc} ${className}`}
        aria-hidden
      >
        {initialsFromName(name)}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden rounded-full text-white ${sc} ${className}`}
      style={{ backgroundColor: bg! }}
      aria-hidden
    >
      <svg viewBox="0 0 48 48" className="h-[62%] w-[62%]">
        <AvatarGlyph id={id} />
      </svg>
    </div>
  );
}
