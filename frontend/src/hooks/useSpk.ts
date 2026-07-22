import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { spkApi, type SpkCreateInput } from '@/api/spk'
import { ApiRequestError } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'
import type { Spk, SpkListQuery } from '@/types/spk'

function reportError(error: unknown) {
  toast.error(
    error instanceof ApiRequestError ? error.message : 'Terjadi kesalahan tak terduga',
  )
}

export function useSpkList(query: SpkListQuery) {
  return useQuery({
    queryKey: queryKeys.spk.list(query),
    queryFn: () => spkApi.list(query),
  })
}

export function useSpkDetail(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.spk.detail(id ?? ''),
    queryFn: () => spkApi.get(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateSpk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SpkCreateInput) => spkApi.create(input),
    onSuccess: (spk) => {
      qc.invalidateQueries({ queryKey: queryKeys.spk.all })
      toast.success(`SPK ${spk.number} dibuat`)
    },
    onError: reportError,
  })
}

export function useIssueSpk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => spkApi.issue(id),
    onSuccess: (spk) => {
      qc.invalidateQueries({ queryKey: queryKeys.spk.all })
      toast.success(`SPK ${spk.number} diterbitkan`)
    },
    onError: reportError,
  })
}

export function useDeleteSpk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => spkApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.spk.all })
      toast.success('SPK dihapus')
    },
    onError: reportError,
  })
}

export function useIssuedSpkForProject(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.spk.list({ project_id: projectId, status: 'issued', size: 1 }),
    queryFn: () => spkApi.list({ project_id: projectId as string, status: 'issued', size: 1 }),
    enabled: Boolean(projectId),
    select: (page) => page.items[0],
  })
}

export function useUploadSignedSpk(spkId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => spkApi.uploadSignedDocument(spkId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.spk.all })
      toast.success('SPK bertanda tangan berhasil diunggah')
    },
    onError: reportError,
  })
}

export function useDownloadSpkPdf() {
  return useMutation({
    mutationFn: (spk: Pick<Spk, 'id' | 'number'>) => spkApi.download(spk.id, spk.number),
    onError: reportError,
  })
}
