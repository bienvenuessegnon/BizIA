export function DashboardMockup() {
  const bars = [40, 55, 45, 70, 60, 85];

  return (
    <div className="dash-mockup" aria-hidden="true">
      <div className="dash-mockup__window">
        <div className="dash-mockup__titlebar">
          <span className="dash-mockup__dots">
            <span /><span /><span />
          </span>
          <span className="dash-mockup__title">BizIA — Dashboard</span>
        </div>
        <div className="dash-mockup__body">
          <div className="dash-mockup__kpis">
            <div className="dash-mockup__kpi">
              <span className="dash-mockup__kpi-label">Chiffre d&apos;affaires</span>
              <strong>57 700 FCFA</strong>
              <span className="dash-mockup__kpi-trend dash-mockup__kpi-trend--up">+12%</span>
            </div>
            <div className="dash-mockup__kpi">
              <span className="dash-mockup__kpi-label">Commandes</span>
              <strong>438</strong>
              <span className="dash-mockup__kpi-trend dash-mockup__kpi-trend--up">+8%</span>
            </div>
            <div className="dash-mockup__kpi">
              <span className="dash-mockup__kpi-label">Stock alerte</span>
              <strong>7</strong>
              <span className="dash-mockup__kpi-trend dash-mockup__kpi-trend--down">-3</span>
            </div>
          </div>
          <div className="dash-mockup__chart">
            <p className="dash-mockup__chart-title">Ventes — 6 derniers mois</p>
            <div className="dash-mockup__bars">
              {bars.map((h, i) => (
                <div key={i} className="dash-mockup__bar" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dash-mockup__alert">
        <span className="dash-mockup__alert-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L6 21l2.3-7-6-4.6h7.6z" />
          </svg>
        </span>
        <p>
          Rupture de stock prévue pour <strong>Réf. A-042</strong> dans 8 jours.
          Recommander une commande fournisseur.
        </p>
      </div>
    </div>
  );
}
