import { Download, Package } from 'lucide-react'
import { useState } from 'react'

import { sppbApi } from '@/api/sppb'
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
import { useDownloadSppbPdf, useSppbList } from '@/hooks/useSppb'
import { formatTanggal } from '@/lib/format'
import type { Sppb } from '@/types/sppb'

function deliveryProgress(sppb: Sppb): number {
  const ordered = sppb.items.reduce((sum, item) => sum + Number(item.quantity_ordered), 0)
  const delivered = sppb.items.reduce((sum, item) => sum + Number(item.quantity_delivered), 0)
  if (ordered === 0) return 0
  return Math.round((delivered / ordered) * 100)
}

export function SppbListPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useSppbList({ page, size: 20 })
  const downloadPdf = useDownloadSppbPdf()

  if (isLoading) return <p className="p-6 text-muted-foreground">Memuat data SPPB…</p>
  if (isError) return <p className="p-6 text-destructive">Data SPPB gagal dimuat. Coba muat ulang.</p>
  if (!data || data.items.length === 0) {
    return (
      <div className="p-6">
        <Card className="p-10 text-center">
          <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Belum ada SPPB</p>
          <p className="text-sm text-muted-foreground">
            SPPB diterbitkan dari halaman pengadaan setelah Bank Garansi vendor tercatat.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SPPB</h1>
        <p className="text-sm text-gray-600">
          Surat Pesanan Pembelian Barang yang sudah diterbitkan, beserta progres pengiriman vendor
        </p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor</TableHead>
              <TableHead>Tanggal terbit</TableHead>
              <TableHead>Barang</TableHead>
              <TableHead>Progres Pengiriman</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((sppb) => {
              const progress = deliveryProgress(sppb)
              return (
                <TableRow key={sppb.id}>
                  <TableCell className="font-medium">{sppb.number}</TableCell>
                  <TableCell>{formatTanggal(sppb.issued_date)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sppb.items.length} jenis barang
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-blue-400'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <Badge variant={progress >= 100 ? 'default' : 'secondary'}>{progress}%</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(sppbApi.pdfUrl(sppb.id), '_blank')}
                    >
                      Pratinjau
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={downloadPdf.isPending}
                      onClick={() => downloadPdf.mutate(sppb)}
                    >
                      <Download className="mr-1 h-4 w-4" />
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {data.items.length} dari {data.total} SPPB
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
