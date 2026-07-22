import { Download, FileText } from 'lucide-react'
import { useState } from 'react'

import { spkApi } from '@/api/spk'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDownloadSpkPdf, useSpkList } from '@/hooks/useSpk'
import { useMyVendor } from '@/hooks/useVendors'
import { formatRupiah, formatTanggal } from '@/lib/format'
import type { SpkStatus } from '@/types/spk'

const STATUS_LABEL: Record<SpkStatus, string> = {
  draft: 'Draft',
  issued: 'Diterbitkan',
  cancelled: 'Dibatalkan',
}

export function VendorSpkPage() {
  const { data: vendor } = useMyVendor()
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useSpkList({ page, size: 20, vendor_id: vendor?.id })
  const downloadPdf = useDownloadSpkPdf()

  if (isLoading) return <p className="p-6 text-muted-foreground">Memuat data SPK…</p>
  if (isError) return <p className="p-6 text-destructive">Data SPK gagal dimuat. Coba muat ulang.</p>
  if (!data || data.items.length === 0) {
    return (
      <div className="p-6">
        <Card className="p-10 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Belum ada SPK</p>
          <p className="text-sm text-muted-foreground">
            SPK akan muncul di sini setelah perusahaan Anda ditetapkan sebagai pemenang tender.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SPK Saya</h1>
        <p className="text-sm text-gray-600">Surat Perintah Kerja yang diterbitkan untuk perusahaan Anda</p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor</TableHead>
              <TableHead>Tanggal terbit</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead className="text-right">Nilai</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((spk) => (
              <TableRow key={spk.id}>
                <TableCell className="font-medium">{spk.number}</TableCell>
                <TableCell>{formatTanggal(spk.issued_date)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatTanggal(spk.start_date)} – {formatTanggal(spk.end_date)}
                </TableCell>
                <TableCell className="text-right">{formatRupiah(spk.total_amount)}</TableCell>
                <TableCell>
                  <Badge variant={spk.status === 'issued' ? 'default' : 'secondary'}>
                    {STATUS_LABEL[spk.status]}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-1 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(spkApi.pdfUrl(spk.id), '_blank')}
                  >
                    Pratinjau
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={downloadPdf.isPending}
                    onClick={() => downloadPdf.mutate(spk)}
                  >
                    <Download className="mr-1 h-4 w-4" />
                    PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {data.items.length} dari {data.total} SPK
        </span>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page * data.size >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  )
}
