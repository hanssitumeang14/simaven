import { api } from '@/lib/api-client'
import type { Page } from '@/types/common'
import type { Vendor, VendorDocuments, VendorListQuery, VendorStatus } from '@/types/vendor'

export interface VendorCreateInput {
  npwp: string
  company_name: string
  company_type: string
  director_name: string
  category: string
  city: string
  address: string
  email: string
  phone: string
  bank: string
  bank_name: string
  bank_account_no?: string
}

export type VendorUpdateInput = Partial<Omit<VendorCreateInput, 'npwp'>>

export interface VerificationInput {
  verification_step: number
  status: VendorStatus
  note?: string
}

export const vendorApi = {
  list: (query: VendorListQuery) => api.get<Page<Vendor>>('/vendors', { ...query }),
  get: (id: string) => api.get<Vendor>(`/vendors/${id}`),
  me: () => api.get<Vendor>('/vendors/me'),
  create: (input: VendorCreateInput) => api.post<Vendor>('/vendors', input),
  update: (id: string, input: VendorUpdateInput) => api.patch<Vendor>(`/vendors/${id}`, input),
  updateVerification: (id: string, input: VerificationInput) =>
    api.post<Vendor>(`/vendors/${id}/verification`, input),
  remove: (id: string) => api.delete(`/vendors/${id}`),

  uploadDocument: (id: string, docKey: keyof VendorDocuments, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.postForm<Vendor>(`/vendors/${id}/documents/${docKey}/upload`, formData)
  },
}
