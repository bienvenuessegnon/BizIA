"use client";

import Link from "next/link";
import { DashboardMockup } from "@/components/home/DashboardMockup";
import { IconCheck } from "@/components/icons/IconCheck";
import { useAuth } from "@/contexts/AuthContext";

const FEATURES = [
  "Importez un CSV ou un Excel — même pipeline que la saisie manuelle",
  "Tableaux de bord, alertes et classements calculés par le moteur",
  "Assistant IA ancré sur la dernière analyse",
];

const STATS = [
  { value: "CSV / Excel", label: "formats d'import du MVP" },
  { value: "1 pipeline", label: "saisie et import partagent le store" },
  { value: "JSON", label: "rapport exportable aujourd'hui" },
];

const STEPS = [
  {
    n: 1,
    title: "Importez ou saisissez",
    desc: "Catalogue et ventes en CSV/Excel, ou via les formulaires Produits et Ventes.",
  },
  {
    n: 2,
    title: "Lancez l'analyse",
    desc: "Le backend normalise, appelle le moteur ML unique, puis alimente le dashboard.",
  },
  {
    n: 3,
    title: "Décidez avec l'assistant",
    desc: "Posez une question ancrée sur les KPI, alertes et recommandations de cette analyse.",
  },
];

export function HomeContent() {
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero__grid">
          <div className="landing-hero__text">
            <p className="landing-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L6 21l2.3-7-6-4.6h7.6z" />
              </svg>
              Intelligence décisionnelle pour PME &amp; entreprises
            </p>

            <h1 className="landing-hero__title">
              De la donnée brute
              <br />
              à la décision.
            </h1>

            <p className="landing-hero__subtitle">
              BizIA transforme vos ventes et stocks (CSV, Excel ou saisie) en indicateurs, alertes
              et recommandations — avec un assistant ancré sur votre dernière analyse.
            </p>

            <ul className="landing-features">
              {FEATURES.map((f) => (
                <li key={f}>
                  <IconCheck />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {isLoading ? (
              <p className="muted">Chargement…</p>
            ) : isAuthenticated && user ? (
              <div className="landing-hero__cta">
                <p className="landing-welcome">
                  Bienvenue, <strong>{user.firstName}</strong>{" "}
                  <span className="muted">(session serveur sécurisée)</span>
                </p>
                <div className="landing-hero__buttons">
                  <Link href="/dashboard" className="btn btn--primary btn--lg">
                    Accéder au tableau de bord →
                  </Link>
                  <Link href="/import" className="btn btn--outline btn--lg">
                    Importer un CSV / Excel
                  </Link>
                </div>
              </div>
            ) : (
              <div className="landing-hero__cta">
                <div className="landing-hero__buttons">
                  <Link href="/import" className="btn btn--primary btn--lg">
                    Importer mes données →
                  </Link>
                  <Link href="/dashboard" className="btn btn--outline btn--lg">
                    Voir le tableau de bord
                  </Link>
                </div>
                <p className="landing-trust">
                  Créez un compte serveur pour retrouver une session vérifiée.
                </p>
              </div>
            )}
          </div>

          <div className="landing-hero__visual">
            <DashboardMockup />
          </div>
        </div>
      </section>

      <section className="landing-stats">
        <div className="landing-stats__grid">
          {STATS.map((s) => (
            <div key={s.label} className="landing-stat">
              <strong className="landing-stat__value">{s.value}</strong>
              <span className="landing-stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-steps-section">
        <p className="landing-section-badge">COMMENT ÇA MARCHE</p>
        <h2 className="landing-section-title">Opérationnel en 3 étapes</h2>
        <p className="landing-section-subtitle">
          Pas de configuration complexe. Importez, analysez, posez une question.
        </p>

        <div className="landing-steps">
          {STEPS.map((step) => (
            <article key={step.n} className="landing-step">
              <div className="landing-step__number">{step.n}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta-banner">
        <div className="landing-cta-banner__inner">
          <h2>Prêt à relire vos ventes avec un moteur unique ?</h2>
          <p>
            Importez le CSV d&apos;exemple, lancez l&apos;analyse, puis demandez à l&apos;assistant
            quel produit rapporte le plus.
          </p>
          <div className="landing-cta-banner__buttons">
            <Link href="/import" className="btn btn--white btn--lg">
              Aller à l&apos;import →
            </Link>
            <Link href="/chat" className="btn btn--ghost-white btn--lg">
              Ouvrir l&apos;assistant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
