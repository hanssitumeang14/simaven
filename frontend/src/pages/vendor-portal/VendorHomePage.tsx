import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMyVendor } from '@/hooks/useVendors'
import { VERIFICATION_STEPS } from '@/types/vendor'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  'need-verification': 'Perlu verifikasi',
  verified: 'Terverifikasi',
  rejected: 'Ditolak',
}

export function VendorHomePage() {
  const { data: vendor, isLoading } = useMyVendor()

  if (isLoading) return <p className="p-6 text-muted-foreground">Memuat profil…</p>
  if (!vendor) return null

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Perusahaan Saya</h1>
        <p className="text-sm text-gray-600">{vendor.company_name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Verifikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">
              {STATUS_LABEL[vendor.status] ?? vendor.status} — langkah {vendor.verification_step}/8
            </span>
            <span className="text-muted-foreground">
              {Math.round((vendor.verification_step / 8) * 100)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(vendor.verification_step / 8) * 100}%` }}
            />
          </div>
          {vendor.verification_step > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Tahap saat ini: {VERIFICATION_STEPS[Math.min(vendor.verification_step, 8) - 1]}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Perusahaan</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="NPWP" value={vendor.npwp} />
          <Field label="Jenis Perusahaan" value={vendor.company_type} />
          <Field label="Nama Direktur" value={vendor.director_name} />
          <Field label="Kategori Vendor" value={vendor.category ?? '-'} />
          <Field label="Kota" value={vendor.city} />
          <Field label="Email" value={vendor.email} />
          <Field label="Telepon" value={vendor.phone} />
          <Field label="Bank Rekanan" value={vendor.bank} />
          <Field label="Nama Bank" value={vendor.bank_name} />
          <div className="col-span-2">
            <Field label="Alamat" value={vendor.address} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  )
}
