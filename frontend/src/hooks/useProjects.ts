import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { projectApi, type ProjectCreateInput } from '@/api/project'
import { ApiRequestError } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'
import type { ProjectListQuery } from '@/types/project'

function reportError(error: unknown) {
  toast.error(
    error instanceof ApiRequestError ? error.message : 'Terjadi kesalahan tak terduga',
  )
}

export function useProjects(query: ProjectListQuery) {
  return useQuery({
    queryKey: queryKeys.projects.list(query),
    queryFn: () => projectApi.list(query),
  })
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id ?? ''),
    queryFn: () => projectApi.get(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProjectCreateInput) => projectApi.create(input),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all })
      toast.success(`Pengadaan ${project.code} dibuat`)
    },
    onError: reportError,
  })
}

export function useAwardVendor(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vendorId: string) => projectApi.awardVendor(projectId, vendorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all })
      toast.success('Vendor pemenang ditetapkan')
    },
    onError: reportError,
  })
}
