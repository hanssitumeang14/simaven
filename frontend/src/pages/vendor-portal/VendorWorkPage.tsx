import { Briefcase } from 'lucide-react'

import { ProjectTimeline } from '@/components/project/ProjectTimeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjects } from '@/hooks/useProjects'
import { useMyVendor } from '@/hooks/useVendors'
import { formatRupiah } from '@/lib/format'

export function VendorWorkPage() {
  const { data: vendor } = useMyVendor()
  const { data, isLoading } = useProjects({ page: 1, size: 100 })

  const myProjects = (data?.items ?? []).filter(
    (p) => vendor && p.winning_vendor_id === vendor.id && p.stage !== 'Bidding' && p.stage !== 'Pengumuman Menang',
  )

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pekerjaan Saya</h1>
        <p className="text-sm text-gray-600">
          Progres pengadaan yang dimenangkan perusahaan Anda, mulai dari SPK sampai selesai.
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Memuat data…</p>}

      {!isLoading && myProjects.length === 0 && (
        <Card className="p-10 text-center">
          <Briefcase className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Belum ada pekerjaan berjalan</p>
          <p className="text-sm text-muted-foreground">
            Pekerjaan akan muncul di sini setelah perusahaan Anda menang tender dan SPK diterbitkan.
          </p>
        </Card>
      )}

      <div className="space-y-4">
        {myProjects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{project.name}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {project.code} · HPS {formatRupiah(project.hps)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectTimeline project={project} viewerRole="vendor" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
