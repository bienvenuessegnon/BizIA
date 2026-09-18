"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/services/api";
import type { Product } from "@/types";
import { formatCurrency, formatPercent } from "@/utils/format";

import { useAuth } from "@/contexts/AuthContext";

const SAMPLE_PRODUCTS: Product[] = [
  { sku: "LAP-MBA-M2", name: "MacBook Air M2 13", category: "Laptop", unit_cost: 650000, unit_price: 890000, stock_quantity: 4, low_stock_threshold: 5 },
  { sku: "TEL-IP15-PRO", name: "iPhone 15 Pro 256G", category: "Smartphone", unit_cost: 720000, unit_price: 950000, stock_quantity: 3, low_stock_threshold: 5 },
  { sku: "LAP-DELL-XPS", name: "Dell XPS 13 Plus", category: "Laptop", unit_cost: 580000, unit_price: 780000, stock_quantity: 8, low_stock_threshold: 4 },
  { sku: "TAB-IPAD-P11", name: "iPad Pro 11 M4", category: "Tablet", unit_cost: 490000, unit_price: 680000, stock_quantity: 6, low_stock_threshold: 3 },
  { sku: "DOM-HOMEPOD", name: "HomePod Mini Stéréo", category: "Smart Home", unit_cost: 45000, unit_price: 75000, stock_quantity: 12, low_stock_threshold: 5 },
  { sku: "ACC-AP-MAX", name: "AirPods Max Silver", category: "Accessory", unit_cost: 280000, unit_price: 390000, stock_quantity: 2, low_stock_threshold: 3 },
];

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
  const { user } = useAuth();
  const isDemo = user?.email === "demo@bizia.africa";
  const { success: toastSuccess, error: toastError } = useToast();
  const [items, setItems] = useState<Product[]>([]);
  const [form, setForm] = useState<Product>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "ok">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.products.list();
      const loaded = data.items ?? [];
      setItems(loaded.length > 0 ? loaded : (isDemo ? SAMPLE_PRODUCTS : []));
    } catch {
      // Si backend offline, afficher les produits démo uniquement pour le compte démo
      setItems(isDemo ? SAMPLE_PRODUCTS : []);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    load();
  }, [load]);

  // Calcul direct de la marge unitaire
  const unitMargin = form.unit_price - form.unit_cost;
  const unitMarginPct = form.unit_price > 0 ? (unitMargin / form.unit_price) * 100 : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      setError("Le SKU et le nom sont obligatoires.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const newProduct: Product = {
      ...form,
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      category: form.category?.trim() || "Général",
    };

    try {
      await api.products.create(newProduct);
      setSuccess("Produit enregistré avec succès.");
      toastSuccess(`Produit ${newProduct.name} enregistré.`);
      setForm(EMPTY);
      await load();
    } catch {
      // Enregistrement local de repli si le backend est offline
      setItems((prev) => [newProduct, ...prev]);
      setSuccess("Produit enregistré (mode local).");
      toastSuccess(`Produit ${newProduct.name} ajouté.`);
      setForm(EMPTY);
    } finally {
      setSubmitting(false);
    }
  }

  // Catégories uniques pour le filtre
  const categories = useMemo(() => {
    const set = new Set(items.map((p) => p.category || "Général"));
    return ["all", ...Array.from(set)];
  }, [items]);

  // Filtrage des produits
  const filteredProducts = useMemo(() => {
    return items.filter((p) => {
      const s = searchTerm.toLowerCase().trim();
      const matchSearch = !s || p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s);
      const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
      const isLowStock = p.stock_quantity <= p.low_stock_threshold;
      const matchStock = stockFilter === "all" || (stockFilter === "low" && isLowStock) || (stockFilter === "ok" && !isLowStock);
      return matchSearch && matchCategory && matchStock;
    });
  }, [items, searchTerm, categoryFilter, stockFilter]);

  return (
    <AppPageLayout
      eyebrow="Catalogue & Tarifs"
      title="Gestion des Produits"
      description="Saisissez et pilotez vos références, marges brutes et seuils de réapprovisionnement en CFA."
    >
      <div className="page-grid">
        {/* Formulaire de création */}
        <form className="card card--glass form-card" onSubmit={handleSubmit}>
          <div className="form-card__header">
            <h2>Nouveau produit</h2>
            <span className="form-card__badge">Calcul automatique en CFA</span>
          </div>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="form-card__row">
            <Input
              name="sku"
              label="SKU / Référence"
              placeholder="Ex: LAP-MBP-14"
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              required
            />
            <Input
              name="category"
              label="Catégorie"
              placeholder="Ex: Laptop, Smartphone…"
              value={form.category ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>

          <Input
            name="name"
            label="Nom complet du produit"
            placeholder="Ex: MacBook Pro 14 M3"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />

          <div className="form-card__row">
            <Input
              name="unit_cost"
              type="number"
              label="Coût d'achat unitaire (CFA)"
              min={0}
              placeholder="0"
              value={form.unit_cost || ""}
              onChange={(e) => setForm((f) => ({ ...f, unit_cost: Number(e.target.value) }))}
            />
            <Input
              name="unit_price"
              type="number"
              label="Prix de vente public (CFA)"
              min={0}
              placeholder="0"
              value={form.unit_price || ""}
              onChange={(e) => setForm((f) => ({ ...f, unit_price: Number(e.target.value) }))}
            />
          </div>

          {/* Indicateur de marge en direct */}
          <div className="margin-preview-box">
            <div className="margin-preview-item">
              <span className="margin-preview-label">Marge unitaire brute :</span>
              <strong className={unitMargin >= 0 ? "text-success" : "text-error"}>
                {unitMargin >= 0 ? "+" : ""}{formatCurrency(unitMargin)}
              </strong>
            </div>
            <div className="margin-preview-item">
              <span className="margin-preview-label">Taux de marge :</span>
              <strong className={unitMarginPct >= 25 ? "text-success" : unitMarginPct > 0 ? "text-warning" : "text-error"}>
                {formatPercent(unitMarginPct)}
              </strong>
            </div>
          </div>

          <div className="form-card__row">
            <Input
              name="stock_quantity"
              type="number"
              label="Quantité initiale en stock"
              min={0}
              value={form.stock_quantity || ""}
              onChange={(e) => setForm((f) => ({ ...f, stock_quantity: Number(e.target.value) }))}
            />
            <Input
              name="low_stock_threshold"
              type="number"
              label="Seuil d'alerte critique"
              min={0}
              value={form.low_stock_threshold || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, low_stock_threshold: Number(e.target.value) }))
              }
            />
          </div>

          <Button type="submit" loading={submitting} disabled={submitting}>
            Enregistrer dans le catalogue
          </Button>
        </form>

        {/* Liste des produits avec filtres */}
        <div className="card card--glass">
          <div className="products-table-header">
            <div>
              <h2>Catalogue ({filteredProducts.length} articles)</h2>
              <p className="muted">Inventaire actif et niveau de réapprovisionnement</p>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="table-filter-bar">
            <input
              type="text"
              className="table-filter-search"
              placeholder="Rechercher par nom ou SKU…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="table-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filtrer par catégorie"
            >
              <option value="all">Toutes les catégories</option>
              {categories.filter((c) => c !== "all").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="table-filter-select"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              aria-label="Filtrer par stock"
            >
              <option value="all">Tous les stocks</option>
              <option value="low">Stocks faibles uniquement</option>
              <option value="ok">Stocks suffisants</option>
            </select>
          </div>

          {loading ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState
              title="Votre catalogue est vide (0 produit)"
              description="Créez votre premier article via le formulaire ci-dessus ou chargez des produits d'exemple pour explorer."
              action={
                <Button variant="secondary" onClick={() => setItems(SAMPLE_PRODUCTS)}>
                  Activer les produits d&apos;exemple
                </Button>
              }
            />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title="Aucun produit correspondant"
              description="Modifiez vos critères de recherche ou ajoutez un nouveau produit."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Désignation</th>
                    <th>Catégorie</th>
                    <th className="text-right">Coût</th>
                    <th className="text-right">Prix</th>
                    <th className="text-right">Marge</th>
                    <th className="text-center">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const margin = p.unit_price - p.unit_cost;
                    const isLow = p.stock_quantity <= p.low_stock_threshold;
                    return (
                      <tr key={p.id ?? p.sku}>
                        <td>
                          <code className="sku-tag">{p.sku}</code>
                        </td>
                        <td>
                          <strong>{p.name}</strong>
                        </td>
                        <td>
                          <span className="category-chip">{p.category ?? "Général"}</span>
                        </td>
                        <td className="text-right font-mono text-muted">
                          {formatCurrency(p.unit_cost)}
                        </td>
                        <td className="text-right font-mono font-bold">
                          {formatCurrency(p.unit_price)}
                        </td>
                        <td className="text-right font-mono">
                          <span className={margin >= 0 ? "text-success" : "text-error"}>
                            {margin >= 0 ? "+" : ""}{formatCurrency(margin)}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`stock-badge ${isLow ? "stock-badge--low" : "stock-badge--ok"}`}>
                            {p.stock_quantity} {isLow ? "· Alerte !" : ""}
                          </span>
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
