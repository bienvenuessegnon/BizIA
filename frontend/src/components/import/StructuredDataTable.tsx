"use client";

import { useState } from "react";
import { formatCurrency } from "@/utils/format";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { IconSparkles, IconCheckCircle, IconEdit } from "@/components/icons/Icons";

export type StructuredRow = {
  id: string;
  date: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  confidence: number; // e.g. 0.98 for 98%
  status: "verified" | "to_review" | "corrected";
};

const INITIAL_EXTRACTED_DATA: StructuredRow[] = [
  {
    id: "st-1",
    date: "2025-05-14",
    sku: "LAP-MBP-14",
    name: "MacBook Pro 14 M3",
    category: "Laptop",
    quantity: 4,
    unitPrice: 1250000,
    confidence: 0.99,
    status: "verified",
  },
  {
    id: "st-2",
    date: "2025-05-14",
    sku: "TEL-IP15-128",
    name: "iPhone 15 128 Go",
    category: "Smartphone",
    quantity: 8,
    unitPrice: 580000,
    confidence: 0.97,
    status: "verified",
  },
  {
    id: "st-3",
    date: "2025-05-15",
    sku: "TAB-IPAD-AIR",
    name: "iPad Air 11 M2",
    category: "Tablet",
    quantity: 5,
    unitPrice: 420000,
    confidence: 0.89,
    status: "to_review",
  },
  {
    id: "st-4",
    date: "2025-05-15",
    sku: "ACC-AP-PRO2",
    name: "AirPods Pro Gen 2",
    category: "Accessory",
    quantity: 12,
    unitPrice: 165000,
    confidence: 0.96,
    status: "verified",
  },
  {
    id: "st-5",
    date: "2025-05-16",
    sku: "DOM-HOMEPOD",
    name: "HomePod Mini Stéréo",
    category: "Smart Home",
    quantity: 6,
    unitPrice: 75000,
    confidence: 0.92,
    status: "verified",
  },
];

type Props = {
  filename?: string;
  onValidateAll?: () => void;
};

export function StructuredDataTable({
  filename = "document_commercial.xlsx",
  onValidateAll,
}: Props) {
  const { success, info } = useToast();
  const [rows, setRows] = useState<StructuredRow[]>(INITIAL_EXTRACTED_DATA);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StructuredRow>>({});
  const [isValidated, setIsValidated] = useState(false);

  function startEditing(row: StructuredRow) {
    setEditingId(row.id);
    setEditForm({ ...row });
  }

  function saveEditing(id: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            ...editForm,
            status: "corrected",
          } as StructuredRow;
        }
        return r;
      })
    );
    setEditingId(null);
    info("Ligne modifiée et marquée comme corrigée.");
  }

  function handleValidate() {
    setIsValidated(true);
    success(
      `${rows.length} lignes validées avec succès et transmises au moteur d'analyse !`
    );
    if (onValidateAll) onValidateAll();
  }

  function handleAddRow() {
    const newRow: StructuredRow = {
      id: `st-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      sku: "NOUV-SKU",
      name: "Nouvel article",
      category: "Général",
      quantity: 1,
      unitPrice: 10000,
      confidence: 1.0,
      status: "corrected",
    };
    setRows((prev) => [newRow, ...prev]);
    startEditing(newRow);
  }

  const totalCalculated = rows.reduce(
    (acc, curr) => acc + curr.quantity * curr.unitPrice,
    0
  );

  return (
    <div className="card card--glass structured-data-container">
      <div className="structured-data-header">
        <div>
          <div className="structured-data-badge">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <IconSparkles size={14} /> Structuration IA/ML activée
            </span>
          </div>
          <h2>Tableau des données extraites</h2>
          <p className="muted">
            Source : <strong>{filename}</strong> · Vérifiez, modifiez ou validez les
            lignes avant ingestion finale dans vos bases.
          </p>
        </div>

        <div className="structured-data-actions">
          <Button variant="secondary" onClick={handleAddRow} disabled={isValidated}>
            + Ajouter une ligne
          </Button>
          <Button
            onClick={handleValidate}
            disabled={isValidated}
            className={isValidated ? "btn--validated" : ""}
          >
            {isValidated ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IconCheckCircle size={15} /> Données validées
              </span>
            ) : (
              "Valider et intégrer au pipeline"
            )}
          </Button>
        </div>
      </div>

      <div className="table-wrap structured-table-wrap">
        <table className="data-table structured-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>SKU Produit</th>
              <th>Désignation</th>
              <th>Catégorie</th>
              <th className="text-right">Quantité</th>
              <th className="text-right">Prix Unit.</th>
              <th className="text-right">Total HT</th>
              <th className="text-center">Confiance IA</th>
              <th className="text-center">Statut</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isEditing = editingId === row.id;

              if (isEditing) {
                return (
                  <tr key={row.id} className="structured-row--editing">
                    <td>
                      <input
                        type="date"
                        className="input input--inline"
                        value={editForm.date || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, date: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input input--inline"
                        value={editForm.sku || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, sku: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input input--inline"
                        value={editForm.name || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input input--inline"
                        value={editForm.category || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, category: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input input--inline text-right"
                        value={editForm.quantity || 1}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            quantity: Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input input--inline text-right"
                        value={editForm.unitPrice || 0}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            unitPrice: Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td className="text-right font-mono font-bold">
                      {formatCurrency(
                        (editForm.quantity || 0) * (editForm.unitPrice || 0)
                      )}
                    </td>
                    <td className="text-center">
                      <span className="confidence-pill confidence-pill--high">
                        Manuel
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="status-pill status-pill--corrected">
                        Édition
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn--sm btn--primary"
                        onClick={() => saveEditing(row.id)}
                      >
                        OK
                      </button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td className="font-mono font-bold text-primary">{row.sku}</td>
                  <td>{row.name}</td>
                  <td>
                    <span className="category-chip">{row.category}</span>
                  </td>
                  <td className="text-right font-mono">{row.quantity}</td>
                  <td className="text-right font-mono">
                    {formatCurrency(row.unitPrice)}
                  </td>
                  <td className="text-right font-mono font-bold">
                    {formatCurrency(row.quantity * row.unitPrice)}
                  </td>
                  <td className="text-center">
                    <span
                      className={`confidence-pill ${
                        row.confidence >= 0.95
                          ? "confidence-pill--high"
                          : "confidence-pill--mid"
                      }`}
                    >
                      {Math.round(row.confidence * 100)}%
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`status-pill status-pill--${row.status}`}>
                      {row.status === "verified" && "Vérifié"}
                      {row.status === "to_review" && "À revoir"}
                      {row.status === "corrected" && "Corrigé"}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => startEditing(row)}
                      disabled={isValidated}
                      title="Modifier cette ligne"
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <IconEdit size={14} /> Corriger
                      </span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} className="font-bold">
                Total consolidé de l&apos;importation ({rows.length} lignes)
              </td>
              <td className="text-right font-bold font-mono text-primary">
                {formatCurrency(totalCalculated)}
              </td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
