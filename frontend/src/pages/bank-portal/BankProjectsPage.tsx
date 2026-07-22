import { Eye } from 'lucide-react'
import { useState } from 'react'

import { ProjectTimelineModal } from '@/components/project/ProjectTimelineModal'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useProjects } from '@/hooks/useProjects'
import { formatRupiah } from '@/lib/format'

export function BankProjectsPage() {
  const { data, isLoading, isError } = useProjects({ page: 1, size: 100 })
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null)

  const projects = (data?.items ?? []).filter((p) => p.bank === 'Mandiri')
  const detailTarget = projects.find((p) => p.id === detailProjectId) ?? null

  if (isLoading) return <p className="p-6 text-muted-foreground">Memuat data pengadaan…</p>
  if (isError) return <p className="p-6 text-destructive">Data pengadaan gagal dimuat.</p>

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Progress Pengadaan</h1>
        <p className="text-sm text-gray-600">
          Timeline pengadaan yang menggunakan Bank Mandiri, dari lelang sampai selesai.
        </p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama pengadaan</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Tahap</TableHead>
              <TableHead className="text-right">HPS</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.code}</TableCell>
                <TableCell className="max-w-md">{project.name}</TableCell>
                <TableCell>{project.type}</TableCell>
                <TableCell>
                  <Badge variant={project.stage === 'Selesai' ? 'default' : 'secondary'}>
                    {project.stage}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatRupiah(project.hps)}</TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => setDetailProjectId(project.id)}
                    className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-gray-100 hover:text-gray-900"
                    title="Lihat timeline"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Belum ada pengadaan dengan Bank Mandiri
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {detailTarget && (
        <ProjectTimelineModal project={detailTarget} onClose={() => setDetailProjectId(null)} />
      )}
    </div>
  )
}
