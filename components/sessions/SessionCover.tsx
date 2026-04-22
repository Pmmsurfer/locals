import { useId } from "react";

export type SessionCoverActivity =
  | "running"
  | "cycling"
  | "surfing"
  | "swimming"
  | "social"
  | "hiking"
  | "yoga"
  | "climbing"
  | "tennis"
  | "pickleball";

type Props = {
  activity: SessionCoverActivity;
  height?: number;
  borderRadius?: string;
};

function titleCase(activity: SessionCoverActivity): string {
  if (activity === "pickleball") return "PICKLEBALL";
  return activity.toUpperCase();
}

function gradientStops(activity: SessionCoverActivity) {
  switch (activity) {
    case "running":
      return ["#FF6B35", "#FFB347", "#FFE66D"];
    case "cycling":
      return ["#0F2027", "#203A43", "#2C5364"];
    case "surfing":
      return ["#1A6B8A", "#2AB7CA", "#80DEEA"];
    case "swimming":
      return ["#006994", "#0099CC", "#00BFFF"];
    case "social":
      return ["#FF6B6B", "#FFE66D", "#FF8E53"];
    case "hiking":
      return ["#134E5E", "#71B280", "#A3D9A5"];
    case "yoga":
      return ["#C9D6FF", "#E2E2E2", "#FFECD2"];
    case "climbing":
      return ["#4B4B4B", "#8B8B8B", "#C4C4C4"];
    case "tennis":
    case "pickleball":
      return ["#4CAF50", "#8BC34A", "#CDDC39"];
    default:
      return ["#1A6B8A", "#2AB7CA", "#80DEEA"];
  }
}

function DecorativeShapes({
  activity,
}: {
  activity: SessionCoverActivity;
}) {
  switch (activity) {
    case "running":
      return (
        <>
          <path d="M-40 150 C90 115 220 178 360 138 C430 117 495 122 610 102 L610 230 L-40 230 Z" fill="#FFD2A0" opacity="0.2" />
          <path d="M-20 130 C85 100 240 145 350 112 C445 84 545 95 610 75 L610 230 L-20 230 Z" fill="#FFF0C8" opacity="0.18" />
          <path d="M0 88 C95 63 195 102 320 77 C430 56 495 67 560 48 L560 230 L0 230 Z" fill="#FFE4AD" opacity="0.16" />
          <path d="M-30 52 C88 24 201 67 300 44 C425 17 496 30 590 5" fill="none" stroke="#FFF5D8" strokeWidth="11" strokeLinecap="round" opacity="0.2" />
        </>
      );
    case "cycling":
      return (
        <>
          <path d="M0 178 C95 134 182 165 262 138 C322 118 370 124 450 98 C486 88 525 87 560 93 L560 230 L0 230 Z" fill="#88A8B8" opacity="0.24" />
          <path d="M0 154 C88 127 166 139 256 121 C331 107 397 118 488 103 C520 98 541 100 560 102 L560 230 L0 230 Z" fill="#A6BFCC" opacity="0.18" />
          <circle cx="122" cy="115" r="74" fill="none" stroke="#D0E3EA" strokeWidth="10" opacity="0.12" />
          <circle cx="405" cy="96" r="58" fill="none" stroke="#C7DCE5" strokeWidth="8" opacity="0.13" />
        </>
      );
    case "surfing":
      return (
        <>
          <path d="M-20 158 C66 127 148 178 214 145 C292 105 361 152 426 123 C473 102 515 104 580 84 L580 230 L-20 230 Z" fill="#A9EFF5" opacity="0.24" />
          <path d="M-30 120 C52 103 110 138 196 114 C281 89 346 128 423 102 C484 82 530 84 590 67" fill="none" stroke="#D7FAFF" strokeWidth="18" strokeLinecap="round" opacity="0.16" />
          <path d="M24 94 C79 46 143 48 195 89 C155 80 124 96 92 127 C73 112 49 105 24 94 Z" fill="#D6F8FC" opacity="0.22" />
          <path d="M310 85 C356 39 424 40 471 82 C430 76 396 94 361 124 C343 108 327 93 310 85 Z" fill="#C9F5F9" opacity="0.2" />
        </>
      );
    case "swimming":
      return (
        <>
          <path
            d="M-30 88 C50 64 150 100 250 70 C360 40 450 80 600 50"
            fill="none"
            stroke="#E0F4FF"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            d="M-20 120 C90 95 200 128 300 100 C400 75 500 100 600 80"
            fill="none"
            stroke="#B8E8FF"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d="M-40 150 C40 128 150 160 250 140 C360 120 450 150 600 125 L600 200 L-40 200 Z"
            fill="#B0E8FF"
            opacity="0.2"
          />
          <path
            d="M0 62 L0 200 M95 50 L95 200 M200 45 L200 200 M300 50 L300 200 M400 45 L400 200 M500 50 L500 200"
            stroke="#E8F6FF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="2 4"
            opacity="0.28"
          />
        </>
      );
    case "social":
      return (
        <>
          <circle cx="120" cy="100" r="64" fill="#FFFFFF" opacity="0.12" />
          <circle cx="240" cy="90" r="48" fill="#FFFFFF" opacity="0.1" />
          <circle cx="380" cy="120" r="70" fill="#FFFFFF" opacity="0.11" />
          <circle cx="480" cy="80" r="40" fill="#FFF8E7" opacity="0.14" />
          <circle cx="300" cy="60" r="32" fill="#FFFFFF" opacity="0.1" />
          <circle cx="180" cy="150" r="28" fill="#FFF0E0" opacity="0.12" />
        </>
      );
    case "hiking":
      return (
        <>
          <path d="M0 165 L81 100 L143 165 Z" fill="#C8EAD3" opacity="0.22" />
          <path d="M89 165 L212 62 L334 165 Z" fill="#B8E3C9" opacity="0.26" />
          <path d="M240 165 L363 78 L482 165 Z" fill="#CFEFD7" opacity="0.2" />
          <path d="M372 165 L470 103 L560 165 Z" fill="#B2DDC2" opacity="0.24" />
          <path d="M0 165 L560 165 L560 230 L0 230 Z" fill="#8BC6A2" opacity="0.18" />
        </>
      );
    case "yoga":
      return (
        <>
          <circle cx="280" cy="95" r="88" fill="none" stroke="#FFFFFF" strokeWidth="10" opacity="0.16" />
          <circle cx="280" cy="95" r="62" fill="none" stroke="#FFF8F0" strokeWidth="8" opacity="0.2" />
          <circle cx="280" cy="95" r="36" fill="none" stroke="#F8EEFF" strokeWidth="6" opacity="0.24" />
          <circle cx="115" cy="58" r="48" fill="#FFFFFF" opacity="0.11" />
          <circle cx="455" cy="132" r="42" fill="#FFFFFF" opacity="0.1" />
        </>
      );
    case "climbing":
      return (
        <>
          <path d="M0 174 L78 92 L132 164 L186 106 L251 165 L0 165 Z" fill="#D8D8D8" opacity="0.22" />
          <path d="M165 165 L255 83 L316 141 L373 88 L463 165 Z" fill="#E0E0E0" opacity="0.19" />
          <path d="M338 165 L422 98 L486 154 L548 108 L560 165 Z" fill="#F0F0F0" opacity="0.17" />
          <path d="M74 44 L142 17 L167 70 L104 88 Z" fill="#F3F3F3" opacity="0.13" />
          <path d="M397 46 L459 22 L492 72 L436 90 Z" fill="#ECECEC" opacity="0.12" />
        </>
      );
    case "tennis":
    case "pickleball":
      return (
        <>
          <path d="M0 125 L560 125" stroke="#E9F7C9" strokeWidth="8" opacity="0.26" />
          <path d="M120 0 L120 200" stroke="#F3FBDD" strokeWidth="6" opacity="0.2" />
          <path d="M440 0 L440 200" stroke="#F3FBDD" strokeWidth="6" opacity="0.2" />
          <path d="M0 72 L560 72" stroke="#F6FDE7" strokeWidth="4" opacity="0.18" />
          <path d="M0 178 L560 178" stroke="#F1FBD8" strokeWidth="4" opacity="0.2" />
          <path d="M70 30 L495 186" stroke="#E4F5BE" strokeWidth="10" opacity="0.14" />
        </>
      );
    default:
      return null;
  }
}

export function SessionCover({
  activity,
  height = 200,
  borderRadius = "20px 20px 0 0",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const gradientId = `session-cover-gradient-${uid}`;
  const overlayId = `session-cover-overlay-${uid}`;

  const [start, mid, end] = gradientStops(activity);

  return (
    <div
      style={{ height, borderRadius }}
      className="relative w-full overflow-hidden"
      aria-hidden
    >
      <svg
        viewBox="0 0 560 200"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={start} />
            <stop offset="54%" stopColor={mid} />
            <stop offset="100%" stopColor={end} />
          </linearGradient>
          <linearGradient id={overlayId} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.35" />
            <stop offset="45%" stopColor="#000000" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="560" height="200" fill={`url(#${gradientId})`} />
        <DecorativeShapes activity={activity} />
        <rect x="0" y="0" width="560" height="200" fill={`url(#${overlayId})`} />

        <text
          x="22"
          y="182"
          fill="#FFFFFF"
          fillOpacity="0.8"
          style={{
            fontFamily: "var(--font-nunito), system-ui, sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          {titleCase(activity)}
        </text>
      </svg>
    </div>
  );
}
