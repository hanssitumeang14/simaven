import { api } from '@/lib/api-client'
import type { Page } from '@/types/common'
import type { Project, ProjectListQuery, ProjectType } from '@/types/project'

export interface ProjectCreateInput {
  name: string
  type: ProjectType
  budget: string
  hps: string
  bank?: string
  /** Kosongkan agar server yang membuat kode (VMS + MMYY + urutan) */
  code?: string
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
}
