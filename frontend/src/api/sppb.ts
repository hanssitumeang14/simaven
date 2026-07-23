import { api } from '@/lib/api-client'
import { authToken } from '@/lib/auth-token'
import type { Page } from '@/types/common'
import type { Sppb, SppbListQuery } from '@/types/sppb'

export interface SppbItemInput {
  description: string
  unit: string
  quantity_ordered: string
}

export interface SppbCreateInput {
  project_id: string
  issued_date: string
  notes?: string
  items: SppbItemInput[]
}

export interface SppbProgressItemInput {
  id: string
  quantity_delivered: string
}

export interface SppbProgressInput {
  items: SppbProgressItemInput[]
}

export const sppbApi = {
  list: (query: SppbListQuery) => api.get<Page<Sppb>>('/sppb', { ...query }),
  get: (id: string) => api.get<Sppb>(`/sppb/${id}`),
  create: (input: SppbCreateInput) => api.post<Sppb>('/sppb', input),
  updateProgress: (id: string, input: SppbProgressInput) =>
    api.post<Sppb>(`/sppb/${id}/progress`, input),

  pdfUrl: (id: string) => {
    const base = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1/sppb/${id}/pdf`
    const token = authToken.get()
    return token ? `${base}?token=${encodeURIComponent(token)}` : base
  },

  /** Unduh PDF sebagai file. Nama file diambil dari nomor SPPB. */
  async download(id: string, number: string): Promise<void> {
    const blob = await api.blob(`/sppb/${id}/pdf`, { download: true })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `SPPB-${number.replaceAll('/', '-')}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}
