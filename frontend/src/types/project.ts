export const PROJECT_STATUS = ['ongoing', 'completed', 'cancelled'] as const
export type ProjectStatus = (typeof PROJECT_STATUS)[number]

export const PROJECT_TYPE = ['Barang', 'Jasa', 'Konstruksi', 'Konsultansi'] as const
export type ProjectType = (typeof PROJECT_TYPE)[number]

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
  winning_vendor_id: string | null
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
