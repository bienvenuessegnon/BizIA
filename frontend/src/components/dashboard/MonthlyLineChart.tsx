"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/utils/format";

export type MonthlyDataPoint = {
  month: string;
  total: number;
};

type Props = {
  data: MonthlyDataPoint[];
  title?: string;
};

export function MonthlyLineChart({
  data,
  title = "Total vente par Mois",
}: Props) {
  const [hoveredPoint, setHoveredPoint] = useState<MonthlyDataPoint | null>(null);

  const { points, pathD, areaD, maxVal, minVal } = useMemo(() => {
    if (!data.length) {
      return { points: [], pathD: "", areaD: "", maxVal: 100, minVal: 0 };
    }

    const values = data.map((d) => d.total);
    const max = Math.max(...values) * 1.15;
    const min = Math.max(0, Math.min(...values) * 0.85);

    const width = 500;
    const height = 180;
    const paddingX = 35;
    const paddingY = 20;

    const innerW = width - paddingX * 2;
    const innerH = height - paddingY * 2;

    const coords = data.map((d, i) => {
      const x = paddingX + (i / (data.length - 1 || 1)) * innerW;
      const normalizedY = (d.total - min) / (max - min || 1);
      const y = height - paddingY - normalizedY * innerH;
      return { x, y, data: d };
    });

    const dPath = coords.reduce(
      (acc, curr, idx) => (idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`),
      ""
    );

    const firstX = coords[0]?.x ?? paddingX;
    const lastX = coords[coords.length - 1]?.x ?? width - paddingX;
    const bottomY = height - paddingY;
    const dArea = `${dPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

    return { points: coords, pathD: dPath, areaD: dArea, maxVal: max, minVal: min };
  }, [data]);

  if (!data.length) {
    return (
      <div className="commercial-chart-card">
        <div className="commercial-chart-card__header">
          <h3 className="commercial-chart-card__title">{title}</h3>
        </div>
        <div style={{ padding: "48px 24px", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>
          Aucune tendance mensuelle disponible (0 CFA).
        </div>
      </div>
    );
  }

  return (
    <div className="commercial-chart-card">
      <div className="commercial-chart-card__header">
        <h3 className="commercial-chart-card__title">{title}</h3>
        {hoveredPoint && (
          <span className="commercial-chart-card__tooltip-badge animate-fade-in">
            {hoveredPoint.month}: <strong>{formatCurrency(hoveredPoint.total)}</strong>
          </span>
        )}
      </div>

      <div className="line-chart">
        <svg viewBox="0 0 500 180" className="line-chart__svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Lignes de repère horizontales */}
          <line x1="35" y1="30" x2="475" y2="30" stroke="rgba(203, 213, 225, 0.4)" strokeDasharray="3 3" />
          <line x1="35" y1="85" x2="475" y2="85" stroke="rgba(203, 213, 225, 0.4)" strokeDasharray="3 3" />
          <line x1="35" y1="140" x2="475" y2="140" stroke="rgba(203, 213, 225, 0.4)" strokeDasharray="3 3" />

          {/* Surface en dégradé */}
          {areaD && <path d={areaD} fill="url(#lineGrad)" />}

          {/* Ligne principale */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points interactifs */}
          {points.map((pt, i) => {
            const isHovered = hoveredPoint?.month === pt.data.month;
            return (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? "#0284c7" : "#38bdf8"}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="line-chart__dot"
                  onMouseEnter={() => setHoveredPoint(pt.data)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Labels des mois sur l'axe X */}
        <div className="line-chart__labels">
          {data.map((d) => (
            <span
              key={d.month}
              className={`line-chart__label ${hoveredPoint?.month === d.month ? "line-chart__label--active" : ""}`}
            >
              {d.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
