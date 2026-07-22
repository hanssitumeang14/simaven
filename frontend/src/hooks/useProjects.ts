import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  projectApi,
  type BankGaransiInput,
  type FinishProjectInput,
  type ParticipantCreateInput,
  type ParticipantSelfCreateInput,
  type ParticipantUpdateInput,
  type ProjectCreateInput,
  type SppbInput,
} from '@/api/project'
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

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all })
      toast.success('Pengadaan dihapus')
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

export function useProjectParticipants(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.participants(projectId ?? ''),
    queryFn: () => projectApi.listParticipants(projectId as string),
    enabled: Boolean(projectId),
  })
}

export function useAddParticipant(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ParticipantCreateInput) => projectApi.addParticipant(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.participants(projectId) })
      toast.success('Peserta tender ditambahkan')
    },
    onError: reportError,
  })
}

export function useUpdateParticipant(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ vendorId, input }: { vendorId: string; input: ParticipantUpdateInput }) =>
      projectApi.updateParticipant(projectId, vendorId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.participants(projectId) })
      toast.success('Harga peserta diperbarui')
    },
    onError: reportError,
  })
}

export function useRegisterSelfAsParticipant(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ParticipantSelfCreateInput) =>
      projectApi.registerSelfAsParticipant(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.participants(projectId) })
      toast.success('Berhasil mendaftar sebagai peserta tender')
    },
    onError: reportError,
  })
}

export function useRemoveParticipant(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vendorId: string) => projectApi.removeParticipant(projectId, vendorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.participants(projectId) })
      toast.success('Peserta dihapus')
    },
    onError: reportError,
  })
}

export function useProjectTimeline(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.timeline(projectId ?? ''),
    queryFn: () => projectApi.getTimeline(projectId as string),
    enabled: Boolean(projectId),
  })
}

function useTimelineMutation<TInput = void>(
  mutationFn: (input: TInput) => ReturnType<typeof projectApi.recordBankGaransi>,
  successMessage: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all })
      toast.success(successMessage)
    },
    onError: reportError,
  })
}

export function useRecordBankGaransi(projectId: string) {
  return useTimelineMutation<BankGaransiInput>(
    (input) => projectApi.recordBankGaransi(projectId, input),
    'Bank Garansi dicatat',
  )
}

export function useIssueSppb(projectId: string) {
  return useTimelineMutation<SppbInput>(
    (input) => projectApi.issueSppb(projectId, input),
    'SPPB diterbitkan',
  )
}

export function useReportWorkStarted(projectId: string) {
  return useTimelineMutation<void>(
    () => projectApi.reportWorkStarted(projectId),
    'Pengerjaan dimulai',
  )
}

export function useReportGoodsComplete(projectId: string) {
  return useTimelineMutation<void>(
    () => projectApi.reportGoodsComplete(projectId),
    'Laporan penyelesaian dikirim, menunggu konfirmasi RS',
  )
}

export function useConfirmGoodsComplete(projectId: string) {
  return useTimelineMutation<void>(
    () => projectApi.confirmGoodsComplete(projectId),
    'Barang/pekerjaan lengkap dikonfirmasi',
  )
}

export function useFinishProject(projectId: string) {
  return useTimelineMutation<FinishProjectInput>(
    (input) => projectApi.finishProject(projectId, input),
    'Pengadaan selesai',
  )
}

export function useUploadBankGaransi(projectId: string) {
  return useTimelineMutation<{ file: File; amount: string; valid_until: string }>(
    (input) => projectApi.uploadBankGaransi(projectId, input),
    'Bank Garansi berhasil diunggah',
  )
}

export function usePurchaseBankGaransiKopra(projectId: string) {
  return useTimelineMutation<BankGaransiInput>(
    (input) => projectApi.purchaseBankGaransiKopra(projectId, input),
    'Bank Garansi via Kopra berhasil diterbitkan (simulasi)',
  )
}

export function useProjectNotifications(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projects', 'notifications', projectId ?? ''] as const,
    queryFn: () => projectApi.getNotifications(projectId as string),
    enabled: Boolean(projectId),
  })
}
