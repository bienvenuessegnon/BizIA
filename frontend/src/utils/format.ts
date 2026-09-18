export function formatCurrency(value: number, options?: { showDecimals?: boolean }): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: options?.showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} CFA`;
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
