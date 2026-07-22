import { Card } from '@/components/ui/card'
import { useProjects } from '@/hooks/useProjects'
import { useVendors } from '@/hooks/useVendors'
import { formatRupiah } from '@/lib/format'

/**
 * Placeholder ringkas. Grafik dan kartu statistik lengkap ada di
 * pages/_figma_reference/DashboardView.tsx — pindahkan ke sini sambil
 * mengganti data mock-nya dengan hasil hook di atas.
 */
export function DashboardPage() {
  const vendors = useVendors({ page: 1, size: 100 })
  const projects = useProjects({ page: 1, size: 100 })

  const totalHps = (projects.data?.items ?? []).reduce(
    (sum, project) => sum + Number(project.hps),
    0,
  )
  const verified = (vendors.data?.items ?? []).filter((v) => v.status === 'verified').length

  return (
    <div className="grid grid-cols-3 gap-4 p-6">
      <Stat label="Total vendor" value={String(vendors.data?.total ?? '—')} />
      <Stat label="Vendor terverifikasi" value={String(verified)} />
      <Stat label="Total HPS pengadaan" value={formatRupiah(totalHps)} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-medium">{value}</p>
    </Card>
  )
}
