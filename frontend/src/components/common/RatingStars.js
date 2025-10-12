import React from "react";

// Reusable star rating display with partial fill support
// Props:
// - value: number (0-5)
// - size: pixel size for each star
// - className: extra classes for the wrapper
// - showValue: whether to show numeric value next to stars
// - valueClassName: classes for the numeric value text
export default function RatingStars({
  value = 0,
  size = 18,
  className = "",
  showValue = false,
  valueClassName = "text-sm text-gray-300",
}) {
  const safe = Math.max(0, Math.min(5, Number(value) || 0));
  const percent = (safe / 5) * 100;

  const Star = ({ color = "currentColor" }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      aria-hidden="true"
    >
      <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.786 1.401 8.168L12 18.896l-7.335 3.869 1.401-8.168L.132 9.211l8.2-1.193L12 .587z" />
    </svg>
  );

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className="relative inline-block align-middle" aria-label={`${safe.toFixed(1)} out of 5`}>
        {/* Base (empty) stars */}
        <div className="flex gap-0.5 text-gray-500/50">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={`empty-${i}`} />
          ))}
        </div>
        {/* Filled stars overlay */}
        <div
          className="absolute top-0 left-0 overflow-hidden text-yellow-400"
          style={{ width: `${percent}%` }}
        >
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={`filled-${i}`} />
            ))}
          </div>
        </div>
      </div>
      {showValue && (
        <span className={`ml-2 ${valueClassName}`}>{safe.toFixed(1)} / 5</span>
      )}
    </div>
  );
}

