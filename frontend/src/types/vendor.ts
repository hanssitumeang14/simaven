export const VENDOR_STATUS = ['pending', 'need-verification', 'verified', 'rejected'] as const
export type VendorStatus = (typeof VENDOR_STATUS)[number]

export const BANK_GROUP = ['Mandiri', 'Bank Lainnya'] as const
export type BankGroup = (typeof BANK_GROUP)[number]

export const VENDOR_CATEGORY = ['Vendor Operasional', 'Vendor Pengadaan', 'Cleaning Service'] as const
export type VendorCategory = (typeof VENDOR_CATEGORY)[number]

/** 5C profiling, skala 0-100 */
export interface FinancialScore {
  character?: number | null
  capacity?: number | null
  capital?: number | null
  collateral?: number | null
  condition?: number | null
}

export interface VendorDocuments {
  sptTahunan?: string | null
  neraca?: string | null
  anggaranDasar?: string | null
  izinPerusahaan?: string | null
  rekening?: string | null
}

export interface Vendor {
  id: string
  npwp: string
  company_name: string
  company_type: string
  director_name: string
  category: VendorCategory | null
  city: string
  address: string
  email: string
  phone: string
  bank: BankGroup
  bank_name: string
  bank_account_no: string | null
  status: VendorStatus
  /** 0-8, mengikuti alur verifikasi 8 langkah */
  verification_step: number
  documents: VendorDocuments
  financial_score: FinancialScore | null
  performance_rating: number | null
  created_at: string
  updated_at: string
}

export interface VendorListQuery {
  page?: number
  size?: number
  search?: string
  status?: VendorStatus
  bank?: BankGroup
}

export const DOCUMENT_FIELDS: { key: keyof VendorDocuments; label: string; required: boolean }[] = [
  { key: 'sptTahunan', label: 'SPT Tahunan', required: true },
  { key: 'neraca', label: 'Neraca Keuangan', required: true },
  { key: 'anggaranDasar', label: 'Anggaran Dasar / Akta Pendirian', required: true },
  { key: 'izinPerusahaan', label: 'Izin Perusahaan (SIUP/NIB)', required: true },
  { key: 'rekening', label: 'Informasi Rekening Bank', required: false },
]

export const VERIFICATION_STEPS = [
  'Upload Dokumen',
  'Verifikasi Logistik',
  'Verifikasi Keuangan',
  'Verifikasi Legal',
  'Upload Form Aplikasi Vendor',
  'Verifikasi Form Aplikasi Vendor',
  'Verifikasi Struktural',
  'DRI',
] as const
