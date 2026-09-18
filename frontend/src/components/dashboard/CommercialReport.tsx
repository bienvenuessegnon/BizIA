"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HorizontalBarChart, type CategorySales } from "./HorizontalBarChart";
import { VerticalBarChart, type ProductSales } from "./VerticalBarChart";
import { MonthlyLineChart, type MonthlyDataPoint } from "./MonthlyLineChart";
import { CommercialDataTable, type CommercialRow } from "./CommercialDataTable";
import { formatCurrency } from "@/utils/format";
import { IconHome } from "@/components/icons/Icons";

// Données initiales
const INITIAL_ROWS: CommercialRow[] = [
  { id: "1", firstName: "Priya", lastName: "Singh", totalSales: 102530.05, score: 80 },
  { id: "2", firstName: "Liam", lastName: "Li", totalSales: 102530.05, score: 90 },
  { id: "3", firstName: "Emily", lastName: "Brown", totalSales: 102530.05, score: 85 },
  { id: "4", firstName: "Aarav", lastName: "Kumar", totalSales: 102530.05, score: 100 },
  { id: "5", firstName: "Mia", lastName: "Johnson", totalSales: 102530.05, score: 70 },
  { id: "6", firstName: "Jane", lastName: "Smith", totalSales: 102530.05, score: 80 },
  { id: "7", firstName: "Li", lastName: "Zheng", totalSales: 102530.05, score: 80 },
  { id: "8", firstName: "Marie", lastName: "Garcia", totalSales: 102530.05, score: 100 },
  { id: "9", firstName: "Michael", lastName: "Miller", totalSales: 102530.05, score: 75 },
  { id: "10", firstName: "Sofia", lastName: "Lopez", totalSales: 102530.05, score: 80 },
  { id: "11", firstName: "Wei", lastName: "Wang", totalSales: 102530.05, score: 80 },
  { id: "12", firstName: "Amadou", lastName: "Koné", totalSales: 145200.0, score: 95 },
  { id: "13", firstName: "Fatou", lastName: "Diop", totalSales: 98400.0, score: 88 },
];

const INITIAL_CATEGORIES: CategorySales[] = [
  { category: "Laptop", total: 480000 },
  { category: "Smartphone", total: 320000 },
  { category: "Tablet", total: 180000 },
  { category: "Smart Home", total: 75000 },
  { category: "Accessory", total: 42000 },
];

const INITIAL_MONTHS: MonthlyDataPoint[] = [
  { month: "Jan", total: 32000 },
  { month: "Fév", total: 21000 },
  { month: "Mar", total: 46000 },
  { month: "Avr", total: 54000 },
  { month: "Mai", total: 36000 },
  { month: "Juin", total: 34000 },
  { month: "Juil", total: 48000 },
  { month: "Août", total: 42000 },
  { month: "Sept", total: 51000 },
  { month: "Oct", total: 58000 },
  { month: "Nov", total: 52000 },
  { month: "Déc", total: 64000 },
];

const INITIAL_PRODUCTS: ProductSales[] = [
  { name: "MacBook Air", total: 185000 },
  { name: "iPhone 15", total: 140000 },
  { name: "Dell XPS", total: 120000 },
  { name: "iPad Pro", total: 110000 },
  { name: "Galaxy S24", total: 95000 },
  { name: "AirPods Pro", total: 65000 },
  { name: "Watch 9", total: 52000 },
  { name: "HomePod", total: 48000 },
  { name: "Clavier Magic", total: 38000 },
  { name: "Souris USB-C", total: 24000 },
  { name: "Câble Fast", total: 18000 },
  { name: "Coque Silicone", total: 12000 },
];

import { useAuth } from "@/contexts/AuthContext";

type Props = {
  companyName?: string;
  onOpenPdf?: () => void;
};

export function CommercialReport({ companyName = "BizIA", onOpenPdf }: Props) {
  const { user } = useAuth();
  const [demoMode, setDemoMode] = useState(user?.email === "demo@bizia.africa");

  const rows = demoMode ? INITIAL_ROWS : [];
  const categories = demoMode ? INITIAL_CATEGORIES : [];
  const months = demoMode ? INITIAL_MONTHS : [];
  const products = demoMode ? INITIAL_PRODUCTS : [];

  // KPIs
  const clientCount = demoMode ? 12 : 0;
  const commandCount = demoMode ? 100 : 0;
  const averageBasket = demoMode ? 1025.3 : 0;
  const totalSales = demoMode ? 102530.05 : 0;

  return (
    <div className="commercial-dashboard" id="commercial-report-print-area">
      {/* Bannière d'état vierge pour nouvel inscrit avec bouton d'activation de démo */}
      {!demoMode ? (
        <div
          className="commercial-empty-intro card card--glass animate-fade-in"
          style={{
            marginBottom: 20,
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            border: "1.5px dashed #cbd5e1",
            borderRadius: 12,
            background: "#ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#e0f2fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0091ff",
                fontWeight: 700,
                fontSize: "1.1rem",
              }}
            >
              0
            </div>
            <div>
              <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "block" }}>
                Tableau de bord vierge (0 données)
              </strong>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Enregistrez vos premières transactions ou activez les données d&apos;exemple pour explorer.
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/import" className="btn btn--primary btn--sm">
              Importer des données
            </Link>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setDemoMode(true)}
            >
              Activer les données d&apos;exemple / Mode Démo
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f0f9ff",
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #bae6fd",
          }}
        >
          <span style={{ fontSize: "0.85rem", color: "#0369a1", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.6-6.2 4.6 2.3-7.3-6.1-4.5h7.6z"/>
            </svg>
            Mode démonstration actif (Données d&apos;exemple affichées)
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ fontSize: "0.82rem", color: "#0284c7", padding: "4px 8px" }}
            onClick={() => setDemoMode(false)}
          >
            Revenir au tableau de bord vierge (0 données)
          </button>
        </div>
      )}

      {/* 1. Bandeau supérieur bleu signature */}
      <div className="commercial-header-banner">
        <div className="commercial-header-banner__left">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            {companyName && (
              <span className="commercial-header-banner__tag">
                {companyName}
              </span>
            )}
          </div>
          <h1 className="commercial-header-banner__title">
            DASHBOARD DE LA PERFORMANCE COMMERCIALE
          </h1>
        </div>

        <div className="commercial-header-banner__right">
          {onOpenPdf && (
            <button
              type="button"
              className="btn btn--white btn--sm no-print"
              onClick={onOpenPdf}
              title="Exporter le rapport PDF"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Exporter PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Les 4 Cartes KPI */}
      <div className="commercial-kpi-row">
        <div className="commercial-kpi-card">
          <span className="commercial-kpi-card__value">{clientCount}</span>
          <span className="commercial-kpi-card__label">Nombre de Clients</span>
        </div>

        <div className="commercial-kpi-card">
          <span className="commercial-kpi-card__value">{commandCount}</span>
          <span className="commercial-kpi-card__label">Nombre de commandes</span>
        </div>

        <div className="commercial-kpi-card">
          <span className="commercial-kpi-card__value">
            {formatCurrency(averageBasket, { showDecimals: true })}
          </span>
          <span className="commercial-kpi-card__label">Panier Moyen</span>
        </div>

        <div className="commercial-kpi-card commercial-kpi-card--primary">
          <span className="commercial-kpi-card__value">
            {formatCurrency(totalSales, { showDecimals: true })}
          </span>
          <span className="commercial-kpi-card__label">Total vente</span>
        </div>
      </div>

      {/* 3. Grille Principale des Visualisations */}
      <div className="commercial-grid">
        {/* Ligne 1 : Catégories à gauche + Tableau des ventes à droite */}
        <div className="commercial-grid__row">
          <div className="commercial-grid__col-6">
            <HorizontalBarChart data={categories} />
          </div>
          <div className="commercial-grid__col-6">
            <CommercialDataTable rows={rows} />
          </div>
        </div>

        {/* Ligne 2 : Ventes par mois à gauche + Ventes par produit à droite */}
        <div className="commercial-grid__row">
          <div className="commercial-grid__col-5">
            <MonthlyLineChart data={months} />
          </div>
          <div className="commercial-grid__col-7">
            <VerticalBarChart data={products} />
          </div>
        </div>
      </div>
    </div>
  );
}
