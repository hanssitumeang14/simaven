export interface SppbItem {
  id: string
  line_no: number
  description: string
  unit: string
  quantity_ordered: string
  quantity_delivered: string
}

export interface Sppb {
  id: string
  /** Contoh: 001/SPPB/VII/2026 — selalu dibuat server */
  number: string
  sequence_no: number
  year: number
  project_id: string
  project_code: string
  project_name: string
  vendor_id: string
  vendor_name: string
  issued_date: string
  notes: string | null
  items: SppbItem[]
  created_at: string
  updated_at: string
}

export interface SppbListQuery {
  page?: number
  size?: number
  project_id?: string
  vendor_id?: string
}
