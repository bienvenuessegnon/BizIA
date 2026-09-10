import type { ReactNode } from "react";

type BadgeVariant = "low" | "medium" | "high" | "default";

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
};

export function Badge({ variant = "default", children }: BadgeProps) {
  return <span className={`badge badge--${variant}`}>{children}</span>;
}
