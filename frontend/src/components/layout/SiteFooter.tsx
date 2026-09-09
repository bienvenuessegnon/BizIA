import Link from "next/link";
import { BizIALogo } from "@/components/brand/BizIALogo";

const FOOTER_LINKS = [
  ["/produits", "Produits"],
  ["#", "Tarifs"],
  ["#", "Confidentialité"],
  ["#", "CGU"],
  ["#", "Contact"],
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <Link href="/" className="site-footer__brand">
          <BizIALogo size="sm" showTagline />
        </Link>
        <nav className="site-footer__nav" aria-label="Liens du pied de page">
          {FOOTER_LINKS.map(([href, label]) => (
            <Link key={label} href={href} className="site-footer__link">
              {label}
            </Link>
          ))}
        </nav>
        <p className="site-footer__copy">© {new Date().getFullYear()} BizIA. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
