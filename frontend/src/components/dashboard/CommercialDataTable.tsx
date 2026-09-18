"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/utils/format";

export type CommercialRow = {
  id: string;
  firstName: string;
  lastName: string;
  totalSales: number;
  score: number;
};

type Props = {
  rows: CommercialRow[];
};

export function CommercialDataTable({ rows }: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const searchLower = searchTerm.trim().toLowerCase();
      return (
        !searchLower ||
        r.firstName.toLowerCase().includes(searchLower) ||
        r.lastName.toLowerCase().includes(searchLower)
      );
    });
  }, [rows, searchTerm]);

  const totalSum = useMemo(() => {
    return filteredRows.reduce((acc, curr) => acc + curr.totalSales, 0);
  }, [filteredRows]);

  return (
    <div className="commercial-chart-card commercial-table-card">
      <div className="commercial-chart-card__header">
        <div>
          <h3 className="commercial-chart-card__title">Tableau de bord</h3>
          <p className="commercial-chart-card__subtitle">
            Synthèse individuelle et score de performance
          </p>
        </div>
        <input
          type="text"
          className="commercial-table-search"
          placeholder="Rechercher un client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="commercial-table-wrapper">
        <table className="commercial-table">
          <thead>
            <tr>
              <th>prénom</th>
              <th>nom</th>
              <th className="text-right">Total vente</th>
              <th className="text-center">score</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="commercial-table__empty">
                  Aucun résultat trouvé.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.firstName}</td>
                  <td>{row.lastName}</td>
                  <td className="text-right font-mono">
                    {formatCurrency(row.totalSales, { showDecimals: true })}
                  </td>
                  <td className="text-center">
                    <span
                      className={`score-pill ${
                        row.score >= 90
                          ? "score-pill--high"
                          : row.score >= 75
                          ? "score-pill--mid"
                          : "score-pill--low"
                      }`}
                    >
                      {row.score}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="font-bold">
                Total ({filteredRows.length} clients)
              </td>
              <td className="text-right font-bold font-mono">
                {formatCurrency(totalSum, { showDecimals: true })}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
