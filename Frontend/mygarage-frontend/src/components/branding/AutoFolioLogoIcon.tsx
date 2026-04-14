import * as React from "react";

interface AutoFolioLogoIconProps {
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}

export function AutoFolioLogoIcon({
  className = "h-24 w-24",
  title = "AutoFolio logo",
  style,
}: AutoFolioLogoIconProps) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id="autofolio-bg" x1="180" y1="160" x2="850" y2="900" gradientUnits="userSpaceOnUse">
          <stop stopColor="#363B57" />
          <stop offset="1" stopColor="#0B1020" />
        </linearGradient>
        <filter
          id="autofolio-shadow"
          x="140"
          y="150"
          width="760"
          height="760"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow dx="0" dy="20" stdDeviation="24" floodOpacity="0.18" />
        </filter>
      </defs>

      <g filter="url(#autofolio-shadow)">
        <rect x="180" y="180" width="664" height="664" rx="112" fill="url(#autofolio-bg)" />
        <rect x="180.5" y="180.5" width="663" height="663" rx="111.5" stroke="white" strokeOpacity="0.10" />
      </g>

      <g stroke="#F5F7FA" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M270 301H458C485 301 508 323 514 349C519 367 536 380 555 380H770C800 380 824 404 824 434V586" />
        <path d="M270 301C240 301 216 325 216 355V575C216 605 240 629 270 629H314" />
        <path d="M822 629H760" />
        <path d="M215 632C215 662 239 686 269 686H771C801 686 825 662 825 632" />

        <path d="M313 571C333 543 366 531 422 531H598C682 531 747 548 823 629" />
        <path d="M375 488C441 454 504 437 575 437C634 437 685 453 730 485" />
        <path d="M316 572C308 552 306 534 311 516C314 503 325 493 339 493H400" />
        <path d="M731 485H779" />
        <path d="M337 686H639" />
        <path d="M733 686H823" />
      </g>

      <circle cx="364" cy="629" r="45" fill="url(#autofolio-bg)" stroke="#F5F7FA" strokeWidth="24" />
      <circle cx="691" cy="629" r="45" fill="url(#autofolio-bg)" stroke="#F5F7FA" strokeWidth="24" />
    </svg>
  );
}
