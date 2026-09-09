type BizIALogoProps = {
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { mark: 28, text: "1rem", tagline: "0.65rem" },
  md: { mark: 36, text: "1.35rem", tagline: "0.7rem" },
  lg: { mark: 48, text: "1.75rem", tagline: "0.8rem" },
};

export function BizIALogo({ showTagline = true, size = "md" }: BizIALogoProps) {
  const s = sizes[size];

  return (
    <div className="bizia-logo" aria-label="BizIA">
      <svg
        className="bizia-logo__mark"
        width={s.mark}
        height={s.mark}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="10" fill="url(#bizia-grad)" />
        <path
          d="M10 28V18h4v10h-4zm8-6v6h4v-6h-4zm8 3v3h4v-3h-4z"
          fill="white"
          opacity="0.95"
        />
        <path
          d="M10 28h20"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="30" cy="12" r="3" fill="#93c5fd" />
        <path
          d="M30 9v6M27 12h6"
          stroke="#1e40af"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="bizia-grad" x1="0" y1="0" x2="40" y2="40">
            <stop stopColor="#2563eb" />
            <stop offset="1" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      </svg>
      <div className="bizia-logo__text-wrap">
        <span className="bizia-logo__name" style={{ fontSize: s.text }}>
          Biz<span className="bizia-logo__accent">IA</span>
        </span>
        {showTagline && (
          <span className="bizia-logo__tagline" style={{ fontSize: s.tagline }}>
            PME &amp; entreprises
          </span>
        )}
      </div>
    </div>
  );
}
