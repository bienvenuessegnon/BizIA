"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/services/api";
import type { Sale } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";

type SaleForm = {
  product_sku: string;
  quantity: number;
  unit_price: number;
  sold_at: string;
};

const EMPTY: SaleForm = {
  product_sku: "",
  quantity: 1,
  unit_price: 0,
  sold_at: "",
};

export function SalesPanel() {
  const [items, setItems] = useState<Sale[]>([]);
  const [form, setForm] = useState<SaleForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.sales.list();
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les ventes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.product_sku.trim()) {
      setError("Le SKU produit est obligatoire.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.sales.create({
        product_sku: form.product_sku.trim(),
        quantity: form.quantity,
        unit_price: form.unit_price,
        unit_cost: null,
        sold_at: form.sold_at ? new Date(form.sold_at).toISOString() : null,
        channel: "manual",
      });
      setSuccess("Vente enregistrée avec succès.");
      setForm(EMPTY);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppPageLayout
      eyebrow="Transactions"
      title="Ventes"
      description="Enregistrez vos ventes manuellement. Chaque vente est liée à un SKU produit existant."
    >
      <div className="page-grid">
        <form className="card card--glass form-card" onSubmit={handleSubmit}>
          <h2>Nouvelle vente</h2>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Input
            name="product_sku"
            label="SKU produit"
            placeholder="HUILE-1L"
            value={form.product_sku}
            onChange={(e) => setForm((f) => ({ ...f, product_sku: e.target.value }))}
            required
          />

          <div className="form-card__row">
            <Input
              name="quantity"
              type="number"
              label="Quantité"
              min={1}
              value={form.quantity || ""}
              onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
              required
            />
            <Input
              name="unit_price"
              type="number"
              label="Prix unitaire (€)"
              min={0}
              value={form.unit_price || ""}
              onChange={(e) => setForm((f) => ({ ...f, unit_price: Number(e.target.value) }))}
            />
          </div>

          <Input
            name="sold_at"
            type="datetime-local"
            label="Date de vente (optionnel)"
            value={form.sold_at}
            onChange={(e) => setForm((f) => ({ ...f, sold_at: e.target.value }))}
          />

          <Button type="submit" loading={submitting} disabled={submitting}>
            Enregistrer la vente
          </Button>
        </form>

        <div className="card card--glass">
          <h2>Historique des ventes</h2>
          {loading ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState
              title="Aucune vente"
              description="Enregistrez une vente ou importez un fichier de ventes."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Qté</th>
                    <th>Prix unit.</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s, i) => (
                    <tr key={s.id ?? `${s.product_sku}-${i}`}>
                      <td><code>{s.product_sku}</code></td>
                      <td>{s.quantity}</td>
                      <td>{formatCurrency(s.unit_price)}</td>
                      <td>{formatCurrency(s.quantity * s.unit_price)}</td>
                      <td>{formatDate(s.sold_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppPageLayout>
  );
}
