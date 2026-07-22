import { api } from '@/lib/api-client'
import type { Page } from '@/types/common'
import type {
  Project,
  ProjectListQuery,
  ProjectParticipant,
  ProjectTimelineEvent,
  ProjectType,
  VendorNotification,
} from '@/types/project'

export interface ProjectCreateInput {
  name: string
  type: ProjectType
  budget: string
  hps: string
  bank?: string
  vendor_category: string
  /** Kosongkan agar server yang membuat kode (VMS + MMYY + urutan) */
  code?: string
}

export interface ParticipantCreateInput {
  vendor_id: string
  bid_price: string
}

export interface ParticipantSelfCreateInput {
  bid_price: string
}

export interface ParticipantUpdateInput {
  corrected_price?: string
  negotiated_price?: string
}

export interface BankGaransiInput {
  amount: string
  valid_until: string
}

export interface SppbInput {
  number: string
  date: string
}

export interface FinishProjectInput {
  invoice_number: string
  invoice_date: string
}

export const projectApi = {
  list: (query: ProjectListQuery) => api.get<Page<Project>>('/projects', { ...query }),
  get: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (input: ProjectCreateInput) => api.post<Project>('/projects', input),
  update: (id: string, input: Partial<ProjectCreateInput>) =>
    api.patch<Project>(`/projects/${id}`, input),
  awardVendor: (id: string, vendorId: string) =>
    api.post<Project>(`/projects/${id}/award`, { vendor_id: vendorId }),
  remove: (id: string) => api.delete(`/projects/${id}`),

  listParticipants: (projectId: string) =>
    api.get<ProjectParticipant[]>(`/projects/${projectId}/participants`),
  addParticipant: (projectId: string, input: ParticipantCreateInput) =>
    api.post<ProjectParticipant>(`/projects/${projectId}/participants`, input),
  registerSelfAsParticipant: (projectId: string, input: ParticipantSelfCreateInput) =>
    api.post<ProjectParticipant>(`/projects/${projectId}/participants/me`, input),
  updateParticipant: (projectId: string, vendorId: string, input: ParticipantUpdateInput) =>
    api.patch<ProjectParticipant>(`/projects/${projectId}/participants/${vendorId}`, input),
  removeParticipant: (projectId: string, vendorId: string) =>
    api.delete(`/projects/${projectId}/participants/${vendorId}`),

  getTimeline: (projectId: string) =>
    api.get<ProjectTimelineEvent[]>(`/projects/${projectId}/timeline`),
  recordBankGaransi: (projectId: string, input: BankGaransiInput) =>
    api.post<Project>(`/projects/${projectId}/bank-garansi`, input),
  issueSppb: (projectId: string, input: SppbInput) =>
    api.post<Project>(`/projects/${projectId}/sppb`, input),
  reportWorkStarted: (projectId: string) =>
    api.post<Project>(`/projects/${projectId}/work/start`),
  reportGoodsComplete: (projectId: string) =>
    api.post<Project>(`/projects/${projectId}/work/report-complete`),
  confirmGoodsComplete: (projectId: string) =>
    api.post<Project>(`/projects/${projectId}/work/confirm-complete`),
  finishProject: (projectId: string, input: FinishProjectInput) =>
    api.post<Project>(`/projects/${projectId}/finish`, input),

  uploadBankGaransi: (
    projectId: string,
    input: { file: File; amount: string; valid_until: string },
  ) => {
    const formData = new FormData()
    formData.append('file', input.file)
    formData.append('amount', input.amount)
    formData.append('valid_until', input.valid_until)
    return api.postForm<Project>(`/projects/${projectId}/bank-garansi/upload`, formData)
  },

  purchaseBankGaransiKopra: (projectId: string, input: BankGaransiInput) =>
    api.post<Project>(`/projects/${projectId}/bank-garansi/kopra`, input),

  getNotifications: (projectId: string) =>
    api.get<VendorNotification[]>(`/projects/${projectId}/notifications`),

  /** URL dokumen yang diunggah (mis. Bank Garansi), disajikan lewat static file server. */
  documentUrl: (path: string) =>
    `${import.meta.env.VITE_API_BASE_URL ?? ''}/uploads/${path}`,
}
