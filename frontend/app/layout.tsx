import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "BizIA",
  description: "Transformez vos données en décisions intelligentes.",
};

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
            <Link href="/">Accueil</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/chat">Chat</Link>
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
