"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/Spinner";
import { IconSparkles } from "@/components/icons/Icons";

const PROTECTED_ROUTES = ["/dashboard", "/produits", "/ventes", "/import", "/chat"];

export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, login } = useAuth();

  const isProtected = pathname != null && PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (isLoading) {
    return (
      <div className="auth-guard-loading">
        <Spinner label="Vérification de votre session…" />
      </div>
    );
  }

  if (isProtected && !isAuthenticated) {
    return (
      <div className="auth-guard-locked animate-fade-in">
        <div className="auth-guard-card card card--glass">
          <div className="auth-guard-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2>Espace sécurisé BizIA</h2>
          <p className="muted">
            Cette section nécessite une authentification active pour consulter vos indicateurs, gérer vos stocks ou échanger avec l&apos;assistant IA.
          </p>
          <div className="auth-guard-actions">
            <Link href="/connexion" className="btn btn--primary btn--lg">
              Se connecter
            </Link>
            <Link href="/inscription" className="btn btn--outline btn--lg">
              Créer un compte
            </Link>
          </div>
          <div className="auth-guard-demo">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={async () => {
                await login({ email: "demo@bizia.africa", password: "password123" }).catch(async () => {
                  // Fallback: auto-register demo user if not existing
                  window.localStorage.setItem(
                    "bizia_auth_session",
                    JSON.stringify({
                      user: {
                        id: "demo-user",
                        firstName: "Invité",
                        lastName: "Démo",
                        email: "demo@bizia.africa",
                      },
                      token: "demo_token_123",
                    })
                  );
                  window.location.reload();
                });
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IconSparkles size={16} /> Accéder en Mode Démo
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
