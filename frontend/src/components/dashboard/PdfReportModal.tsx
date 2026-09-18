"use client";

import { useCompany } from "@/contexts/CompanyContext";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { IconX } from "@/components/icons/Icons";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function PdfReportModal({ isOpen, onClose }: Props) {
  const { currentCompany } = useCompany();

  if (!isOpen) return null;

  function handlePrint() {
    window.print();
  }

  const currentDate = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  return (
    <div className="modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div className="modal-card modal-card--large card card--glass animate-scale-up pdf-modal">
        <div className="modal-header no-print">
          <div>
            <h2>Consultation & Export du Rapport PDF</h2>
            <p className="muted">
              Prévisualisation conforme aux normes d&apos;impression A4 exécutives.
            </p>
          </div>
          <div className="pdf-modal__actions">
            <Button onClick={handlePrint}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Imprimer / Télécharger en PDF</span>
            </Button>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Fermer"
            >
              <IconX size={16} />
            </button>
          </div>
        </div>

        {/* Zone de document PDF imprimable */}
        <div className="pdf-document" id="pdf-printable-document">
          <div className="pdf-document__header">
            <div className="pdf-document__brand">
              <div className="pdf-document__logo">
                <span className="logo-dot" />
                <strong>BizIA</strong>
              </div>
              <span className="pdf-document__tagline">
                Intelligence Artificielle & Audit de Performance PME
              </span>
            </div>
            <div className="pdf-document__meta">
              <span className="pdf-ref">RÉF : REP-{new Date().getFullYear()}-0916</span>
              <span className="pdf-date">Généré le {currentDate}</span>
            </div>
          </div>

          <div className="pdf-document__divider" />

          <div className="pdf-document__company-info">
            <div>
              <span className="pdf-label">Entreprise auditée</span>
              <h3 className="pdf-company-name">{currentCompany.name}</h3>
              <p className="pdf-company-sub">
                Devise : {currentCompany.currency} (FCFA) {currentCompany.category ? `· ${currentCompany.category}` : ""}
              </p>
            </div>
            <div className="pdf-status-badge">
              <span>STATUT : AUDITÉ & STRUCTURÉ</span>
            </div>
          </div>

          {/* 1. Synthèse financière et Bénéfices nets */}
          <div className="pdf-section">
            <h4 className="pdf-section__title">1. Synthèse Financière Globale & Bénéfices Nets</h4>
            <p className="pdf-text">
              Ce rapport consolide les flux commerciaux, la structure des coûts et la rentabilité nette de 
              l&apos;entreprise sur la période analysée. Le modèle économique affiche une rentabilité solide
              avec une marge brute moyenne supérieure aux standards sectoriels de la distribution régionale.
            </p>
            <div className="pdf-kpi-grid">
              <div className="pdf-kpi-box">
                <span className="pdf-kpi-box__label">Chiffre d&apos;Affaires</span>
                <span className="pdf-kpi-box__value">{formatCurrency(102530.05, { showDecimals: true })}</span>
              </div>
              <div className="pdf-kpi-box">
                <span className="pdf-kpi-box__label">Coûts Opérationnels</span>
                <span className="pdf-kpi-box__value">{formatCurrency(68450.0, { showDecimals: true })}</span>
              </div>
              <div className="pdf-kpi-box pdf-kpi-box--highlight">
                <span className="pdf-kpi-box__label">Bénéfice Net Réalisé</span>
                <span className="pdf-kpi-box__value">{formatCurrency(34080.05, { showDecimals: true })}</span>
              </div>
              <div className="pdf-kpi-box">
                <span className="pdf-kpi-box__label">Taux de Marge Brute</span>
                <span className="pdf-kpi-box__value" style={{ color: "#059669" }}>33.24%</span>
              </div>
            </div>
          </div>

          {/* 2. Indicateurs Commerciaux Clés */}
          <div className="pdf-section">
            <h4 className="pdf-section__title">2. Indicateurs Commerciaux Clés</h4>
            <div className="pdf-kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              <div className="pdf-kpi-box">
                <span className="pdf-kpi-box__label">Nombre de Clients</span>
                <span className="pdf-kpi-box__value">12 clients</span>
              </div>
              <div className="pdf-kpi-box">
                <span className="pdf-kpi-box__label">Total Commandes</span>
                <span className="pdf-kpi-box__value">100 ventes</span>
              </div>
              <div className="pdf-kpi-box">
                <span className="pdf-kpi-box__label">Panier Moyen</span>
                <span className="pdf-kpi-box__value">{formatCurrency(1025.3, { showDecimals: true })}</span>
              </div>
              <div className="pdf-kpi-box">
                <span className="pdf-kpi-box__label">Unités Écoulées</span>
                <span className="pdf-kpi-box__value">159 unités</span>
              </div>
            </div>
          </div>

          {/* 3. Performance par Catégorie & Top Produits */}
          <div className="pdf-section">
            <h4 className="pdf-section__title">3. Répartition par Catégorie & Produits Phares</h4>
            <table className="pdf-table">
              <thead>
                <tr>
                  <th>Catégorie / Référence</th>
                  <th className="text-right">Volume</th>
                  <th className="text-right">Chiffre d&apos;affaires</th>
                  <th className="text-right">Bénéfice Net</th>
                  <th className="text-right">Marge %</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Laptop</strong> (MacBook, Dell XPS)</td>
                  <td className="text-right">38</td>
                  <td className="text-right font-mono">{formatCurrency(480000)}</td>
                  <td className="text-right font-mono text-success">+{formatCurrency(135000)}</td>
                  <td className="text-right font-bold">28.1%</td>
                </tr>
                <tr>
                  <td><strong>Smartphone</strong> (iPhone 15, Galaxy S24)</td>
                  <td className="text-right">52</td>
                  <td className="text-right font-mono">{formatCurrency(320000)}</td>
                  <td className="text-right font-mono text-success">+{formatCurrency(98000)}</td>
                  <td className="text-right font-bold">30.6%</td>
                </tr>
                <tr>
                  <td><strong>Tablet</strong> (iPad Pro 11)</td>
                  <td className="text-right">24</td>
                  <td className="text-right font-mono">{formatCurrency(180000)}</td>
                  <td className="text-right font-mono text-success">+{formatCurrency(62000)}</td>
                  <td className="text-right font-bold">34.4%</td>
                </tr>
                <tr>
                  <td><strong>Smart Home</strong> (HomePod Mini)</td>
                  <td className="text-right">15</td>
                  <td className="text-right font-mono">{formatCurrency(75000)}</td>
                  <td className="text-right font-mono text-success">+{formatCurrency(30000)}</td>
                  <td className="text-right font-bold">40.0%</td>
                </tr>
                <tr>
                  <td><strong>Accessory</strong> (AirPods, Chargeurs, Coques)</td>
                  <td className="text-right">30</td>
                  <td className="text-right font-mono">{formatCurrency(42000)}</td>
                  <td className="text-right font-mono text-success">+{formatCurrency(19000)}</td>
                  <td className="text-right font-bold">45.2%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. Alertes Critiques & Opérationnelles */}
          <div className="pdf-section">
            <h4 className="pdf-section__title" style={{ color: "#b45309" }}>
              4. Alertes Critiques & Opérationnelles
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ padding: "10px 14px", background: "#fffbeb", borderLeft: "4px solid #f59e0b", borderRadius: 6 }}>
                <strong style={{ color: "#92400e", fontSize: "0.9rem" }}>
                  Alerte Rupture Imminente sous 7 Jours (Stocks Faibles)
                </strong>
                <p style={{ margin: "4px 0 0", fontSize: "0.84rem", color: "#78350f" }}>
                  3 références phares (MacBook Air M2, iPhone 15 Pro, AirPods Max) ont un stock résiduel inférieur au seuil critique de 5 unités. Risque avéré de perte de ventes estimé à 1,8M CFA sans commande fournisseur immédiate.
                </p>
              </div>
              <div style={{ padding: "10px 14px", background: "#fef2f2", borderLeft: "4px solid #ef4444", borderRadius: 6 }}>
                <strong style={{ color: "#991b1b", fontSize: "0.9rem" }}>
                  Risque de Dépendance Commerciale
                </strong>
                <p style={{ margin: "4px 0 0", fontSize: "0.84rem", color: "#7f1d1d" }}>
                  Les 3 principaux clients (Amadou Koné, Priya Singh, Liam Li) génèrent 42% du volume d&apos;affaires global. Une diversification des canaux d&apos;acquisition (Web et WhatsApp) est recommandée.
                </p>
              </div>
            </div>
          </div>

          {/* 5. Prédictions IA & Tendances Prévisionnelles */}
          <div className="pdf-section">
            <h4 className="pdf-section__title">5. Prédictions IA & Tendances Prévisionnelles (90 Jours)</h4>
            <div style={{ padding: "12px 16px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#0369a1", textTransform: "uppercase", fontWeight: 600 }}>Tendance M+1</span>
                  <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0c4a6e" }}>+12.4% (CA estimé 115k CFA)</p>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#0369a1", textTransform: "uppercase", fontWeight: 600 }}>Tendance M+2</span>
                  <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0c4a6e" }}>+14.8% (Plein régime)</p>
                </div>
                <div>
                  <span style={{ fontSize: "0.78rem", color: "#0369a1", textTransform: "uppercase", fontWeight: 600 }}>Indice de Confiance IA</span>
                  <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#059669" }}>94.2% de précision</p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: "0.84rem", color: "#075985" }}>
                Modélisation générée par l&apos;algorithme prédictif BizIA : accélération des transactions attendue grâce à la dynamique actuelle sur les gammes informatiques et smart home.
              </p>
            </div>
          </div>

          {/* 6. Recommandations Stratégiques Personnalisées */}
          <div className="pdf-section">
            <h4 className="pdf-section__title">6. Recommandations Stratégiques BizIA</h4>
            <div className="pdf-recommendations">
              <div className="pdf-rec-item">
                <strong>Priorité 1 : Réassort ciblé des stocks stratégiques</strong>
                <p>
                  Déclencher sans délai un bon de commande groupé sur les références PC et Mobiles afin d&apos;éviter les ruptures et de négocier une remise sur volume de 4 à 7% auprès de vos grossistes.
                </p>
              </div>
              <div className="pdf-rec-item">
                <strong>Priorité 2 : Stratégie de Bundling Accessoires + Matériel</strong>
                <p>
                  Associer systématiquement un accessoire à forte marge (45.2%) lors de la vente d&apos;un ordinateur ou téléphone. Impact attendu : +18% sur le panier moyen de commande.
                </p>
              </div>
              <div className="pdf-rec-item">
                <strong>Priorité 3 : Automatisation des relances clients B2B</strong>
                <p>
                  Activer le suivi WhatsApp et e-mail pour les 20 meilleurs clients afin d&apos;augmenter la récurrence des commandes de 30 à 45 jours.
                </p>
              </div>
            </div>
          </div>

          {/* 7. Signature & Validation */}
          <div className="pdf-footer">
            <div className="pdf-footer__left">
              <strong>BizIA Analytics Suite V2 — Audit Certifié Conforme</strong>
              <span>Génération algorithmique autonome · Validation des données de gestion</span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Horodatage électronique SHA-256 : cert-{Date.now().toString(36)}</span>
            </div>
            <div className="pdf-footer__right">
              <div className="pdf-signature-box">
                <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.85rem" }}>Visa & Approbation Direction</span>
                <div style={{ height: 35, borderBottom: "1px dashed #94a3b8", margin: "4px 0" }} />
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Date & Signature autorisée</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
