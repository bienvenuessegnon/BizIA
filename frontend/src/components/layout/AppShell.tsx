"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BizIALogo } from "@/components/brand/BizIALogo";
import { ApiStatusBanner } from "@/components/layout/ApiStatusBanner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/contexts/AuthContext";

const NAV_LINKS = [
  ["/produits", "Produits"],
  ["/ventes", "Ventes"],
  ["/import", "Import"],
  ["/dashboard", "Dashboard"],
  ["/chat", "Assistant"],
] as const;

const AUTH_ROUTES = ["/connexion", "/inscription"];
const PROTECTED_ROUTES = ["/produits", "/ventes", "/import", "/dashboard", "/chat"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthPage = pathname != null && AUTH_ROUTES.includes(pathname);
  const isHome = pathname === "/";
  // Sans compte, l'accueil ne mène qu'à l'inscription : les onglets de
  // l'application n'apparaissent qu'une fois la session ouverte.
  const showNav = !isAuthPage && !isLoading && isAuthenticated;
  const isProtected = pathname != null && PROTECTED_ROUTES.includes(pathname);
  // Le contenu protégé n'est jamais rendu avant que la session soit connue,
  // sinon il apparaîtrait une fraction de seconde avant la redirection.
  const holdProtectedPage = isProtected && (isLoading || !isAuthenticated);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && isProtected) {
      router.replace("/connexion");
    }
  }, [isAuthenticated, isLoading, isProtected, router]);

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header__inner header__inner--landing">
          <Link href="/" className="header__brand" onClick={() => setMenuOpen(false)}>
            <BizIALogo size="md" showTagline />
          </Link>

          {showNav && (
            <nav className="header__links header__links--center" aria-label="Navigation principale">
              {NAV_LINKS.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className={pathname === href ? "header__link header__link--active" : "header__link"}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          <div className="header__right">
            <div className="header__auth">
              {isLoading ? (
                <span className="muted">…</span>
              ) : isAuthenticated && user ? (
                <>
                  <span className="header__user">{user.firstName}</span>
                  <button type="button" className="btn btn--outline btn--sm" onClick={handleLogout}>
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link href="/connexion" className="btn btn--outline btn--sm">
                    Connexion
                  </Link>
                  <Link href="/inscription" className="btn btn--primary btn--sm">
                    Inscription
                  </Link>
                </>
              )}
            </div>

            {showNav && (
              <button
                type="button"
                className="header__menu-btn"
                aria-expanded={menuOpen}
                aria-label="Menu de navigation"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <span /><span /><span />
              </button>
            )}
          </div>
        </div>

        {showNav && (
          <nav
            className={`header__mobile-drawer ${menuOpen ? "header__mobile-drawer--open" : ""}`}
            aria-label="Menu mobile"
          >
            {NAV_LINKS.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={pathname === href ? "header__link header__link--active" : "header__link"}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <ApiStatusBanner />

      <main
        className={`main ${isAuthPage ? "main--auth" : ""} ${isHome ? "main--home main--landing" : "main--app"}`}
      >
        {holdProtectedPage ? (
          <div className="route-guard">
            <Spinner label={isLoading ? "Chargement…" : "Redirection vers la connexion…"} />
          </div>
        ) : (
          children
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
