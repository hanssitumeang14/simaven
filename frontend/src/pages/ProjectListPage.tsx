import { useState } from 'react'

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
import { SpkFormDialog } from '@/components/spk/SpkFormDialog'
import { useProjects } from '@/hooks/useProjects'
import { formatRupiah } from '@/lib/format'
import type { Project } from '@/types/project'

export function ProjectListPage() {
  const { data, isLoading, isError } = useProjects({ page: 1, size: 20 })
  const [spkTarget, setSpkTarget] = useState<Project | null>(null)

  if (isLoading) return <p className="p-6 text-muted-foreground">Memuat data pengadaan…</p>
  if (isError) return <p className="p-6 text-destructive">Data pengadaan gagal dimuat.</p>

  return (
    <div className="space-y-4 p-6">
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama pengadaan</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead className="text-right">HPS</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.code}</TableCell>
                <TableCell className="max-w-md">{project.name}</TableCell>
                <TableCell>{project.type}</TableCell>
                <TableCell className="text-right">{formatRupiah(project.hps)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{project.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!project.winning_vendor_id}
                    title={
                      project.winning_vendor_id
                        ? undefined
                        : 'Tetapkan vendor pemenang terlebih dahulu'
                    }
                    onClick={() => setSpkTarget(project)}
                  >
                    Buat SPK
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {spkTarget?.winning_vendor_id && (
        <SpkFormDialog
          open
          onOpenChange={(open) => !open && setSpkTarget(null)}
          projectId={spkTarget.id}
          vendorId={spkTarget.winning_vendor_id}
          projectName={spkTarget.name}
        />
      )}
    </div>
  )
}
