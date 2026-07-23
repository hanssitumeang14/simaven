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

export const FIVE_C_FIELDS: { key: keyof FinancialScore; label: string; description: string }[] = [
  { key: 'character', label: 'Character (Karakter)', description: 'Integritas dan rekam jejak vendor' },
  { key: 'capacity', label: 'Capacity (Kapasitas)', description: 'Kemampuan memenuhi kewajiban' },
  { key: 'capital', label: 'Capital (Modal)', description: 'Kekuatan finansial perusahaan' },
  { key: 'collateral', label: 'Collateral (Jaminan)', description: 'Aset yang dapat dijaminkan' },
  { key: 'condition', label: 'Condition (Kondisi)', description: 'Kondisi ekonomi dan industri' },
]

export function has5CComplete(score: FinancialScore | null | undefined): boolean {
  if (!score) return false
  return FIVE_C_FIELDS.every(({ key }) => score[key] !== null && score[key] !== undefined)
}

export function average5C(score: FinancialScore | null | undefined): number | null {
  if (!has5CComplete(score) || !score) return null
  const values = FIVE_C_FIELDS.map(({ key }) => score[key] as number)
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

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
