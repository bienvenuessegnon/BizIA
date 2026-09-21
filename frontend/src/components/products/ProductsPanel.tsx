"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { Spinner } from "@/components/ui/Spinner";
import { useCompany } from "@/contexts/CompanyContext";
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
  const { currentCompany } = useCompany();
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState<Product>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "normal">("all");

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
  }, [load, currentCompany.id]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((p) => {
      if (p.category?.trim()) set.add(p.category.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((p) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query));

      const matchesCat =
        selectedCategory === "all" || (p.category ?? "") === selectedCategory;

      const isLow = p.stock_quantity <= (p.low_stock_threshold ?? 5);
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && isLow) ||
        (stockFilter === "normal" && !isLow);

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [items, searchQuery, selectedCategory, stockFilter]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      setError("La référence et le nom sont obligatoires.");
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
      setSuccess(`Produit ${form.sku.trim()} enregistré pour ${currentCompany.name}.`);
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
      eyebrow={`Catalogue • ${currentCompany.name}`}
      title="Produits"
      description={`Gérez le catalogue de ${currentCompany.name}. Tous les produits et calculs de marges sont strictement cloisonnés à cette entreprise.`}
    >
      <div className="page-grid">
        <form className="card card--glass form-card" onSubmit={handleSubmit}>
          <h2>Nouveau produit</h2>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Input
            name="sku"
            label="Référence"
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
              label={`Coût unitaire (${currentCompany.currency || "FCFA"})`}
              min={0}
              value={form.unit_cost || ""}
              onChange={(e) => setForm((f) => ({ ...f, unit_cost: Number(e.target.value) }))}
            />
            <Input
              name="unit_price"
              type="number"
              label={`Prix de vente (${currentCompany.currency || "FCFA"})`}
              min={0}
              value={form.unit_price || ""}
              onChange={(e) => setForm((f) => ({ ...f, unit_price: Number(e.target.value) }))}
            />
          </div>

          <div className="form-card__row">
            <Input
              name="stock_quantity"
              type="number"
              label="Stock actuel"
              min={0}
              value={form.stock_quantity || ""}
              onChange={(e) => setForm((f) => ({ ...f, stock_quantity: Number(e.target.value) }))}
            />
            <Input
              name="low_stock_threshold"
              type="number"
              label="Seuil d'alerte stock"
              min={0}
              value={form.low_stock_threshold || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, low_stock_threshold: Number(e.target.value) }))
              }
            />
          </div>

          <Button type="submit" loading={submitting} disabled={submitting}>
            Enregistrer dans {currentCompany.name}
          </Button>
        </form>

        <div className="card card--glass">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <h2>Catalogue ({filteredItems.length}/{items.length})</h2>
          </div>

          {/* Barre de recherche et filtres */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <input
              type="text"
              className="field__control"
              placeholder="Rechercher par référence, nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}
            />

            {categories.length > 0 && (
              <select
                className="field__control"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}
              >
                <option value="all">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}

            <select
              className="field__control"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as "all" | "low" | "normal")}
              style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}
            >
              <option value="all">Tous les niveaux de stock</option>
              <option value="low">Stock faible uniquement</option>
              <option value="normal">Stock normal</option>
            </select>
          </div>

          {loading ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState
              title={`Aucun produit pour ${currentCompany.name}`}
              description="Ajoutez votre premier produit pour cette entreprise ou importez un document."
            />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title="Aucun résultat pour cette recherche"
              description="Modifiez vos critères de recherche ou réinitialisez les filtres."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Prix</th>
                    <th>Marge unitaire</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((p) => {
                    const margin = p.unit_price - (p.unit_cost ?? 0);
                    const marginPct = p.unit_price > 0 ? (margin / p.unit_price) * 100 : 0;
                    const isLow = p.stock_quantity <= (p.low_stock_threshold ?? 5);

                    return (
                      <tr key={p.id ?? p.sku}>
                        <td><code>{p.sku}</code></td>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.category ?? "—"}</td>
                        <td>{formatCurrency(p.unit_price, currentCompany.currency || "FCFA")}</td>
                        <td>
                          <span style={{ color: margin < 0 ? "var(--color-danger, #ef4444)" : "var(--color-success, #10b981)", fontWeight: 600 }}>
                            {formatCurrency(margin, currentCompany.currency || "FCFA")}
                          </span>
                          {p.unit_price > 0 && (
                            <span className="muted" style={{ marginLeft: "0.4rem", fontSize: "0.75rem" }}>
                              ({marginPct.toFixed(0)}%)
                            </span>
                          )}
                        </td>
                        <td>
                          {p.stock_quantity}{" "}
                          {isLow && (
                            <span className="table-tag table-tag--warn">Faible</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppPageLayout>
  );
}
