export interface ModelSizeQty {
  size: string; // e.g. "0-3 Ay", "3 Yaş"
  color?: string; // e.g. "Siyah", "Kırmızı"
  requested_qty: number;
  cut_qty: number;
  sent_qty: number;
}

export interface ModelColorPhoto {
  id: string;
  color: string;
  color_code?: string;
  photo_url: string;
  is_main?: boolean;
  date?: string;
  created_at?: string;
}

export type ModelSeason = 'WINTER' | 'SUMMER' | 'TRANSITION';

export interface FashionModel {
  id: string;
  smart_id: string;
  name: string;
  customer_name?: string;
  brand_code?: string;
  target_price: number;
  labor_cost: number;
  photo_url?: string;
  color_photos?: ModelColorPhoto[];
  gallery_photos?: string[];
  created_at?: string;
  date?: string;
  season?: ModelSeason | string; // 'WINTER' | 'SUMMER' | 'TRANSITION'
  custom_overhead?: number; // Added to support manual local overhead injections (+ Add Custom Cost Line)
  requested_qty?: number;
  cut_qty?: number;
  sent_qty?: number;
  sizes_qty?: ModelSizeQty[];
  notes?: string;
  description?: string;
  stage?: string; // e.g. "Kalıpta", "Kesimde", "Dikimde"
}

export interface BomItem {
  id: string;
  model_id: string;
  item_smart_id: string;
  item_name: string;
  item_type: 'Kumaş' | 'Aksesuar';
  lot_no?: string;
  pattern_name?: string; // Kumaş Kalıbı / Fit
  color_name?: string; // Kumaş Renk Adı
  color_code?: string; // Kumaş Renk Kodu / Hex
  incoming_meters?: number; // Toplam Gelen Kumaş Metrajı
  color_incoming_meters?: number; // Bu Rengin Gelen Metrajı
  consumption: number;
  unit: string;
  warehouse_stock: number;
  unit_cost: number;
  currency?: 'USD' | 'TRY' | 'TL' | '$';
  item_photo_url?: string;
  created_at?: string;
  date?: string;
}

export interface InventoryItem {
  id: string;
  model_id: string;
  variant_smart_id: string;
  color: string;
  size: string;
  warehouse_name: string;
  stock_count: number;
  created_at?: string;
  date?: string;
  color_photo_url?: string;
}

export interface LogisticsItem {
  id: string;
  item_smart_id: string;
  item_name: string;
  incoming: number;
  cut: number;
  remaining: number;
  unit: string;
  image_url?: string;
  used_meters?: number;
  color?: string;
  unit_price?: number;
  currency?: 'USD' | 'TRY' | 'TL' | '$';
  margin_percent?: number;
  effective_price?: number;
  created_at?: string;
  date?: string;
  customer_name?: string;
}

export interface FabricColorArchive {
  id: string;
  fabric_id: string; // references LogisticsItem.id
  color: string;
  image_url: string;
  incoming: number;
  cut: number;
  unit_price?: number;
  currency?: 'USD' | 'TRY' | 'TL' | '$';
  margin_percent?: number;
  effective_price?: number;
  created_at?: string;
  date?: string;
}

export interface FinancialTransaction {
  id: string;
  customer_name: string;
  date: string;
  doc_type: 'Invoice Issued' | 'Payment Incoming Log' | 'Purchase Invoice' | 'Payment Outgoing' | 'Payment Outgoing Log';
  amount: number;
  status: 'Settled' | 'Pending';
  model_id?: string;
  created_at?: string;
}

export interface CustomCostLine {
  id: string;
  model_id: string;
  name: string;
  cost: number;
  currency?: 'USD' | 'TRY' | 'TL' | '$';
  photo_url?: string;
  created_at?: string;
  date?: string;
}

export interface DefectItem {
  id: string;
  model_id?: string;
  model_smart_id?: string;
  model_name?: string;
  stage?: string;
  reason: string;
  qty: number;
  notes?: string;
  photo_url?: string;
  created_at: string;
  date: string;
}

export interface ProductionItem {
  id: string;
  model_id?: string;
  model_smart_id: string;
  model_name: string;
  brand_code?: string;
  customer_name?: string;
  stage: string;
  progress: number;
  target_qty: number;
  completed_qty: number;
  defect_qty?: number;
  status: 'active' | 'warning' | 'success';
  created_at?: string;
  order_date?: string;
  due_date?: string;
  notes?: string;
  date?: string;
}

export interface FinancialsItem {
  id: string;
  customer_name: string;
  total_ciro: number;
  received: number;
  outstanding: number;
  currency: string;
  company_type?: "Müşteri" | "Tedarikçi";
}

export interface DatabaseSchema {
  models: FashionModel[];
  bom_items: BomItem[];
  inventory: InventoryItem[];
  logistics: LogisticsItem[];
  production: ProductionItem[];
  financials: FinancialsItem[];
  defects?: DefectItem[];
}
