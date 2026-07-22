import { Eye } from 'lucide-react'
import { useState } from 'react'

import { VendorDetailModal } from '@/components/vendor/VendorDetailModal'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useVendors } from '@/hooks/useVendors'
import { VERIFICATION_STEPS, type VendorStatus } from '@/types/vendor'

const STATUS_LABEL: Record<VendorStatus, string> = {
  pending: 'Menunggu',
  'need-verification': 'Perlu verifikasi',
  verified: 'Terverifikasi',
  rejected: 'Ditolak',
}

export function VendorListPage() {
  const [search, setSearch] = useState('')
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const { data, isLoading, isError } = useVendors({ page: 1, size: 20, search })

  const selectedVendor = data?.items.find((v) => v.id === selectedVendorId) ?? null

  return (
    <div className="space-y-4 p-6">
      <Input
        placeholder="Cari nama perusahaan atau NPWP"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading && <p className="text-muted-foreground">Memuat data vendor…</p>}
      {isError && <p className="text-destructive">Data vendor gagal dimuat. Coba muat ulang.</p>}

      {data && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Perusahaan</TableHead>
                <TableHead>NPWP</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Langkah verifikasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.company_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{vendor.npwp}</TableCell>
                  <TableCell>{vendor.bank_name}</TableCell>
                  <TableCell className="text-sm">
                    {vendor.verification_step === 0
                      ? 'Belum mulai'
                      : `${vendor.verification_step}/8 · ${VERIFICATION_STEPS[vendor.verification_step - 1]}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={vendor.status === 'verified' ? 'default' : 'secondary'}>
                      {STATUS_LABEL[vendor.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => setSelectedVendorId(vendor.id)}
                      className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-gray-100 hover:text-gray-900"
                      title="Lihat detail"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {selectedVendor && (
        <VendorDetailModal vendor={selectedVendor} onClose={() => setSelectedVendorId(null)} />
      )}
    </div>
  )
}
