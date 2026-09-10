import Link from "next/link";
import { BizIALogo } from "@/components/brand/BizIALogo";

const CONTACT_EMAIL = "contact@bizia.app";

const NAVIGATION = [
  ["/produits", "Produits"],
  ["/ventes", "Ventes"],
  ["/import", "Import & export"],
  ["/dashboard", "Tableau de bord"],
  ["/chat", "Assistant"],
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand-col">
          <Link href="/" className="site-footer__brand">
            <BizIALogo size="sm" showTagline />
          </Link>
          <p className="site-footer__pitch">
            Transformez vos ventes et vos stocks en indicateurs clairs, alertes utiles
            et conseils concrets.
          </p>
        </div>

        <nav className="site-footer__col" aria-labelledby="footer-nav-title">
          <h2 id="footer-nav-title" className="site-footer__col-title">
            Naviguer
          </h2>
          <ul className="site-footer__list">
            {NAVIGATION.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="site-footer__link">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-footer__col">
          <h2 className="site-footer__col-title">Besoin d&apos;aide ?</h2>
          <ul className="site-footer__list">
            <li>
              <Link href="/import" className="site-footer__link">
                Importer un fichier
              </Link>
            </li>
            <li>
              <Link href="/chat" className="site-footer__link">
                Poser une question à l&apos;assistant
              </Link>
            </li>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="site-footer__link">
                Nous écrire
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom">
        <p className="site-footer__copy">
          © {new Date().getFullYear()} BizIA. Tous droits réservés.
        </p>
        <p className="site-footer__copy">Conçu pour les PME et entreprises.</p>
      </div>
    </footer>
  );
}
