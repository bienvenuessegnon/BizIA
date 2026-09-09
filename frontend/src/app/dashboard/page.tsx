export default function DashboardPage() {
  return (
    <section>
      <h1>Dashboard</h1>
      <p className="muted">
        Indicateurs, graphiques et alertes — à construire (Imma), via
        <code> api.runAnalysis</code> et <code>api.summary</code>.
      </p>
      <div className="card">CA, bénéfice, marges</div>
      <div className="card">Tendances et graphiques</div>
      <div className="card">Stocks faibles, anomalies, alertes</div>
    </section>
  );
}
