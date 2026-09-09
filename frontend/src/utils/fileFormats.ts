export type DocumentFormat = "csv" | "xlsx" | "xls";

export const ACCEPTED_EXTENSIONS: DocumentFormat[] = ["csv", "xlsx", "xls"];

export const ACCEPTED_MIME_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const FILE_INPUT_ACCEPT = ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export function getFileExtension(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ?? null;
}

export function isAcceptedDocument(file: File): boolean {
  const ext = getFileExtension(file.name);
  if (ext && ACCEPTED_EXTENSIONS.includes(ext as DocumentFormat)) return true;
  return ACCEPTED_MIME_TYPES.includes(file.type);
}

export function formatLabel(format: DocumentFormat): string {
  const labels: Record<DocumentFormat, string> = {
    csv: "CSV",
    xlsx: "Excel",
    xls: "Excel (legacy)",
  };
  return labels[format];
}
