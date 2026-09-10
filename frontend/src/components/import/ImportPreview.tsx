"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";
import type {
  ImportedProductRow,
  ImportedSaleRow,
  IngestionPreview,
  IngestionResult,
} from "@/types";
import { getApiErrorMessage } from "@/utils/apiError";

type EditableProduct = Omit<
  ImportedProductRow,
  "unit_cost" | "unit_price" | "stock_quantity" | "low_stock_threshold"
> & {
  unit_cost: number | null;
  unit_price: number | null;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
};

type EditableSale = Omit<
  ImportedSaleRow,
  "quantity" | "unit_price" | "unit_cost"
> & {
  quantity: number | null;
  unit_price: number | null;
  unit_cost: number | null;
};

type ImportPreviewProps = {
  preview: IngestionPreview;
  onCancel: () => void;
  onCommitted: (result: IngestionResult) => void;
};

const EMPTY_PRODUCT: EditableProduct = {
  sku: "",
  name: "",
  category: "",
  unit_cost: null,
  unit_price: null,
  stock_quantity: null,
  low_stock_threshold: null,
};

const EMPTY_SALE: EditableSale = {
  product_sku: "",
  quantity: null,
  unit_price: null,
  unit_cost: null,
  sold_at: "",
  channel: null,
};

function productForEdit(row: ImportedProductRow): EditableProduct {
  return {
    ...EMPTY_PRODUCT,
    ...row,
    unit_cost: row.unit_cost ?? null,
    unit_price: row.unit_price ?? null,
    stock_quantity: row.stock_quantity ?? null,
    low_stock_threshold: row.low_stock_threshold ?? null,
  };
}

function saleForEdit(row: ImportedSaleRow): EditableSale {
  return {
    ...EMPTY_SALE,
    ...row,
    quantity: row.quantity ?? null,
    unit_price: row.unit_price ?? null,
    unit_cost: row.unit_cost ?? null,
    sold_at: row.sold_at?.slice(0, 10) ?? "",
  };
}

export function ImportPreview({
  preview,
  onCancel,
  onCommitted,
}: ImportPreviewProps) {
  const router = useRouter();
  const [products, setProducts] = useState<EditableProduct[]>(
    preview.products.map(productForEdit)
  );
  const [sales, setSales] = useState<EditableSale[]>(
    preview.sales.map(saleForEdit)
  );
  const [saving, setSaving] = useState<"save" | "analyze" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lineCount = products.length + sales.length;
  const extractedLabel = useMemo(() => {
    const parts: string[] = [];
    if (products.length) parts.push(`${products.length} produit(s)`);
    if (sales.length) parts.push(`${sales.length} vente(s)`);
    return parts.join(" et ");
  }, [products.length, sales.length]);

  function updateProduct(index: number, patch: Partial<EditableProduct>) {
    setProducts((rows) =>
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
    );
  }

  function updateSale(index: number, patch: Partial<EditableSale>) {
    setSales((rows) =>
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row))
    );
  }

  async function commit(analyze: boolean) {
    const missingProductSku = products.some((row) => !row.sku.trim());
    const invalidSale = sales.some(
      (row) => !row.product_sku.trim() || row.quantity === null || row.quantity <= 0
    );
    if (!lineCount) {
      setError("Ajoutez au moins une ligne avant de confirmer.");
      return;
    }
    if (missingProductSku || invalidSale) {
      setError(
        "Complétez les champs requis : SKU pour chaque produit, produit et quantité positive pour chaque vente."
      );
      return;
    }

    setSaving(analyze ? "analyze" : "save");
    setError(null);
    try {
      const result = await api.commitImport({
        filename: preview.filename,
        source: preview.source,
        products: products.map(cleanProduct),
        sales: sales.map(cleanSale),
      });
      onCommitted(result);
      if (analyze) {
        await api.runAnalysis();
        router.push("/dashboard");
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="card card--glass import-preview">
      <div className="import-preview__head">
        <div>
          <p className="eyebrow">Aperçu avant enregistrement</p>
          <h2>Tableau reconnu dans {preview.filename}</h2>
          <p className="muted">
            {extractedLabel || "Aucune ligne"} reconstruite(s)
            {preview.extraction_method === "gemini"
              ? " par Gemini à partir du document complet."
              : " à partir des colonnes du fichier."}
          </p>
        </div>
        <span
          className={`extraction-badge extraction-badge--${preview.extraction_method}`}
        >
          {preview.extraction_method === "gemini"
            ? "Reconnaissance Gemini"
            : "Lecture structurée"}
        </span>
      </div>

      <Alert variant="info" title="Relisez avant de confirmer">
        Rien n&apos;est encore enregistré. Corrigez ou complétez les cellules,
        ajoutez les lignes manquantes et supprimez celles qui ne figurent pas dans
        le document.
      </Alert>

      {preview.warnings.map((warning, index) => (
        <Alert key={`${warning}-${index}`} variant="warning">
          {warning}
        </Alert>
      ))}
      {error && <Alert variant="error">{error}</Alert>}

      {products.length > 0 && (
        <EditableProducts
          rows={products}
          onChange={updateProduct}
          onRemove={(index) =>
            setProducts((rows) => rows.filter((_, rowIndex) => rowIndex !== index))
          }
        />
      )}

      {sales.length > 0 && (
        <EditableSales
          rows={sales}
          onChange={updateSale}
          onRemove={(index) =>
            setSales((rows) => rows.filter((_, rowIndex) => rowIndex !== index))
          }
        />
      )}

      <div className="import-preview__add">
        <Button
          variant="ghost"
          onClick={() => setSales((rows) => [...rows, { ...EMPTY_SALE }])}
        >
          + Ajouter une vente
        </Button>
        <Button
          variant="ghost"
          onClick={() => setProducts((rows) => [...rows, { ...EMPTY_PRODUCT }])}
        >
          + Ajouter un produit
        </Button>
      </div>

      <div className="import-preview__actions">
        <Button
          onClick={() => commit(false)}
          loading={saving === "save"}
          disabled={saving !== null}
        >
          Enregistrer le tableau
        </Button>
        <Button
          variant="secondary"
          onClick={() => commit(true)}
          loading={saving === "analyze"}
          disabled={saving !== null}
        >
          Enregistrer et analyser
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving !== null}>
          Annuler
        </Button>
      </div>
      <p className="import-preview__action-help muted">
        « Enregistrer et analyser » ouvre directement le dashboard. « Enregistrer le
        tableau » vous permet de poursuivre la saisie avant de lancer l&apos;analyse.
      </p>
    </div>
  );
}

type ProductTableProps = {
  rows: EditableProduct[];
  onChange: (index: number, patch: Partial<EditableProduct>) => void;
  onRemove: (index: number) => void;
};

function EditableProducts({ rows, onChange, onRemove }: ProductTableProps) {
  return (
    <section className="editable-import">
      <h3>Produits reconnus</h3>
      <div className="table-wrap">
        <table className="data-table editable-import__table">
          <thead>
            <tr>
              <th>SKU *</th>
              <th>Nom</th>
              <th>Catégorie</th>
              <th>Coût</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>Seuil</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`product-${index}`}>
                <EditCell
                  value={row.sku}
                  required
                  onChange={(value) => onChange(index, { sku: value })}
                />
                <EditCell
                  value={row.name ?? ""}
                  onChange={(value) => onChange(index, { name: value })}
                />
                <EditCell
                  value={row.category ?? ""}
                  onChange={(value) => onChange(index, { category: value })}
                />
                <NumberCell
                  value={row.unit_cost}
                  onChange={(value) => onChange(index, { unit_cost: value })}
                />
                <NumberCell
                  value={row.unit_price}
                  onChange={(value) => onChange(index, { unit_price: value })}
                />
                <NumberCell
                  value={row.stock_quantity}
                  onChange={(value) => onChange(index, { stock_quantity: value })}
                />
                <NumberCell
                  value={row.low_stock_threshold}
                  onChange={(value) =>
                    onChange(index, { low_stock_threshold: value })
                  }
                />
                <RemoveCell label="Supprimer ce produit" onClick={() => onRemove(index)} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type SaleTableProps = {
  rows: EditableSale[];
  onChange: (index: number, patch: Partial<EditableSale>) => void;
  onRemove: (index: number) => void;
};

function EditableSales({ rows, onChange, onRemove }: SaleTableProps) {
  return (
    <section className="editable-import">
      <h3>Ventes reconnues</h3>
      <div className="table-wrap">
        <table className="data-table editable-import__table">
          <thead>
            <tr>
              <th>Produit / SKU *</th>
              <th>Quantité *</th>
              <th>Prix unitaire</th>
              <th>Coût unitaire</th>
              <th>Date</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`sale-${index}`}>
                <EditCell
                  value={row.product_sku}
                  required
                  onChange={(value) => onChange(index, { product_sku: value })}
                />
                <NumberCell
                  value={row.quantity}
                  required
                  min={0.000001}
                  onChange={(value) => onChange(index, { quantity: value })}
                />
                <NumberCell
                  value={row.unit_price}
                  onChange={(value) => onChange(index, { unit_price: value })}
                />
                <NumberCell
                  value={row.unit_cost}
                  onChange={(value) => onChange(index, { unit_cost: value })}
                />
                <EditCell
                  value={row.sold_at ?? ""}
                  type="date"
                  onChange={(value) => onChange(index, { sold_at: value })}
                />
                <RemoveCell label="Supprimer cette vente" onClick={() => onRemove(index)} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">
        Le prix peut rester vide : BizIA reprendra celui du catalogue lors de
        l&apos;enregistrement.
      </p>
    </section>
  );
}

type EditCellProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "date";
};

function EditCell({
  value,
  onChange,
  required = false,
  type = "text",
}: EditCellProps) {
  return (
    <td>
      <input
        className="table-input"
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </td>
  );
}

type NumberCellProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  required?: boolean;
  min?: number;
};

function NumberCell({
  value,
  onChange,
  required = false,
  min = 0,
}: NumberCellProps) {
  return (
    <td>
      <input
        className="table-input table-input--number"
        type="number"
        min={min}
        step="any"
        value={value ?? ""}
        required={required}
        onChange={(event) =>
          onChange(event.target.value === "" ? null : Number(event.target.value))
        }
      />
    </td>
  );
}

function RemoveCell({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <td>
      <button
        type="button"
        className="table-remove"
        aria-label={label}
        title={label}
        onClick={onClick}
      >
        ×
      </button>
    </td>
  );
}

function cleanProduct(row: EditableProduct): ImportedProductRow {
  return {
    sku: row.sku.trim(),
    ...optionalText("name", row.name),
    ...optionalText("category", row.category),
    ...optionalNumber("unit_cost", row.unit_cost),
    ...optionalNumber("unit_price", row.unit_price),
    ...optionalNumber("stock_quantity", row.stock_quantity),
    ...optionalNumber("low_stock_threshold", row.low_stock_threshold),
  };
}

function cleanSale(row: EditableSale): ImportedSaleRow {
  return {
    product_sku: row.product_sku.trim(),
    quantity: row.quantity as number,
    ...optionalNumber("unit_price", row.unit_price),
    ...optionalNumber("unit_cost", row.unit_cost),
    ...optionalText("sold_at", row.sold_at),
    ...optionalText("channel", row.channel),
  };
}

function optionalText<K extends string>(
  key: K,
  value: string | null | undefined
): Partial<Record<K, string>> {
  const text = value?.trim();
  return text ? ({ [key]: text } as Record<K, string>) : {};
}

function optionalNumber<K extends string>(
  key: K,
  value: number | null | undefined
): Partial<Record<K, number>> {
  return value === null || value === undefined
    ? {}
    : ({ [key]: value } as Record<K, number>);
}
