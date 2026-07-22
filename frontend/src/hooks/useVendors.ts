import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  vendorApi,
  type VendorCreateInput,
  type VendorUpdateInput,
  type VerificationInput,
} from '@/api/vendor'
import { ApiRequestError } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'
import type { VendorListQuery } from '@/types/vendor'

function reportError(error: unknown) {
  const message =
    error instanceof ApiRequestError ? error.message : 'Terjadi kesalahan tak terduga'
  toast.error(message)
}

export function useVendors(query: VendorListQuery) {
  return useQuery({
    queryKey: queryKeys.vendors.list(query),
    queryFn: () => vendorApi.list(query),
  })
}

export function useVendor(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vendors.detail(id ?? ''),
    queryFn: () => vendorApi.get(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: VendorCreateInput) => vendorApi.create(input),
    onSuccess: (vendor) => {
      qc.invalidateQueries({ queryKey: queryKeys.vendors.all })
      toast.success(`Vendor ${vendor.company_name} ditambahkan`)
    },
    onError: reportError,
  })
}

export function useUpdateVendor(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: VendorUpdateInput) => vendorApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.vendors.all })
      toast.success('Perubahan disimpan')
    },
    onError: reportError,
  })
}

export function useUpdateVerification(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: VerificationInput) => vendorApi.updateVerification(id, input),
    onSuccess: (vendor) => {
      qc.invalidateQueries({ queryKey: queryKeys.vendors.all })
      toast.success(`Verifikasi diperbarui ke langkah ${vendor.verification_step}`)
    },
    onError: reportError,
  })
}
