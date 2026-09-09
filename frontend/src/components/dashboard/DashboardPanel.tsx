"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/services/api";
import type { AnalysisResult } from "@/types";
import { getApiErrorMessage, isNetworkError } from "@/utils/apiError";
import { IconTrending, QuickActionIconSvg, type QuickActionIcon } from "@/components/icons/Icons";
import { formatCurrency, formatPercent } from "@/utils/format";

const KPI_CONFIG = [
  { key: "revenue", label: "Chiffre d'affaires", accent: "blue", format: (v: number) => formatCurrency(v) },
  { key: "cost", label: "Coûts", accent: "slate", format: (v: number) => formatCurrency(v) },
  { key: "profit", label: "Bénéfice", accent: "teal", format: (v: number) => formatCurrency(v) },
  { key: "margin_pct", label: "Marge", accent: "violet", format: (v: number) => formatPercent(v) },
  { key: "units_sold", label: "Unités vendues", accent: "amber", format: (v: number) => String(v) },
  { key: "sales_count", label: "Nombre de ventes", accent: "rose", format: (v: number) => String(v) },
] as const;

const QUICK_ACTIONS: Array<{
  href: string;
  title: string;
  desc: string;
  icon: QuickActionIcon;
}> = [
  { href: "/produits", title: "Ajouter des produits", desc: "Saisie manuelle de votre catalogue", icon: "package" },
  { href: "/ventes", title: "Enregistrer des ventes", desc: "Suivez chaque transaction", icon: "coins" },
  { href: "/import", title: "Importer un document", desc: "Excel, CSV, PDF, Word, PowerPoint", icon: "upload" },
  { href: "/chat", title: "Parler à l'assistant", desc: "Questions sur votre activité", icon: "bot" },
];

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <article className={`kpi-card kpi-card--${accent}`}>
      <div className="kpi-card__glow" aria-hidden="true" />
      <p className="kpi-card__label">{label}</p>
      <p className="kpi-card__value">{value}</p>
      {sub && <p className="kpi-card__sub">{sub}</p>}
    </article>
  );
}

export function DashboardPanel() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [apiOffline, setApiOffline] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await api.summary();
      setResult(data.result);
      setApiOffline(false);
    } catch (err) {
      if (isNetworkError(err)) {
        setApiOffline(true);
        setResult(null);
      } else {
        setActionError(getApiErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  async function handleRunAnalysis() {
    setAnalyzing(true);
    setActionError(null);
    try {
      const data = await api.runAnalysis();
      setResult(data.result);
      setApiOffline(false);
    } catch (err) {
      if (isNetworkError(err)) {
        setApiOffline(true);
      } else {
        setActionError(getApiErrorMessage(err));
      }
    } finally {
      setAnalyzing(false);
    }
  }

  const kpis = result?.kpis;
  const hasData = kpis && (kpis.sales_count > 0 || kpis.revenue > 0);

  return (
    <AppPageLayout
      className="dashboard"
      eyebrow="Vue d'ensemble"
      title="Tableau de bord"
      description="Pilotez votre activité avec des indicateurs clés, tendances et alertes en temps réel."
      actions={
        <>
          <Button onClick={handleRunAnalysis} loading={analyzing} disabled={analyzing || apiOffline}>
            Lancer l&apos;analyse
          </Button>
          <Button variant="secondary" onClick={loadSummary} disabled={loading}>
            Actualiser
          </Button>
        </>
      }
    >
      {actionError && !apiOffline && (
        <Alert variant="warning" title="Analyse indisponible">
          {actionError}
        </Alert>
      )}

      {loading ? (
        <div className="dashboard-loading">
          <Spinner label="Chargement de vos indicateurs…" />
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            {KPI_CONFIG.map(({ key, label, accent, format }) => {
              const raw = kpis ? Number(kpis[key]) : undefined;
              const value = hasData && raw !== undefined ? format(raw) : "—";
              const sub =
                key === "profit" && hasData
                  ? (raw ?? 0) >= 0
                    ? "Performance positive"
                    : "À surveiller"
                  : undefined;
              return (
                <KpiCard
                  key={key}
                  label={label}
                  value={value}
                  sub={sub}
                  accent={accent}
                />
              );
            })}
          </div>

          {!hasData && (
            <div className="dashboard-empty">
              <div className="dashboard-empty__intro card card--glass">
                <div className="dashboard-empty__icon" aria-hidden="true">
                  <IconTrending size={48} />
                </div>
                <h2>{apiOffline ? "En attente du serveur" : "Prêt à analyser vos données"}</h2>
                <p className="muted">
                  {apiOffline
                    ? "Le backend n'est pas démarré. Lancez l'API FastAPI, puis actualisez cette page ou importez vos fichiers."
                    : "Ajoutez des produits et des ventes, puis lancez l'analyse pour remplir ce tableau de bord."}
                </p>
                {!apiOffline && (
                  <Button onClick={handleRunAnalysis} loading={analyzing}>
                    Lancer la première analyse
                  </Button>
                )}
              </div>

              <div className="quick-actions">
                <h3 className="quick-actions__title">Démarrage rapide</h3>
                <div className="quick-actions__grid">
                  {QUICK_ACTIONS.map((action) => (
                    <Link key={action.href} href={action.href} className="quick-action card card--glass">
                      <span className="quick-action__icon" aria-hidden="true">
                        <QuickActionIconSvg name={action.icon} />
                      </span>
                      <div>
                        <strong>{action.title}</strong>
                        <p className="muted">{action.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {hasData && result && (
            <div className="dashboard-sections">
              {result.week_over_week && (
                <div className="card card--glass dashboard-panel">
                  <div className="dashboard-panel__head">
                    <h2>Évolution hebdomadaire</h2>
                    <Badge variant={result.week_over_week.delta >= 0 ? "low" : "high"}>
                      {result.week_over_week.delta >= 0 ? "Hausse" : "Baisse"}
                    </Badge>
                  </div>
                  <div className="wow-stats">
                    <div className="wow-stat">
                      <span className="wow-stat__label">Bénéfice actuel</span>
                      <span className="wow-stat__value">
                        {formatCurrency(result.week_over_week.current_window_profit)}
                      </span>
                    </div>
                    <div className="wow-stat">
                      <span className="wow-stat__label">Variation</span>
                      <span
                        className={`wow-stat__value ${result.week_over_week.delta >= 0 ? "text-success" : "text-error"}`}
                      >
                        {result.week_over_week.delta >= 0 ? "+" : ""}
                        {formatCurrency(result.week_over_week.delta)}
                        {result.week_over_week.delta_pct != null &&
                          ` (${formatPercent(result.week_over_week.delta_pct)})`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="page-grid">
                <div className="card card--glass dashboard-panel">
                  <h2>Top ventes</h2>
                  {result.top_sold.length === 0 ? (
                    <p className="muted">Aucune donnée pour le moment.</p>
                  ) : (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Produit</th>
                            <th>Unités</th>
                            <th>CA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.top_sold.map((p) => (
                            <tr key={p.sku}>
                              <td>{p.name}</td>
                              <td>{p.units_sold}</td>
                              <td>{formatCurrency(p.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="card card--glass dashboard-panel">
                  <h2>Stocks faibles</h2>
                  {result.low_stock.length === 0 ? (
                    <p className="muted">Aucun stock critique détecté.</p>
                  ) : (
                    <ul className="stock-list">
                      {result.low_stock.map((item) => (
                        <li key={item.sku}>
                          <strong>{item.name}</strong>
                          <span className="muted">
                            {item.stock_quantity} restant · seuil {item.low_stock_threshold}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {result.trend.length > 0 && (
                <div className="card card--glass dashboard-panel">
                  <h2>Tendances du chiffre d&apos;affaires</h2>
                  <div className="trend-bars">
                    {result.trend.map((point) => {
                      const max = Math.max(...result.trend.map((t) => t.revenue), 1);
                      const pct = (point.revenue / max) * 100;
                      return (
                        <div key={point.period} className="trend-bar">
                          <div className="trend-bar__fill" style={{ height: `${pct}%` }} />
                          <span className="trend-bar__label">{point.period}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(result.alerts.length > 0 || result.insights.length > 0) && (
                <div className="page-grid">
                  {result.alerts.length > 0 && (
                    <div className="card card--glass dashboard-panel">
                      <h2>Alertes</h2>
                      <ul className="alert-list">
                        {result.alerts.map((a) => (
                          <li key={a.code + a.title}>
                            <Badge variant={a.severity}>{a.severity}</Badge>
                            <div>
                              <strong>{a.title}</strong>
                              <p className="muted">{a.detail}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.insights.length > 0 && (
                    <div className="card card--glass dashboard-panel">
                      <h2>Insights</h2>
                      <ul className="insight-list">
                        {result.insights.map((insight, i) => (
                          <li key={i}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {result.recommendations.length > 0 && (
                <div className="card card--glass dashboard-panel">
                  <h2>Recommandations</h2>
                  <ul className="recommendation-list">
                    {result.recommendations.map((rec, i) => (
                      <li key={i}>
                        <Badge variant={rec.priority}>{rec.priority}</Badge>
                        <div>
                          <strong>{rec.action}</strong>
                          <p className="muted">{rec.why}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </AppPageLayout>
  );
}
