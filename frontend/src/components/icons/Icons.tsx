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

export function IconFileImage({ className, size }: IconProps) {
  return (
    <Svg className={className} size={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <rect x="8" y="12" width="8" height="6" rx="1" />
      <circle cx="10" cy="14" r="0.8" />
    </Svg>
  );
}

export function DocumentFormatIcon({
  format,
  className,
  size,
}: IconProps & { format: DocumentFormat }) {
  if (format === "csv") return <IconFileCsv className={className} size={size} />;
  if (format === "pdf") return <IconFilePdf className={className} size={size} />;
  if (format === "png" || format === "jpg" || format === "jpeg" || format === "webp") {
    return <IconFileImage className={className} size={size} />;
  }
  return <IconFileExcel className={className} size={size} />;
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
