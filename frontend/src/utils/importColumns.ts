/**
 * Colonnes reconnues à l'import, alignées sur `COLUMN_ALIASES`
 * dans `backend/app/services/ingestion.py`.
 *
 * Les en-têtes sont comparés sans tenir compte de la casse, des accents,
 * de la ponctuation ni d'une mention d'unité (« Prix unitaire (FCFA) »).
 */

export type ColumnDoc = {
  field: string;
  label: string;
  required: boolean;
  aliases: string[];
};

export const SALE_COLUMNS: ColumnDoc[] = [
  {
    field: "product_sku",
    label: "Référence du produit",
    required: true,
    aliases: ["sku", "produit", "code_produit", "reference"],
  },
  {
    field: "quantity",
    label: "Quantité vendue",
    required: true,
    aliases: ["quantite", "qte", "quantite_vendue", "quantity"],
  },
  {
    field: "unit_price",
    label: "Prix unitaire",
    required: false,
    aliases: ["prix_unitaire", "prix", "prix_vente", "pu"],
  },
  {
    field: "unit_cost",
    label: "Coût unitaire",
    required: false,
    aliases: ["cout_unitaire", "cout", "prix_achat"],
  },
  {
    field: "sold_at",
    label: "Date de vente",
    required: false,
    aliases: ["date", "date_vente", "jour"],
  },
];

export const PRODUCT_COLUMNS: ColumnDoc[] = [
  { field: "sku", label: "Référence", required: true, aliases: ["sku", "code", "reference"] },
  { field: "name", label: "Nom", required: true, aliases: ["nom", "name", "designation"] },
  { field: "category", label: "Catégorie", required: false, aliases: ["categorie", "famille"] },
  {
    field: "unit_price",
    label: "Prix de vente",
    required: false,
    aliases: ["prix_unitaire", "prix_vente", "prix"],
  },
  { field: "unit_cost", label: "Coût unitaire", required: false, aliases: ["cout_unitaire", "prix_achat"] },
  { field: "stock_quantity", label: "Stock", required: false, aliases: ["stock", "qte_stock"] },
  { field: "low_stock_threshold", label: "Seuil d'alerte", required: false, aliases: ["seuil", "seuil_alerte"] },
];

export const SALE_TEMPLATE_CSV =
  "sku,quantite,prix_unitaire,date\nPiment,4,250,2026-09-01\nRIZ-5KG,7,3000,2026-09-02\n";

export const PRODUCT_TEMPLATE_CSV =
  "sku,nom,categorie,cout_unitaire,prix_unitaire,stock,seuil_alerte\n" +
  "Piment,Piment,Epicerie,150,250,20,5\n" +
  "RIZ-5KG,Riz 5kg,Epicerie,2200,3000,30,6\n";

export function downloadCsvTemplate(filename: string, content: string): void {
  const blob = new Blob([`\ufeff${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
