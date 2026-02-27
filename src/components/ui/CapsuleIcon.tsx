// -----------------------------------------------------------
// CapsuleIcon — Polished two-tone medicine capsule
// -----------------------------------------------------------
// Elongated pill tilted 45°.  Two halves split across the
// middle (perpendicular to the long axis) — just like a
// real capsule.  Deep blue top + vibrant orange bottom,
// strong border, 3D gloss, center seam.
// -----------------------------------------------------------

import { useId } from "react";

interface CapsuleIconProps {
  /** Pixel size (square bounding box) */
  size?: number;
  className?: string;
}

const CapsuleIcon = ({ size = 20, className = "" }: CapsuleIconProps) => {
  const id = useId();

  // The capsule is drawn upright (tall) then rotated 45°.
  // Split is a horizontal line at y=50 (center of the 90-tall shape)
  // which, after rotation, becomes the perpendicular seam.

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Capsule outline — tall stadium, rotated 45° */}
        <clipPath id={id}>
          <rect x="35" y="5" width="30" height="90" rx="15" transform="rotate(45 50 50)" />
        </clipPath>
      </defs>

      {/* --- Top half of capsule: red --- */}
      <rect x="35" y="5" width="30" height="45" fill="#dc2626" transform="rotate(45 50 50)" clipPath={`url(#${id})`} />

      {/* --- Bottom half of capsule: golden yellow --- */}
      <rect x="35" y="50" width="30" height="45" fill="#facc15" transform="rotate(45 50 50)" clipPath={`url(#${id})`} />

      {/* --- Seam at the join --- */}
      <line x1="35" y1="50" x2="65" y2="50" stroke="#7f1d1d" strokeWidth="1.5" opacity="0.3" transform="rotate(45 50 50)" />

      {/* --- Thick border --- */}
      <rect x="35" y="5" width="30" height="90" rx="15" transform="rotate(45 50 50)" fill="none" stroke="#991b1b" strokeWidth="4" opacity="0.45" />
    </svg>
  );
};

export default CapsuleIcon;
