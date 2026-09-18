"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/utils/format";

export type CategorySales = {
  category: string;
  total: number;
};

type Props = {
  data: CategorySales[];
  title?: string;
};

export function HorizontalBarChart({
  data,
  title = "Total vente par catégorie_produit",
}: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxVal = useMemo(() => {
    const highest = Math.max(...data.map((d) => d.total), 1);
    return Math.ceil(highest / 100000) * 100000 || 500000;
  }, [data]);

  const ticks = [0, 100000, 200000, 300000, 400000, 500000].filter(
    (t) => t <= maxVal * 1.1
  );

  if (!data.length) {
    return (
      <div className="commercial-chart-card">
        <div className="commercial-chart-card__header">
          <h3 className="commercial-chart-card__title">{title}</h3>
        </div>
        <div style={{ padding: "48px 24px", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>
          Aucune catégorie enregistrée pour le moment (0 CFA).
        </div>
      </div>
    );
  }

  return (
    <div className="commercial-chart-card">
      <div className="commercial-chart-card__header">
        <h3 className="commercial-chart-card__title">{title}</h3>
      </div>

      <div className="hbar-chart">
        <div className="hbar-chart__rows">
          {data.map((item, index) => {
            const pct = Math.min(100, Math.max(3, (item.total / maxVal) * 100));
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={item.category}
                className="hbar-chart__row"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="hbar-chart__label" title={item.category}>
                  {item.category}
                </div>
                <div className="hbar-chart__bar-track">
                  <div
                    className={`hbar-chart__bar-fill ${isHovered ? "hbar-chart__bar-fill--hover" : ""}`}
                    style={{ width: `${pct}%` }}
                  >
                    <span className="hbar-chart__value-inside">
                      {pct > 30 ? formatCurrency(item.total) : ""}
                    </span>
                  </div>
                  {pct <= 30 && (
                    <span className="hbar-chart__value-outside">
                      {formatCurrency(item.total)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Graduation de l'axe X */}
        <div className="hbar-chart__axis">
          <div className="hbar-chart__axis-spacer" />
          <div className="hbar-chart__axis-ticks">
            {ticks.map((tick) => (
              <span key={tick} className="hbar-chart__tick">
                {tick === 0 ? "0 CFA" : `${tick / 1000}k CFA`}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
