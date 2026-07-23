import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { sppbApi, type SppbCreateInput, type SppbProgressInput } from '@/api/sppb'
import { ApiRequestError } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'
import type { Sppb, SppbListQuery } from '@/types/sppb'

function reportError(error: unknown) {
  toast.error(
    error instanceof ApiRequestError ? error.message : 'Terjadi kesalahan tak terduga',
  )
}

export function useSppbList(query: SppbListQuery) {
  return useQuery({
    queryKey: queryKeys.sppb.list(query),
    queryFn: () => sppbApi.list(query),
  })
}

export function useDownloadSppbPdf() {
  return useMutation({
    mutationFn: (sppb: Pick<Sppb, 'id' | 'number'>) => sppbApi.download(sppb.id, sppb.number),
    onError: reportError,
  })
}

export function useIssuedSppbForProject(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sppb.list({ project_id: projectId, size: 1 }),
    queryFn: () => sppbApi.list({ project_id: projectId as string, size: 1 }),
    enabled: Boolean(projectId),
    select: (page) => page.items[0],
  })
}

export function useCreateSppb() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SppbCreateInput) => sppbApi.create(input),
    onSuccess: (sppb) => {
      qc.invalidateQueries({ queryKey: queryKeys.sppb.all })
      qc.invalidateQueries({ queryKey: queryKeys.projects.all })
      toast.success(`SPPB ${sppb.number} diterbitkan`)
    },
    onError: reportError,
  })
}

export function useUpdateSppbProgress(sppbId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SppbProgressInput) => sppbApi.updateProgress(sppbId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sppb.all })
      qc.invalidateQueries({ queryKey: queryKeys.projects.all })
      toast.success('Progres pengiriman barang disimpan')
    },
    onError: reportError,
  })
}
