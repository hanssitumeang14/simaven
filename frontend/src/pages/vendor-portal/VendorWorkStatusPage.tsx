import { ExternalLink, ListChecks } from 'lucide-react'
import { useState } from 'react'

import { sppbApi } from '@/api/sppb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useProjects, useReportGoodsComplete, useReportWorkStarted } from '@/hooks/useProjects'
import { useIssuedSppbForProject, useUpdateSppbProgress } from '@/hooks/useSppb'
import { useMyVendor } from '@/hooks/useVendors'
import { formatRupiah } from '@/lib/format'
import type { Project, ProjectStage } from '@/types/project'
import type { Sppb, SppbItem } from '@/types/sppb'

const WORK_STAGES: ProjectStage[] = [
  'Surat Pesanan Pembelian Barang (SPPB)',
  'Pengerjaan Vendor',
  'Barang Lengkap',
  'Selesai',
]

function docLabel(project: Project): 'SPPB' | 'SPMK' {
  return project.type === 'Barang' ? 'SPPB' : 'SPMK'
}

function overallProgress(items: SppbItem[]): number {
  const ordered = items.reduce((sum, item) => sum + Number(item.quantity_ordered), 0)
  const delivered = items.reduce((sum, item) => sum + Number(item.quantity_delivered), 0)
  if (ordered === 0) return 0
  return Math.min(100, Math.round((delivered / ordered) * 100))
}

export function VendorWorkStatusPage() {
  const { data: vendor } = useMyVendor()
  const { data, isLoading } = useProjects({ page: 1, size: 100 })

  const myProjects = (data?.items ?? []).filter(
    (p) => vendor && p.winning_vendor_id === vendor.id && WORK_STAGES.includes(p.stage),
  )

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Status Pengerjaan</h1>
        <p className="text-sm text-gray-600">
          Progres pengerjaan SPPB/SPMK untuk pengadaan yang dimenangkan perusahaan Anda
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Memuat data…</p>}

      {!isLoading && myProjects.length === 0 && (
        <Card className="p-10 text-center">
          <ListChecks className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Belum ada pekerjaan berjalan</p>
          <p className="text-sm text-muted-foreground">
            Status pengerjaan akan muncul di sini setelah RS menerbitkan SPPB/SPMK.
          </p>
        </Card>
      )}

      <div className="space-y-4">
        {myProjects.map((project) => (
          <WorkStatusCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}

function WorkStatusCard({ project }: { project: Project }) {
  const { data: sppb } = useIssuedSppbForProject(project.id)
  const label = docLabel(project)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{project.name}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {project.code} · HPS {formatRupiah(project.hps)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!sppb ? (
          <p className="text-sm text-muted-foreground">Menunggu {label} diterbitkan RS.</p>
        ) : (
          <WorkStatusBody project={project} sppb={sppb} />
        )}
      </CardContent>
    </Card>
  )
}

function WorkStatusBody({ project, sppb }: { project: Project; sppb: Sppb }) {
  const reportWorkStarted = useReportWorkStarted(project.id)
  const reportGoodsComplete = useReportGoodsComplete(project.id)
  const updateProgress = useUpdateSppbProgress(sppb.id)
  const [values, setValues] = useState<Record<string, string>>({})

  const label = docLabel(project)
  const isBarang = label === 'SPPB'
  const progress = overallProgress(sppb.items)
  const isComplete = progress >= 100
  const notStarted = !project.work_started_at
  const reported = Boolean(project.goods_reported_at)

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
          <span>{sppb.number}</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : 'bg-blue-400'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {notStarted && (
        <div>
          <p className="mb-2 text-sm text-gray-600">
            {label} telah diterbitkan. Mulai pengerjaan untuk mulai melapor progres.
          </p>
          <Button
            size="sm"
            disabled={reportWorkStarted.isPending}
            onClick={() => reportWorkStarted.mutate()}
          >
            Mulai Pengerjaan
          </Button>
        </div>
      )}

      {!notStarted && !reported && (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="pb-1 font-medium">{isBarang ? 'Barang' : 'Pekerjaan'}</th>
                <th className="pb-1 text-right font-medium">{isBarang ? 'Dipesan' : 'Target'}</th>
                <th className="pb-1 text-right font-medium">{isBarang ? 'Dikirim' : 'Tercapai'}</th>
              </tr>
            </thead>
            <tbody>
              {sppb.items.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="py-1.5 pr-2 text-gray-900">
                    {item.description} <span className="text-gray-400">({item.unit})</span>
                  </td>
                  <td className="py-1.5 text-right text-gray-900">{item.quantity_ordered}</td>
                  <td className="py-1.5 text-right">
                    <Input
                      type="number"
                      min="0"
                      max={item.quantity_ordered}
                      className="ml-auto w-24 text-right"
                      value={values[item.id] ?? item.quantity_delivered}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={updateProgress.isPending || Object.keys(values).length === 0}
              onClick={() =>
                updateProgress.mutate({
                  items: sppb.items.map((item) => ({
                    id: item.id,
                    quantity_delivered: values[item.id] ?? item.quantity_delivered,
                  })),
                })
              }
            >
              {updateProgress.isPending ? 'Menyimpan...' : 'Simpan Progres'}
            </Button>
            <Button
              size="sm"
              disabled={reportGoodsComplete.isPending || !isComplete}
              title={isComplete ? undefined : 'Lengkapi progres hingga 100% sebelum melapor selesai'}
              onClick={() => reportGoodsComplete.mutate()}
            >
              Lapor Selesai
            </Button>
          </div>
          {!isComplete && (
            <p className="text-xs text-gray-500">
              Progres belum 100%, simpan dulu jumlah terbaru sebelum bisa melapor selesai.
            </p>
          )}
        </>
      )}

      {reported && (
        <p className="text-sm text-gray-600">
          {project.stage === 'Selesai'
            ? 'Pekerjaan selesai dan invoice sudah diterbitkan.'
            : project.goods_confirmed_at
              ? 'Barang/pekerjaan sudah dikonfirmasi RS, menunggu invoice.'
              : 'Menunggu konfirmasi RS.'}
        </p>
      )}

      <a
        href={sppbApi.pdfUrl(sppb.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
      >
        Lihat PDF {label} <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}
