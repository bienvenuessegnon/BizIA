"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useCompany } from "@/contexts/CompanyContext";
import { IconBuilding, IconHome } from "@/components/icons/Icons";

type AppPageLayoutProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  hideDefaultBanner?: boolean;
};

export function AppPageLayout({
  eyebrow,
  title,
  description,
  actions,
  children,
  className = "",
  hideDefaultBanner = false,
}: AppPageLayoutProps) {
  const { currentCompany } = useCompany();

  return (
    <section className={`app-page ${className}`.trim()}>
      {!hideDefaultBanner && (
        <div className="app-page-banner">
          <div className="app-page-banner__inner">
            <div className="app-page-banner__left">
              <div className="app-page-banner__meta">
                <Link href="/" className="app-page-banner__home-btn" title="Retour à l'accueil">
                  <IconHome size={14} /> Accueil
                </Link>
                {eyebrow && <span className="app-page-banner__badge">{eyebrow}</span>}
                {currentCompany && (
                  <span className="app-page-banner__company">
                    <IconBuilding size={14} /> {currentCompany.name}
                  </span>
                )}
              </div>
              <h1 className="app-page-banner__title">{title}</h1>
              {description && <p className="app-page-banner__desc">{description}</p>}
            </div>

            {actions && <div className="app-page-banner__actions">{actions}</div>}
          </div>
        </div>
      )}

      <div className="app-page__content">{children}</div>
    </section>
  );
}
