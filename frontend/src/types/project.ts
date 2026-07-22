import type { Vendor, VendorCategory } from '@/types/vendor'

export const PROJECT_STATUS = ['ongoing', 'completed', 'cancelled'] as const
export type ProjectStatus = (typeof PROJECT_STATUS)[number]

export const PROJECT_TYPE = ['Barang', 'Jasa', 'Konstruksi', 'Konsultansi'] as const
export type ProjectType = (typeof PROJECT_TYPE)[number]

export const PROJECT_STAGE = [
  'Bidding',
  'Pengumuman Menang',
  'Surat Perintah Kerja (SPK)',
  'Surat Pesanan Pembelian Barang (SPPB)',
  'Pengerjaan Vendor',
  'Barang Lengkap',
  'Selesai',
] as const
export type ProjectStage = (typeof PROJECT_STAGE)[number]

export interface Project {
  id: string
  code: string
  name: string
  type: ProjectType
  /** Dikirim sebagai string oleh backend (Decimal) agar tidak kehilangan presisi */
  budget: string
  hps: string
  status: ProjectStatus
  bank: string | null
  vendor_category: VendorCategory | null
  winning_vendor_id: string | null
  stage: ProjectStage
  bg_amount: string | null
  bg_valid_until: string | null
  bg_submitted_at: string | null
  bg_document_path: string | null
  sppb_number: string | null
  sppb_date: string | null
  work_started_at: string | null
  goods_reported_at: string | null
  goods_confirmed_at: string | null
  invoice_number: string | null
  invoice_date: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
}

export interface ProjectListQuery {
  page?: number
  size?: number
  search?: string
  status?: ProjectStatus
  type?: ProjectType
}

export interface ProjectParticipant {
  vendor_id: string
  bid_price: string
  corrected_price: string | null
  negotiated_price: string | null
  vendor: Vendor
}

export interface ProjectTimelineEvent {
  id: string
  stage: ProjectStage
  actor_role: 'rs' | 'vendor' | 'bank_mandiri' | null
  note: string | null
  created_at: string
}

export interface VendorNotification {
  id: string
  vendor_id: string
  project_id: string | null
  recipient_phone: string
  message: string
  status: 'pending' | 'sent' | 'failed'
  created_at: string
}
