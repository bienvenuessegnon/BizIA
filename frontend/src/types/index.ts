/** Types alignés sur le contrat API (docs/api/README.md). */

export type SourceType = "manual" | "csv" | "excel" | "pdf" | "image" | "unknown";

export type Product = {
  id?: string;
  sku: string;
  name: string;
  category?: string;
  unit_cost: number;
  unit_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
};

export type Sale = {
  id?: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  unit_cost?: number | null;
  sold_at?: string | null;
  channel?: string;
};

export type Kpis = {
  revenue: number;
  cost: number;
  profit: number;
  margin_pct: number;
  units_sold: number;
  sales_count: number;
};

export type ProductRanking = {
  sku: string;
  name: string;
  units_sold: number;
  revenue: number;
  profit: number;
};

export type LowStockItem = {
  sku: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
};

export type TrendPoint = {
  period: string;
  revenue: number;
  profit: number;
  units_sold: number;
};

export type Alert = {
  code: string;
  severity: "low" | "medium" | "high";
  title: string;
  detail: string;
};

export type Recommendation = {
  priority: "low" | "medium" | "high";
  action: string;
  why: string;
};

export type AnalysisResult = {
  source: SourceType;
  kpis: Kpis;
  top_sold: ProductRanking[];
  top_profit: ProductRanking[];
  low_stock: LowStockItem[];
  trend: TrendPoint[];
  week_over_week: {
    metric: "profit";
    window_days: number;
    current_window_profit: number;
    previous_window_profit: number;
    delta: number;
    delta_pct: number | null;
  } | null;
  anomalies: Array<{ type: string; period: string; value: number; severity: string; message: string }>;
  alerts: Alert[];
  insights: string[];
  recommendations: Recommendation[];
};

export type IngestionResult = {
  status: string;
  filename: string;
  source: SourceType;
  products_ingested: number;
  sales_ingested: number;
  sales_skipped_unknown?: number;
  sales_skipped_duplicate?: number;
};

export type ImportedProductRow = {
  sku: string;
  name?: string | null;
  category?: string | null;
  unit_cost?: number | null;
  unit_price?: number | null;
  stock_quantity?: number | null;
  low_stock_threshold?: number | null;
};

export type ImportedSaleRow = {
  product_sku: string;
  quantity: number;
  unit_price?: number | null;
  unit_cost?: number | null;
  sold_at?: string | null;
  channel?: string | null;
};

export type IngestionPreview = {
  status: "preview";
  filename: string;
  source: "csv" | "excel" | "pdf" | "image";
  document_type: "sales" | "products" | "mixed" | "unknown";
  extraction_method: "local" | "gemini";
  products: ImportedProductRow[];
  sales: ImportedSaleRow[];
  warnings: string[];
};

export type ChatReply = {
  reply: string;
  grounded: boolean;
  user_message: string;
};
