"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/utils/format";

export type ProductSales = {
  name: string;
  total: number;
};

type Props = {
  data: ProductSales[];
  title?: string;
};

export function VerticalBarChart({
  data,
  title = "Total vente par nom_produit",
}: Props) {
  const [hoveredProduct, setHoveredProduct] = useState<ProductSales | null>(null);

  const maxVal = useMemo(() => {
    const highest = Math.max(...data.map((d) => d.total), 1);
    return highest;
  }, [data]);

  if (!data.length) {
    return (
      <div className="commercial-chart-card">
        <div className="commercial-chart-card__header">
          <h3 className="commercial-chart-card__title">{title}</h3>
        </div>
        <div style={{ padding: "48px 24px", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>
          Aucun produit vendu pour le moment (0 CFA).
        </div>
      </div>
    );
  }

  return (
    <div className="commercial-chart-card">
      <div className="commercial-chart-card__header">
        <h3 className="commercial-chart-card__title">{title}</h3>
        {hoveredProduct && (
          <span className="commercial-chart-card__tooltip-badge animate-fade-in">
            {hoveredProduct.name}: <strong>{formatCurrency(hoveredProduct.total)}</strong>
          </span>
        )}
      </div>

      <div className="vbar-chart">
        <div className="vbar-chart__bars">
          {data.map((item, idx) => {
            const heightPct = Math.max(8, (item.total / maxVal) * 100);
            const isHovered = hoveredProduct?.name === item.name;

            return (
              <div
                key={`${item.name}-${idx}`}
                className="vbar-chart__col"
                onMouseEnter={() => setHoveredProduct(item)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <div className="vbar-chart__bar-container">
                  <div
                    className={`vbar-chart__bar-fill ${isHovered ? "vbar-chart__bar-fill--hover" : ""}`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="vbar-chart__label" title={item.name}>
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
