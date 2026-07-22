import { Download, FileText, Lock, Trash2 } from 'lucide-react'
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
import { useDeleteSpk, useDownloadSpkPdf, useIssueSpk, useSpkList } from '@/hooks/useSpk'
import { formatRupiah, formatTanggal } from '@/lib/format'
import type { SpkStatus } from '@/types/spk'

const STATUS_LABEL: Record<SpkStatus, string> = {
  draft: 'Draft',
  issued: 'Diterbitkan',
  cancelled: 'Dibatalkan',
}

export function SpkListPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useSpkList({ page, size: 20 })
  const issueSpk = useIssueSpk()
  const downloadPdf = useDownloadSpkPdf()
  const deleteSpk = useDeleteSpk()

  if (isLoading) return <p className="p-6 text-muted-foreground">Memuat data SPK…</p>
  if (isError) return <p className="p-6 text-destructive">Data SPK gagal dimuat. Coba muat ulang.</p>
  if (!data || data.items.length === 0) {
    return (
      <div className="p-6">
        <Card className="p-10 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Belum ada SPK</p>
          <p className="text-sm text-muted-foreground">
            SPK dibuat dari halaman pengadaan setelah vendor pemenang ditetapkan.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
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
                <TableCell className="text-right space-x-1">
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
                  {spk.status === 'draft' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={issueSpk.isPending}
                        onClick={() => issueSpk.mutate(spk.id)}
                      >
                        <Lock className="mr-1 h-4 w-4" />
                        Terbitkan
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={deleteSpk.isPending}
                        onClick={() => {
                          if (confirm(`Hapus draft SPK ${spk.number}?`)) deleteSpk.mutate(spk.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
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
