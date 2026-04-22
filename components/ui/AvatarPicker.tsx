"use client";

import { AVATAR_IDS, avatarBackground, isAvatarId, type AvatarId } from "@/lib/avatars";
import { AvatarGlyph } from "@/components/ui/avatar-glyphs";

type Props = {
  value: string | null | undefined;
  onChange: (id: AvatarId) => void;
  /** If set, label for accessibility */
  "aria-label"?: string;
};

export function AvatarPicker({ value, onChange, "aria-label": ariaLabel }: Props) {
  const current = isAvatarId(value) ? value : null;

  return (
    <div
      className="grid grid-cols-3 gap-4 sm:grid-cols-4"
      role="listbox"
      aria-label={ariaLabel ?? "Choose your avatar"}
    >
      {AVATAR_IDS.map((id) => {
        const selected = current === id;
        const bg = avatarBackground(id);
        return (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={
              "mx-auto flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
              (selected
                ? "scale-110 ring-[3px] ring-[#1B3FF0] ring-offset-2"
                : "ring-0 ring-offset-0 hover:scale-[1.04]")
            }
            style={{ backgroundColor: bg }}
          >
            <svg viewBox="0 0 48 48" className="h-[70%] w-[70%]">
              <AvatarGlyph id={id} />
            </svg>
            <span className="sr-only">{id}</span>
          </button>
        );
      })}
    </div>
  );
}
