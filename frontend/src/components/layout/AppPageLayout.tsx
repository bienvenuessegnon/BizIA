import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/PageHeader";

type AppPageLayoutProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AppPageLayout({
  eyebrow,
  title,
  description,
  actions,
  children,
  className = "",
}: AppPageLayoutProps) {
  return (
    <section className={`app-page ${className}`.trim()}>
      <Link href="/" className="page-breadcrumb">
        ← Retour à l&apos;accueil
      </Link>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={actions}
      />
      <div className="app-page__content">{children}</div>
    </section>
  );
}
