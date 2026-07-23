import { useState } from 'react'
import { FileText } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMyVendor, useUploadVendorDocument } from '@/hooks/useVendors'
import { DOCUMENT_FIELDS, VERIFICATION_STEPS, type VendorDocuments } from '@/types/vendor'

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dokumen Administrasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Lengkapi dokumen berikut agar RS dapat memproses verifikasi perusahaan Anda.
          </p>
          {DOCUMENT_FIELDS.map((doc) => (
            <DocumentRow key={doc.key} vendorId={vendor.id} doc={doc} filename={vendor.documents[doc.key]} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function DocumentRow({
  vendorId,
  doc,
  filename,
}: {
  vendorId: string
  doc: { key: keyof VendorDocuments; label: string; required: boolean }
  filename?: string | null
}) {
  const uploadDoc = useUploadVendorDocument(vendorId)
  const [inputKey, setInputKey] = useState(0)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadDoc.mutate(
      { docKey: doc.key, file },
      { onSuccess: () => setInputKey((k) => k + 1) },
    )
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            filename ? 'bg-emerald-100' : 'bg-gray-100'
          }`}
        >
          <FileText className={`h-4 w-4 ${filename ? 'text-emerald-600' : 'text-gray-400'}`} />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{doc.label}</div>
          {doc.required && <div className="text-xs text-red-600">* Wajib</div>}
          {filename && <div className="text-xs text-emerald-600">Terunggah</div>}
        </div>
      </div>
      <label className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
        {uploadDoc.isPending ? 'Mengunggah...' : filename ? 'Ganti file' : 'Unggah'}
        <input
          key={inputKey}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          disabled={uploadDoc.isPending}
          onChange={handleChange}
        />
      </label>
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
