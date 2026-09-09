import Link from "next/link";

export default function HomePage() {
  return (
    <section>
      <h1>BizIA</h1>
      <p>Analyste de données IA autonome pour les PME et les entreprises.</p>
      <p className="muted">
        Saisie manuelle et import CSV/Excel alimentent le même pipeline d’analyse.
      </p>
      <div className="card">
        <strong>Parcours MVP</strong>
        <p className="muted">
          Données → nettoyage → analyse → dashboard &amp; alertes → assistant IA → rapport
        </p>
        <p>
          <Link href="/produits">Produits</Link>
          {" · "}
          <Link href="/import">Import</Link>
          {" · "}
          <Link href="/dashboard">Dashboard</Link>
        </p>
      </div>
    </section>
  );
}
