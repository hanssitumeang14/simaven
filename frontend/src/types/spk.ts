export const SPK_STATUS = ['draft', 'issued', 'cancelled'] as const
export type SpkStatus = (typeof SPK_STATUS)[number]

export interface SpkItem {
  id: string
  line_no: number
  description: string
  unit: string
  quantity: string
  unit_price: string
  subtotal: string
}

export interface Spk {
  id: string
  /** Contoh: 001/SPK/VII/2026 — selalu dibuat server */
  number: string
  sequence_no: number
  year: number
  project_id: string
  vendor_id: string
  issued_date: string
  start_date: string
  end_date: string
  work_description: string
  payment_terms: string | null
  penalty_clause: string | null
  total_amount: string
  signatory_name: string
  signatory_position: string
  status: SpkStatus
  items: SpkItem[]
  created_at: string
  updated_at: string
}

export interface SpkListQuery {
  page?: number
  size?: number
  status?: SpkStatus
  project_id?: string
}
