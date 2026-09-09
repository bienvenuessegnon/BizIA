import Link from "next/link";
import type { ReactNode } from "react";
import { BizIALogo } from "@/components/brand/BizIALogo";

type AuthPageLayoutProps = {
  children: ReactNode;
};

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div className="auth-page">
      <div className="auth-page__decor" aria-hidden="true" />
      <div className="auth-page__inner">
        <Link href="/" className="auth-page__brand">
          <BizIALogo size="md" showTagline />
        </Link>
        {children}
      </div>
    </div>
  );
}
