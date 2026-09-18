import type { ReactNode } from "react";
import Link from "next/link";
import { IconHome } from "@/components/icons/Icons";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="auth-card card--glass">
      <div style={{ marginBottom: 12 }}>
        <Link
          href="/"
          className="app-page-banner__home-btn"
          style={{
            background: "rgba(0, 112, 243, 0.08)",
            borderColor: "rgba(0, 112, 243, 0.2)",
            color: "#0c3668",
          }}
          title="Retour à l'accueil"
        >
          <IconHome size={14} /> Retour à l&apos;accueil
        </Link>
      </div>
      <header className="auth-card__header">
        <h1 className="auth-card__title">{title}</h1>
        {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
      </header>
      <div className="auth-card__body">{children}</div>
      {footer && <footer className="auth-card__footer">{footer}</footer>}
    </div>
  );
}
