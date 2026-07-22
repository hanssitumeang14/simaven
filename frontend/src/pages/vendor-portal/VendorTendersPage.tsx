import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useProjects, useRegisterSelfAsParticipant } from '@/hooks/useProjects'
import { useMyVendor } from '@/hooks/useVendors'
import { formatRupiah } from '@/lib/format'
import type { Project } from '@/types/project'

export function VendorTendersPage() {
  const { data: vendor } = useMyVendor()
  const { data, isLoading, isError } = useProjects({ page: 1, size: 100, status: 'ongoing' })
  const [applyTarget, setApplyTarget] = useState<Project | null>(null)

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tender Tersedia</h1>
        <p className="text-sm text-gray-600">
          Paket pengadaan yang sedang berjalan. Kategori yang sesuai dengan perusahaan Anda ditandai.
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Memuat data pengadaan…</p>}
      {isError && <p className="text-destructive">Data pengadaan gagal dimuat.</p>}

      {data && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama pengadaan</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Kategori Vendor</TableHead>
                <TableHead className="text-right">HPS</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((project) => {
                const isMatch =
                  Boolean(vendor?.category) && project.vendor_category === vendor?.category
                return (
                  <TableRow key={project.id} className={isMatch ? 'bg-emerald-50' : undefined}>
                    <TableCell className="font-medium">{project.code}</TableCell>
                    <TableCell className="max-w-md">{project.name}</TableCell>
                    <TableCell>{project.type}</TableCell>
                    <TableCell>
                      {project.vendor_category ? (
                        <Badge variant={isMatch ? 'default' : 'secondary'}>
                          {project.vendor_category}
                          {isMatch && ' · Sesuai'}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatRupiah(project.hps)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => setApplyTarget(project)}>
                        Daftar Ikut Tender
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Belum ada pengadaan yang berjalan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {applyTarget && (
        <ApplyTenderDialog project={applyTarget} onOpenChange={(open) => !open && setApplyTarget(null)} />
      )}
    </div>
  )
}

function ApplyTenderDialog({
  project,
  onOpenChange,
}: {
  project: Project
  onOpenChange: (open: boolean) => void
}) {
  const [bidPrice, setBidPrice] = useState('')
  const registerSelf = useRegisterSelfAsParticipant(project.id)

  function handleSubmit() {
    if (!bidPrice) return
    registerSelf.mutate(
      { bid_price: bidPrice },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Daftar Ikut Tender</DialogTitle>
          <DialogDescription>
            {project.name} ({project.code}) — HPS {formatRupiah(project.hps)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="bid_price">Harga Penawaran</Label>
          <CurrencyInput id="bid_price" value={bidPrice} onChange={setBidPrice} placeholder="0" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!bidPrice || registerSelf.isPending}>
            {registerSelf.isPending ? 'Memproses...' : 'Daftar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
