import { Check, Download, ExternalLink, Eye, Package } from 'lucide-react'
import { useState } from 'react'

import { sppbApi } from '@/api/sppb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import type { Sppb, SppbItem } from '@/types/sppb'

function deliveryProgress(sppb: Sppb): number {
  const ordered = sppb.items.reduce((sum, item) => sum + Number(item.quantity_ordered), 0)
  const delivered = sppb.items.reduce((sum, item) => sum + Number(item.quantity_delivered), 0)
  if (ordered === 0) return 0
  return Math.round((delivered / ordered) * 100)
}

/** Nomor sudah memuat label SPPB (vendor Barang) atau SPMK (vendor Jasa/Konstruksi/Konsultansi). */
function docLabel(sppb: Sppb): 'SPPB' | 'SPMK' {
  return sppb.number.includes('/SPPB/') ? 'SPPB' : 'SPMK'
}

export function SppbListPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useSppbList({ page, size: 20 })
  const downloadPdf = useDownloadSppbPdf()
  const [detailTarget, setDetailTarget] = useState<Sppb | null>(null)

  if (isLoading) return <p className="p-6 text-muted-foreground">Memuat data SPPB…</p>
  if (isError) return <p className="p-6 text-destructive">Data SPPB gagal dimuat. Coba muat ulang.</p>
  if (!data || data.items.length === 0) {
    return (
      <div className="p-6">
        <Card className="p-10 text-center">
          <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Belum ada SPPB / SPMK</p>
          <p className="text-sm text-muted-foreground">
            SPPB (vendor Barang) atau SPMK (vendor Jasa/Konstruksi/Konsultansi) diterbitkan dari
            halaman pengadaan setelah Bank Garansi vendor tercatat.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SPPB / SPMK</h1>
        <p className="text-sm text-gray-600">
          Surat Pesanan Pembelian Barang (vendor Barang) dan Surat Perintah Mulai Kerja (vendor
          Jasa/Konstruksi/Konsultansi) yang sudah diterbitkan, beserta progres vendor
        </p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomor</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Pengadaan</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Tanggal terbit</TableHead>
              <TableHead>Progres</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((sppb) => {
              const progress = deliveryProgress(sppb)
              const label = docLabel(sppb)
              return (
                <TableRow key={sppb.id}>
                  <TableCell className="font-medium">{sppb.number}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{label}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <div className="truncate text-sm text-gray-900">{sppb.project_name}</div>
                    <div className="text-xs text-muted-foreground">{sppb.project_code}</div>
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate text-sm text-gray-700">
                    {sppb.vendor_name}
                  </TableCell>
                  <TableCell>{formatTanggal(sppb.issued_date)}</TableCell>
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
                    <Button variant="ghost" size="sm" onClick={() => setDetailTarget(sppb)}>
                      <Eye className="mr-1 h-4 w-4" />
                      Detail
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
          {data.items.length} dari {data.total} dokumen
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

      <SppbDetailDialog
        sppb={detailTarget}
        open={detailTarget !== null}
        onOpenChange={(open) => !open && setDetailTarget(null)}
      />
    </div>
  )
}

function SppbDetailDialog({
  sppb,
  open,
  onOpenChange,
}: {
  sppb: Sppb | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!sppb) return null

  const label = docLabel(sppb)
  const isBarang = label === 'SPPB'
  const progress = deliveryProgress(sppb)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {sppb.number} <Badge variant="outline" className="ml-1 align-middle">{label}</Badge>
          </DialogTitle>
          <DialogDescription>
            {sppb.project_name} ({sppb.project_code}) — {sppb.vendor_name} · Diterbitkan{' '}
            {formatTanggal(sppb.issued_date)}
            {sppb.notes && ` — ${sppb.notes}`}
          </DialogDescription>
        </DialogHeader>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
            <span>Progres keseluruhan</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : 'bg-blue-400'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
              <th className="py-2 font-medium">{isBarang ? 'Nama Barang' : 'Uraian Pekerjaan'}</th>
              <th className="py-2 text-right font-medium">{isBarang ? 'Dipesan' : 'Target'}</th>
              <th className="py-2 text-right font-medium">{isBarang ? 'Dikirim' : 'Tercapai'}</th>
              <th className="py-2 text-right font-medium">Sisa</th>
              <th className="py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {sppb.items.map((item) => (
              <SppbDetailItemRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>

        <a
          href={sppbApi.pdfUrl(sppb.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
        >
          Lihat PDF {label} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </DialogContent>
    </Dialog>
  )
}

function SppbDetailItemRow({ item }: { item: SppbItem }) {
  const ordered = Number(item.quantity_ordered)
  const delivered = Number(item.quantity_delivered)
  const remaining = Math.max(0, ordered - delivered)
  const itemProgress = ordered === 0 ? 0 : Math.min(100, Math.round((delivered / ordered) * 100))
  const done = itemProgress >= 100

  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 pr-2 text-gray-900">
        {item.description} <span className="text-gray-400">({item.unit})</span>
      </td>
      <td className="py-2 text-right text-gray-900">{item.quantity_ordered}</td>
      <td className="py-2 text-right text-gray-900">{item.quantity_delivered}</td>
      <td className="py-2 text-right text-gray-600">{remaining}</td>
      <td className="py-2 text-right">
        {done ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Check className="h-3.5 w-3.5" /> Selesai
          </span>
        ) : (
          <span className="text-xs font-medium text-amber-600">{itemProgress}%</span>
        )}
      </td>
    </tr>
  )
}