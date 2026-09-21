"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { Spinner } from "@/components/ui/Spinner";
import { useCompany } from "@/contexts/CompanyContext";
import { api } from "@/services/api";
import type { Product, Sale } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";

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

const CHANNELS = [
  { value: "Boutique", label: "Boutique / Point de vente" },
  { value: "Web", label: "Site Web / E-commerce" },
  { value: "WhatsApp", label: "WhatsApp Business" },
  { value: "B2B", label: "B2B / Vente en gros" },
  { value: "Autre", label: "Autre canal" },
];

export function SalesPanel() {
  const { currentCompany } = useCompany();
  const [items, setItems] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<SaleForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [sales, catalog] = await Promise.all([api.sales.list(), api.products.list()]);
      setItems(sales.items ?? []);
      setProducts(catalog.items ?? []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Impossible de charger les ventes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, currentCompany.id]);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, sale) => ({
          quantity: acc.quantity + sale.quantity,
          revenue: acc.revenue + sale.quantity * sale.unit_price,
        }),
        { quantity: 0, revenue: 0 }
      ),
    [items]
  );

  /** Le prix du catalogue sert de proposition, l'utilisateur peut le corriger. */
  function selectProduct(sku: string) {
    const product = products.find((item) => item.sku === sku);
    setForm((f) => ({
      ...f,
      product_sku: sku,
      unit_price: product ? product.unit_price : f.unit_price,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.product_sku.trim()) {
      setError("Choisissez le produit vendu.");
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
        channel: form.channel || "Boutique",
      });
      setSuccess(
        `Vente enregistrée : ${form.quantity} × ${formatCurrency(form.unit_price, currentCompany.currency || "FCFA")} = ${formatCurrency(
          form.quantity * form.unit_price,
          currentCompany.currency || "FCFA"
        )} (${form.channel}).`
      );
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
      eyebrow={`Transactions • ${currentCompany.name}`}
      title="Ventes"
      description={`Enregistrez et suivez les ventes de ${currentCompany.name}. Données strictement rattachées à votre entreprise courante.`}
    >
      <div className="page-grid">
        <form className="card card--glass form-card" onSubmit={handleSubmit}>
          <h2>Nouvelle vente</h2>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {products.length === 0 && !loading ? (
            <Alert variant="info">
              Aucun produit au catalogue de {currentCompany.name}.{" "}
              <Link href="/produits" className="alert__link">Ajoutez un produit</Link>{" "}
              avant d&apos;enregistrer une vente.
            </Alert>
          ) : (
            <div className="field">
              <label className="field__label" htmlFor="product_sku">
                Produit
              </label>
              <div className="field__control">
                <select
                  id="product_sku"
                  name="product_sku"
                  className="field__input"
                  value={form.product_sku}
                  onChange={(e) => selectProduct(e.target.value)}
                  required
                >
                  <option value="">Choisir un produit…</option>
                  {products.map((product) => (
                    <option key={product.sku} value={product.sku}>
                      {product.name} — {product.sku} ({formatCurrency(product.unit_price, currentCompany.currency || "FCFA")})
                    </option>
                  ))}
                </select>
              </div>
              <p className="field__hint">
                Le prix de vente du catalogue est proposé automatiquement.
              </p>
            </div>
          )}

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
              label={`Prix unitaire (${currentCompany.currency || "FCFA"})`}
              min={0}
              value={form.unit_price || ""}
              onChange={(e) => setForm((f) => ({ ...f, unit_price: Number(e.target.value) }))}
            />
          </div>

          <div className="form-card__row">
            <div className="field" style={{ flex: 1 }}>
              <label className="field__label" htmlFor="sale_channel">
                Canal de distribution
              </label>
              <div className="field__control">
                <select
                  id="sale_channel"
                  name="channel"
                  className="field__input"
                  value={form.channel}
                  onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch.value} value={ch.value}>
                      {ch.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              name="sold_at"
              type="datetime-local"
              label="Date de vente (optionnel)"
              value={form.sold_at}
              onChange={(e) => setForm((f) => ({ ...f, sold_at: e.target.value }))}
            />
          </div>

          <Button
            type="submit"
            loading={submitting}
            disabled={submitting || !form.product_sku}
          >
            Enregistrer dans {currentCompany.name}
          </Button>
        </form>

        <div className="card card--glass">
          <h2>Historique des ventes ({items.length})</h2>
          {loadError && <Alert variant="error">{loadError}</Alert>}
          {loading ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState
              title={`Aucune vente pour ${currentCompany.name}`}
              description="Enregistrez une première vente ou importez un document de ventes."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Qté</th>
                    <th>Prix unit.</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Canal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s, i) => (
                    <tr key={s.id ?? `${s.product_sku}-${i}`}>
                      <td><code>{s.product_sku}</code></td>
                      <td>{s.quantity}</td>
                      <td>{formatCurrency(s.unit_price, currentCompany.currency || "FCFA")}</td>
                      <td><strong>{formatCurrency(s.quantity * s.unit_price, currentCompany.currency || "FCFA")}</strong></td>
                      <td className="td--nowrap">{formatDate(s.sold_at)}</td>
                      <td>
                        <span className="table-tag table-tag--info">
                          {s.channel && s.channel !== "manual" ? s.channel : "Boutique"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Total</th>
                    <td>{totals.quantity}</td>
                    <td />
                    <td>
                      <strong>{formatCurrency(totals.revenue, currentCompany.currency || "FCFA")}</strong>
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppPageLayout>
  );
}
