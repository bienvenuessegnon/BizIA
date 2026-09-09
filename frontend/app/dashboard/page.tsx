export default function DashboardPage() {
  return (
    <section>
      <h1>Dashboard</h1>
      <p className="muted">
        KPI, anomalies, prédictions et recommandations — à brancher sur l’API.
      </p>
      <div className="card">Import de fichiers (CSV, Excel, PDF)</div>
      <div className="card">Indicateurs et visualisations</div>
      <div className="card">Alertes et actions recommandées</div>
    </section>
  );
}
