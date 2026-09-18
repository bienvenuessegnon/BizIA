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
import type { Sale, Product } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";

const AVAILABLE_PRODUCTS: Array<{ sku: string; name: string; price: number; category: string }> = [
  { sku: "LAP-MBA-M2", name: "MacBook Air M2 13", price: 890000, category: "Laptop" },
  { sku: "TEL-IP15-PRO", name: "iPhone 15 Pro 256G", price: 950000, category: "Smartphone" },
  { sku: "LAP-DELL-XPS", name: "Dell XPS 13 Plus", price: 780000, category: "Laptop" },
  { sku: "TAB-IPAD-P11", name: "iPad Pro 11 M4", price: 680000, category: "Tablet" },
  { sku: "DOM-HOMEPOD", name: "HomePod Mini Stéréo", price: 75000, category: "Smart Home" },
  { sku: "ACC-AP-MAX", name: "AirPods Max Silver", price: 390000, category: "Accessory" },
];

const SAMPLE_SALES: Sale[] = [
  { id: "s-1", product_sku: "LAP-MBA-M2", quantity: 2, unit_price: 890000, sold_at: "2025-05-16T14:30:00Z", channel: "Boutique" },
  { id: "s-2", product_sku: "TEL-IP15-PRO", quantity: 1, unit_price: 950000, sold_at: "2025-05-16T11:15:00Z", channel: "Web" },
  { id: "s-3", product_sku: "TAB-IPAD-P11", quantity: 3, unit_price: 680000, sold_at: "2025-05-15T16:45:00Z", channel: "B2B" },
  { id: "s-4", product_sku: "DOM-HOMEPOD", quantity: 4, unit_price: 75000, sold_at: "2025-05-15T09:20:00Z", channel: "Boutique" },
  { id: "s-5", product_sku: "ACC-AP-MAX", quantity: 1, unit_price: 390000, sold_at: "2025-05-14T17:10:00Z", channel: "WhatsApp" },
  { id: "s-6", product_sku: "LAP-DELL-XPS", quantity: 1, unit_price: 780000, sold_at: "2025-05-14T10:05:00Z", channel: "B2B" },
];

import { useAuth } from "@/contexts/AuthContext";

type SaleForm = {
  product_sku: string;
  quantity: number;
  unit_price: number;
  sold_at: string;
  channel: string;
};

const EMPTY: SaleForm = {
  product_sku: "",
  quantity: 1,
  unit_price: 0,
  sold_at: "",
  channel: "Boutique",
};

export function SalesPanel() {
  const { user } = useAuth();
  const isDemo = user?.email === "demo@bizia.africa";
  const { success: toastSuccess } = useToast();
  const [items, setItems] = useState<Sale[]>([]);
  const [products, setProducts] = useState(AVAILABLE_PRODUCTS);
  const [form, setForm] = useState<SaleForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.sales.list();
      const loaded = data.items ?? [];
      setItems(loaded.length > 0 ? loaded : (isDemo ? SAMPLE_SALES : []));

      // Charger aussi les vrais produits si dispos
      const prodData = await api.products.list().catch(() => ({ items: [] }));
      if (prodData.items && prodData.items.length > 0) {
        setProducts(
          prodData.items.map((p) => ({
            sku: p.sku,
            name: p.name,
            price: p.unit_price,
            category: p.category || "Général",
          }))
        );
      }
    } catch {
      setItems(isDemo ? SAMPLE_SALES : []);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    load();
  }, [load]);

  // Sélection rapide d'un produit dans le catalogue
  function handleSelectProduct(sku: string) {
    const selected = products.find((p) => p.sku === sku);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        product_sku: selected.sku,
        unit_price: selected.price,
      }));
    } else {
      setForm((prev) => ({ ...prev, product_sku: sku }));
    }
  }

  // Calcul du montant total de la vente
  const totalAmount = (form.quantity || 0) * (form.unit_price || 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.product_sku.trim()) {
      setError("Le SKU produit est obligatoire.");
      return;
    }
    if (form.quantity <= 0) {
      setError("La quantité doit être supérieure à 0.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const newSale: Sale = {
      product_sku: form.product_sku.trim().toUpperCase(),
      quantity: form.quantity,
      unit_price: form.unit_price,
      unit_cost: null,
      sold_at: form.sold_at ? new Date(form.sold_at).toISOString() : new Date().toISOString(),
      channel: form.channel,
    };

    try {
      await api.sales.create(newSale);
      setSuccess("Vente enregistrée avec succès.");
      toastSuccess(`Vente enregistrée : ${formatCurrency(totalAmount)}`);
      setForm(EMPTY);
      await load();
    } catch {
      // Sauvegarde locale de secours
      setItems((prev) => [{ ...newSale, id: `s-${Date.now()}` }, ...prev]);
      setSuccess("Vente enregistrée (mode local).");
      toastSuccess(`Vente ajoutée : ${formatCurrency(totalAmount)}`);
      setForm(EMPTY);
    } finally {
      setSubmitting(false);
    }
  }

  // Filtrage des ventes
  const filteredSales = useMemo(() => {
    return items.filter((s) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || s.product_sku.toLowerCase().includes(q) || (s.channel && s.channel.toLowerCase().includes(q));
      const matchChannel = channelFilter === "all" || s.channel === channelFilter;
      return matchSearch && matchChannel;
    });
  }, [items, searchTerm, channelFilter]);

  // Total des ventes filtrées
  const cumulativeSales = useMemo(() => {
    return filteredSales.reduce((acc, curr) => acc + curr.quantity * curr.unit_price, 0);
  }, [filteredSales]);

  return (
    <AppPageLayout
      eyebrow="Transactions & Recettes"
      title="Enregistrement des Ventes"
      description="Saisissez et suivez vos ventes en temps réel par canal d'acquisition en CFA."
    >
      <div className="page-grid">
        {/* Formulaire de saisie */}
        <form className="card card--glass form-card" onSubmit={handleSubmit}>
          <div className="form-card__header">
            <h2>Nouvelle transaction</h2>
            <span className="form-card__badge">Devise CFA</span>
          </div>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* Choix rapide depuis le catalogue */}
          <div className="form-field">
            <label className="form-label" htmlFor="catalog-select">
              Sélectionner un produit du catalogue
            </label>
            <select
              id="catalog-select"
              className="input input--select"
              value={form.product_sku}
              onChange={(e) => handleSelectProduct(e.target.value)}
            >
              <option value="">-- Choisir un produit existant --</option>
              {products.map((p) => (
                <option key={p.sku} value={p.sku}>
                  {p.name} ({p.sku}) — {formatCurrency(p.price)}
                </option>
              ))}
            </select>
          </div>

          <Input
            name="product_sku"
            label="SKU Produit"
            placeholder="Ex: LAP-MBA-M2"
            value={form.product_sku}
            onChange={(e) => setForm((f) => ({ ...f, product_sku: e.target.value }))}
            required
          />

          <div className="form-card__row">
            <Input
              name="quantity"
              type="number"
              label="Quantité vendue"
              min={1}
              value={form.quantity || ""}
              onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
              required
            />
            <Input
              name="unit_price"
              type="number"
              label="Prix unitaire (CFA)"
              min={0}
              value={form.unit_price || ""}
              onChange={(e) => setForm((f) => ({ ...f, unit_price: Number(e.target.value) }))}
              required
            />
          </div>

          {/* Total de la transaction en temps réel */}
          <div className="sale-total-preview">
            <span>Montant total de la transaction :</span>
            <strong className="sale-total-preview__amount font-mono">
              {formatCurrency(totalAmount)}
            </strong>
          </div>

          <div className="form-card__row">
            <div className="form-field">
              <label className="form-label" htmlFor="sale-channel">
                Canal de vente
              </label>
              <select
                id="sale-channel"
                className="input input--select"
                value={form.channel}
                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
              >
                <option value="Boutique">Boutique physique</option>
                <option value="Web">Site e-commerce</option>
                <option value="B2B">Grand Compte / B2B</option>
                <option value="WhatsApp">WhatsApp Business</option>
                <option value="Autre">Autre canal</option>
              </select>
            </div>

            <Input
              name="sold_at"
              type="datetime-local"
              label="Date & Heure"
              value={form.sold_at}
              onChange={(e) => setForm((f) => ({ ...f, sold_at: e.target.value }))}
            />
          </div>

          <Button type="submit" loading={submitting} disabled={submitting}>
            Valider et enregistrer la vente
          </Button>
        </form>

        {/* Historique des ventes */}
        <div className="card card--glass">
          <div className="products-table-header">
            <div>
              <h2>Historique ({filteredSales.length} ventes)</h2>
              <p className="muted">
                Total des recettes : <strong className="text-primary font-mono">{formatCurrency(cumulativeSales)}</strong>
              </p>
            </div>
          </div>

          {/* Filtres de recherche */}
          <div className="table-filter-bar">
            <input
              type="text"
              className="table-filter-search"
              placeholder="Filtrer par SKU ou canal…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="table-filter-select"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              aria-label="Filtrer par canal"
            >
              <option value="all">Tous les canaux</option>
              <option value="Boutique">Boutique</option>
              <option value="Web">Web</option>
              <option value="B2B">B2B</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
          </div>

          {loading ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState
              title="Historique des ventes vide (0 vente)"
              description="Enregistrez votre première transaction ci-dessus ou activez des ventes d'exemple pour explorer."
              action={
                <Button variant="secondary" onClick={() => setItems(SAMPLE_SALES)}>
                  Activer les ventes d&apos;exemple
                </Button>
              }
            />
          ) : filteredSales.length === 0 ? (
            <EmptyState
              title="Aucune vente correspondante"
              description="Modifiez vos critères de recherche ou filtrez par un autre canal."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>SKU</th>
                    <th>Canal</th>
                    <th className="text-right">Qté</th>
                    <th className="text-right">Prix unit.</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((s, i) => (
                    <tr key={s.id ?? `${s.product_sku}-${i}`}>
                      <td className="text-muted">{formatDate(s.sold_at)}</td>
                      <td>
                        <code className="sku-tag">{s.product_sku}</code>
                      </td>
                      <td>
                        <span className="channel-badge">{s.channel || "Direct"}</span>
                      </td>
                      <td className="text-right font-mono font-bold">{s.quantity}</td>
                      <td className="text-right font-mono">{formatCurrency(s.unit_price)}</td>
                      <td className="text-right font-mono font-bold text-primary">
                        {formatCurrency(s.quantity * s.unit_price)}
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
