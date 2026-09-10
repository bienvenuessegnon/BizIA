"use client";

import Link from "next/link";
import { DashboardMockup } from "@/components/home/DashboardMockup";
import { IconCheck } from "@/components/icons/IconCheck";
import { useAuth } from "@/contexts/AuthContext";

const FEATURES = [
  "Importez Excel, CSV, PDF, Word et PowerPoint en un clic",
  "Tableaux de bord automatiques et alertes intelligentes",
  "Assistant IA qui connaît votre business",
];

const STATS = [
  { value: "2 min", label: "pour importer et analyser" },
  { value: "10+", label: "formats de fichiers supportés" },
  { value: "98%", label: "de précision sur les prévisions" },
  { value: "500+", label: "entreprises font confiance à BizIA" },
];

const STEPS = [
  {
    n: 1,
    title: "Importez vos fichiers",
    desc: "Excel, PDF, Word, PowerPoint — glissez-déposez vos documents. BizIA les analyse instantanément.",
  },
  {
    n: 2,
    title: "Visualisez vos données",
    desc: "Tableaux de bord, KPIs, graphiques de tendances générés automatiquement selon vos données.",
  },
  {
    n: 3,
    title: "Recevez des recommandations",
    desc: "L'assistant IA analyse les tendances et vous propose des actions concrètes pour votre activité.",
  },
];

export function HomeContent() {
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <div className="landing">
      {/* ── Hero ── */}
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
              BizIA transforme vos ventes, stocks, documents Excel, PDF, Word et PowerPoint en
              indicateurs, alertes et recommandations — avec un assistant IA ancré sur votre activité.
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
                  Bienvenue, <strong>{user.firstName}</strong> !
                </p>
                <div className="landing-hero__buttons">
                  <Link href="/dashboard" className="btn btn--primary btn--lg">
                    Accéder au tableau de bord →
                  </Link>
                  <Link href="/import" className="btn btn--outline btn--lg">
                    Importer mes documents
                  </Link>
                </div>
              </div>
            ) : (
              <div className="landing-hero__cta">
                <div className="landing-hero__buttons">
                  <Link href="/inscription" className="btn btn--primary btn--lg">
                    Commencer gratuitement →
                  </Link>
                  <Link href="/connexion" className="btn btn--outline btn--lg">
                    Déjà un compte ? Se connecter
                  </Link>
                </div>
                <p className="landing-trust">
                  Gratuit pour démarrer · Aucune carte requise · Mise en route en 2 min
                </p>
              </div>
            )}
          </div>

          <div className="landing-hero__visual">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
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

      {/* ── Comment ça marche ── */}
      <section className="landing-steps-section">
        <p className="landing-section-badge">COMMENT ÇA MARCHE</p>
        <h2 className="landing-section-title">Opérationnel en 3 étapes</h2>
        <p className="landing-section-subtitle">
          Pas de configuration complexe. Commencez à obtenir des insights en moins de 5 minutes.
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

      {/* ── CTA Banner ── */}
      <section className="landing-cta-banner">
        <div className="landing-cta-banner__inner">
          <h2>Prêt à piloter votre activité avec l&apos;intelligence artificielle ?</h2>
          <p>
            Rejoignez les PME et entreprises qui prennent des décisions plus rapides,
            plus éclairées, chaque jour.
          </p>
          <div className="landing-cta-banner__buttons">
            <Link href="/inscription" className="btn btn--white btn--lg">
              Créer mon compte gratuitement →
            </Link>
            <Link href="/connexion" className="btn btn--ghost-white btn--lg">
              Se connecter
            </Link>
          </div>
          <p className="landing-cta-banner__note">
            Gratuit pour démarrer · Sans engagement · Annulez à tout moment
          </p>
        </div>
      </section>
    </div>
  );
}
