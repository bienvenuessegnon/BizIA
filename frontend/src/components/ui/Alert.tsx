import type { ReactNode } from "react";

type AlertVariant = "success" | "error" | "info" | "warning";

type AlertProps = {
  variant: AlertVariant;
  title?: string;
  children: ReactNode;
};

export function Alert({ variant, title, children }: AlertProps) {
  return (
    <div className={`alert alert--${variant}`} role={variant === "error" ? "alert" : "status"}>
      {title && <strong className="alert__title">{title}</strong>}
      <p className="alert__body">{children}</p>
    </div>
  );
}
