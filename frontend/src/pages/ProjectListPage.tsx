import { Eye, Plus, Trash2 } from 'lucide-react'
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
import { ProjectDetailModal } from '@/components/project/ProjectDetailModal'
import { ProjectFormDialog } from '@/components/project/ProjectFormDialog'
import { SpkFormDialog } from '@/components/spk/SpkFormDialog'
import { useDeleteProject, useProjects } from '@/hooks/useProjects'
import { formatRupiah } from '@/lib/format'
import type { Project } from '@/types/project'

export function ProjectListPage() {
  const { data, isLoading, isError } = useProjects({ page: 1, size: 20 })
  const deleteProject = useDeleteProject()
  const [spkTarget, setSpkTarget] = useState<Project | null>(null)
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const detailTarget = data?.items.find((p) => p.id === detailProjectId) ?? null

  if (isLoading) return <p className="p-6 text-muted-foreground">Memuat data pengadaan…</p>
  if (isError) return <p className="p-6 text-destructive">Data pengadaan gagal dimuat.</p>

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengadaan</h1>
          <p className="text-sm text-gray-600">Daftar tender dan progres pengadaan</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Buka Tender
        </Button>
      </div>

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
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setDetailProjectId(project.id)}
                      className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-gray-100 hover:text-gray-900"
                      title="Lihat detail"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
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
                    {project.stage === 'Bidding' && (
                      <button
                        onClick={() => {
                          if (confirm(`Hapus tender ${project.code}?`)) {
                            deleteProject.mutate(project.id)
                          }
                        }}
                        disabled={deleteProject.isPending}
                        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-gray-100 hover:text-destructive"
                        title="Hapus tender"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ProjectFormDialog open={createOpen} onOpenChange={setCreateOpen} />

      {spkTarget?.winning_vendor_id && (
        <SpkFormDialog
          open
          onOpenChange={(open) => !open && setSpkTarget(null)}
          projectId={spkTarget.id}
          vendorId={spkTarget.winning_vendor_id}
          projectName={spkTarget.name}
        />
      )}

      {detailTarget && (
        <ProjectDetailModal project={detailTarget} onClose={() => setDetailProjectId(null)} />
      )}
    </div>
  )
}
