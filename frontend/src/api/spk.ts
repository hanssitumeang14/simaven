import { api } from '@/lib/api-client'
import { authToken } from '@/lib/auth-token'
import type { Page } from '@/types/common'
import type { Spk, SpkListQuery } from '@/types/spk'

export interface SpkItemInput {
  description: string
  unit: string
  quantity: string
  unit_price: string
}

export interface SpkCreateInput {
  project_id: string
  vendor_id: string
  issued_date: string
  start_date: string
  end_date: string
  work_description: string
  payment_terms?: string
  penalty_clause?: string
  signatory_name: string
  signatory_position: string
  items: SpkItemInput[]
}

export const spkApi = {
  list: (query: SpkListQuery) => api.get<Page<Spk>>('/spk', { ...query }),
  get: (id: string) => api.get<Spk>(`/spk/${id}`),
  create: (input: SpkCreateInput) => api.post<Spk>('/spk', input),
  update: (id: string, input: Partial<SpkCreateInput>) => api.patch<Spk>(`/spk/${id}`, input),
  issue: (id: string) => api.post<Spk>(`/spk/${id}/issue`),
  remove: (id: string) => api.delete(`/spk/${id}`),

  uploadSignedDocument: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.postForm<Spk>(`/spk/${id}/signed-document`, formData)
  },

  /**
   * URL untuk dibuka di tab baru (preview PDF di viewer browser). window.open()
   * tidak bisa menyertakan header Authorization, jadi token disisipkan lewat
   * query string — endpoint di backend menerima token lewat cara ini juga.
   */
  pdfUrl: (id: string) => {
    const base = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1/spk/${id}/pdf`
    const token = authToken.get()
    return token ? `${base}?token=${encodeURIComponent(token)}` : base
  },

  /** Unduh PDF sebagai file. Nama file diambil dari header Content-Disposition. */
  async download(id: string, number: string): Promise<void> {
    const blob = await api.blob(`/spk/${id}/pdf`, { download: true })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `SPK-${number.replaceAll('/', '-')}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}
