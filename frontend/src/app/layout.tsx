import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "BizIA",
  description: "Analyste de données IA autonome pour PME.",
};

const links = [
  ["/", "Accueil"],
  ["/produits", "Produits"],
  ["/ventes", "Ventes"],
  ["/import", "Import"],
  ["/dashboard", "Dashboard"],
  ["/chat", "Assistant"],
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <main>
          <nav>
            {links.map(([href, label]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
