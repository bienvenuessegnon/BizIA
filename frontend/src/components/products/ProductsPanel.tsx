"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/services/api";
import type { Product } from "@/types";
import { formatCurrency } from "@/utils/format";

const EMPTY: Product = {
  sku: "",
  name: "",
  category: "",
  unit_cost: 0,
  unit_price: 0,
  stock_quantity: 0,
  low_stock_threshold: 5,
};

export function ProductsPanel() {
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState<Product>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.products.list();
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les produits.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      setError("Le SKU et le nom sont obligatoires.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.products.create({
        ...form,
        sku: form.sku.trim(),
        name: form.name.trim(),
        category: form.category?.trim() || undefined,
      });
      setSuccess("Produit enregistré avec succès.");
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
      eyebrow="Catalogue"
      title="Produits"
      description="Saisissez vos produits manuellement. Ils alimentent le même pipeline d'analyse que l'import."
    >
      <div className="page-grid">
        <form className="card card--glass form-card" onSubmit={handleSubmit}>
          <h2>Nouveau produit</h2>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Input
            name="sku"
            label="SKU"
            placeholder="HUILE-1L"
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            required
          />
          <Input
            name="name"
            label="Nom"
            placeholder="Huile 1L"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            name="category"
            label="Catégorie"
            placeholder="Épicerie"
            value={form.category ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          />

          <div className="form-card__row">
            <Input
              name="unit_cost"
              type="number"
              label="Coût unitaire (FCFA)"
              min={0}
              value={form.unit_cost || ""}
              onChange={(e) => setForm((f) => ({ ...f, unit_cost: Number(e.target.value) }))}
            />
            <Input
              name="unit_price"
              type="number"
              label="Prix de vente (FCFA)"
              min={0}
              value={form.unit_price || ""}
              onChange={(e) => setForm((f) => ({ ...f, unit_price: Number(e.target.value) }))}
            />
          </div>

          <div className="form-card__row">
            <Input
              name="stock_quantity"
              type="number"
              label="Stock"
              min={0}
              value={form.stock_quantity || ""}
              onChange={(e) => setForm((f) => ({ ...f, stock_quantity: Number(e.target.value) }))}
            />
            <Input
              name="low_stock_threshold"
              type="number"
              label="Seuil d'alerte"
              min={0}
              value={form.low_stock_threshold || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, low_stock_threshold: Number(e.target.value) }))
              }
            />
          </div>

          <Button type="submit" loading={submitting} disabled={submitting}>
            Enregistrer le produit
          </Button>
        </form>

        <div className="card card--glass">
          <h2>Liste des produits</h2>
          {loading ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState
              title="Aucun produit"
              description="Ajoutez votre premier produit ou importez un CSV / Excel."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Prix</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id ?? p.sku}>
                      <td><code>{p.sku}</code></td>
                      <td>{p.name}</td>
                      <td>{p.category ?? "—"}</td>
                      <td>{formatCurrency(p.unit_price)}</td>
                      <td>
                        {p.stock_quantity}
                        {p.stock_quantity <= p.low_stock_threshold && (
                          <span className="table-tag table-tag--warn">Faible</span>
                        )}
                      </td>
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
