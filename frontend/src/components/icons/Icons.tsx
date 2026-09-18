import type { DocumentFormat } from "@/utils/fileFormats";

type IconProps = {
  className?: string;
  size?: number;
};

const defaultSize = 24;

function Svg({
  className,
  size = defaultSize,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconPackage({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 22s8-4 8-10V6l-8-4-8 4v6c0 6 8 10 8 10z" />
      <path d="M12 22V12M2 6l10 5 10-5" />
    </Svg>
  );
}

export function IconCoins({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="9" cy="9" r="6" />
      <path d="M9 6v6M7.5 7.5h3" />
      <circle cx="15" cy="15" r="6" />
      <path d="M15 12v6M13.5 13.5h3" />
    </Svg>
  );
}

export function IconUpload({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 16V4M8 8l4-4 4 4" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </Svg>
  );
}

export function IconBot({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="5" y="8" width="14" height="11" rx="2" />
      <circle cx="9.5" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="13" r="1" fill="currentColor" stroke="none" />
      <path d="M9 17h6M12 4v4" />
      <circle cx="12" cy="3" r="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconTrending({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M3 17l6-6 4 4 8-10" />
      <path d="M17 5h4v4" />
    </Svg>
  );
}

export function IconDownload({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M12 4v12M8 12l4 4 4-4" />
      <path d="M4 18v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </Svg>
  );
}

export function IconFile({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </Svg>
  );
}

export function IconFileCsv({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h2M8 17h8M12 13v4" />
    </Svg>
  );
}

export function IconFileExcel({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13l2 4 2-4M9 17h6" />
    </Svg>
  );
}

export function IconFilePdf({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 16h2a1.5 1.5 0 0 0 0-3H8v6" />
    </Svg>
  );
}

export function IconFileWord({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 12l1.5 6 2.5-6 2.5 6L16 12" />
    </Svg>
  );
}

export function IconFilePowerpoint({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M10 12a3 3 0 1 0 0 6h1v-6h-1z" />
    </Svg>
  );
}

export function DocumentFormatIcon({
  format,
  className,
  size,
}: IconProps & { format: DocumentFormat }) {
  if (format === "csv") return <IconFileCsv className={className} size={size} />;
  if (format === "xlsx" || format === "xls") return <IconFileExcel className={className} size={size} />;
  if (format === "pdf") return <IconFilePdf className={className} size={size} />;
  if (format === "doc" || format === "docx") return <IconFileWord className={className} size={size} />;
  return <IconFilePowerpoint className={className} size={size} />;
}

export type QuickActionIcon = "package" | "coins" | "upload" | "bot";

export function QuickActionIconSvg({
  name,
  className,
  size = 22,
}: IconProps & { name: QuickActionIcon }) {
  switch (name) {
    case "package":
      return <IconPackage className={className} size={size} />;
    case "coins":
      return <IconCoins className={className} size={size} />;
    case "upload":
      return <IconUpload className={className} size={size} />;
    case "bot":
      return <IconBot className={className} size={size} />;
  }
}

export function IconGoogle({ className, size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function IconMic({ className, size = 20 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

export function IconBuilding({ className, size = 16 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
    </Svg>
  );
}

export function IconChartBar({ className, size = 18 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </Svg>
  );
}

export function IconSparkles({ className, size = 18 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </Svg>
  );
}

export function IconLock({ className, size = 18 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );
}

export function IconEdit({ className, size = 16 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </Svg>
  );
}

export function IconHome({ className, size = 18 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  );
}

export function IconAlertTriangle({ className, size = 16 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  );
}

export function IconCheckCircle({ className, size = 16 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </Svg>
  );
}

export function IconKeyboard({ className, size = 16 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="6" y1="8" x2="6.01" y2="8" />
      <line x1="10" y1="8" x2="10.01" y2="8" />
      <line x1="14" y1="8" x2="14.01" y2="8" />
      <line x1="18" y1="8" x2="18.01" y2="8" />
      <line x1="8" y1="12" x2="8.01" y2="12" />
      <line x1="12" y1="12" x2="12.01" y2="12" />
      <line x1="16" y1="12" x2="16.01" y2="12" />
      <line x1="7" y1="16" x2="17" y2="16" />
    </Svg>
  );
}

export function IconX({ className, size = 16 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  );
}

export function IconInfo({ className, size = 16 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </Svg>
  );
}

export function IconArrowRight({ className, size = 16 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </Svg>
  );
}

export function IconArrowLeft({ className, size = 16 }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </Svg>
  );
}

