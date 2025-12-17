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
  activeColor = "#FACC15",
  inactiveColor = "#4B5563",
  showSuffix = true,
}) {
  const safe = Math.max(0, Math.min(5, Number(value) || 0));

  const Star = ({ color = "currentColor" }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.786 1.401 8.168L12 18.896l-7.335 3.869 1.401-8.168L.132 9.211l8.2-1.193L12 .587z" />
    </svg>
  );

  const renderStar = (index) => {
    const fillPercent = Math.max(0, Math.min(1, safe - index)) * 100;
    return (
      <span
        key={index}
        className="relative inline-block"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <Star color={inactiveColor} />
        {fillPercent > 0 && (
          <span
            className="absolute top-0 left-0 h-full overflow-hidden"
            style={{ width: `${fillPercent}%` }}
          >
            <Star color={activeColor} />
          </span>
        )}
      </span>
    );
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div
        className="flex items-center gap-1"
        aria-label={`${safe.toFixed(1)} out of 5`}
      >
        {Array.from({ length: 5 }).map((_, index) => renderStar(index))}
      </div>
      {showValue && (
        <span className={`ml-2 ${valueClassName}`}>
          {safe.toFixed(1)}
          {showSuffix ? " / 5" : ""}
        </span>
      )}
    </div>
  );
}
