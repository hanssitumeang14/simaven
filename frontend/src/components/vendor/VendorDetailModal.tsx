import { useState } from 'react'
import {
  Building2,
  Check,
  FileText,
  Link as LinkIcon,
  Shield,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react'

import { projectApi } from '@/api/project'
import { useUpdateVerification } from '@/hooks/useVendors'
import { DOCUMENT_FIELDS, VERIFICATION_STEPS, type Vendor } from '@/types/vendor'

interface VendorDetailModalProps {
  vendor: Vendor
  onClose: () => void
}

const STEP_ICONS = [Upload, Shield, TrendingUp, FileText, Upload, Check, Building2, Shield]

const verificationSteps = VERIFICATION_STEPS.map((label, index) => ({
  id: index + 1,
  label,
  icon: STEP_ICONS[index] ?? Shield,
}))

const bankMandiriProducts = [
  {
    title: 'Bank Garansi',
    description: 'Jaminan pembayaran untuk tender proyek',
    link: 'https://www.bankmandiri.co.id/kopra-trade',
    icon: Shield,
  },
  {
    title: 'Kredit Modal Kerja',
    description: 'Pembiayaan untuk modal usaha',
    link: 'https://www.bankmandiri.co.id/kredit-modal-kerja',
    icon: TrendingUp,
  },
  {
    title: 'Rekening Giro',
    description: 'Pembukaan rekening untuk transaksi bisnis',
    link: 'https://www.bankmandiri.co.id/giro',
    icon: Building2,
  },
]

const FIVE_C = [
  { key: 'character', label: 'Character (Karakter)', description: 'Integritas dan rekam jejak vendor' },
  { key: 'capacity', label: 'Capacity (Kapasitas)', description: 'Kemampuan memenuhi kewajiban' },
  { key: 'capital', label: 'Capital (Modal)', description: 'Kekuatan finansial perusahaan' },
  { key: 'collateral', label: 'Collateral (Jaminan)', description: 'Aset yang dapat dijaminkan' },
  { key: 'condition', label: 'Condition (Kondisi)', description: 'Kondisi ekonomi dan industri' },
] as const

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  'need-verification': 'Perlu Verifikasi',
}

export function VendorDetailModal({ vendor, onClose }: VendorDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    'info' | 'documents' | 'verification' | 'products' | '5c'
  >('info')

  const updateVerification = useUpdateVerification(vendor.id)

  function advanceToStep(stepId: number) {
    updateVerification.mutate({
      verification_step: stepId,
      status: stepId >= 8 ? 'verified' : 'need-verification',
    })
  }

  const tabs = [
    { id: 'info' as const, label: 'Data Perusahaan', icon: Building2 },
    { id: 'documents' as const, label: 'Dokumen Administrasi', icon: FileText },
    { id: 'verification' as const, label: 'Proses Verifikasi', icon: Check },
    { id: 'products' as const, label: 'Produk Bank Mandiri', icon: LinkIcon },
    { id: '5c' as const, label: 'Profil 5C', icon: TrendingUp },
  ]

  const scores = vendor.financial_score
  const overallScore = scores
    ? Math.round(
        (Object.values(scores).filter((v): v is number => v !== null && v !== undefined) as number[]).reduce(
          (a, b) => a + b,
          0,
        ) / 5,
      )
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
              <Building2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{vendor.company_name}</h2>
              <p className="text-sm text-white/90">NPWP: {vendor.npwp}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-white/20">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Verification Progress */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Progress Verifikasi: {vendor.verification_step}/8
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((vendor.verification_step / 8) * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            {verificationSteps.map((step) => {
              const isComplete = vendor.verification_step >= step.id
              const isCurrent = vendor.verification_step + 1 === step.id
              return (
                <div key={step.id} className="flex-1">
                  <div
                    className={`relative h-2 rounded-full transition-all ${
                      isComplete ? 'bg-emerald-500' : isCurrent ? 'bg-emerald-200' : 'bg-gray-200'
                    }`}
                  >
                    {isComplete && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={`text-xs font-medium ${isComplete ? 'text-emerald-600' : 'text-gray-500'}`}
                    >
                      {step.label}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-2 gap-6">
              <ReadOnlyField label="NPWP" value={vendor.npwp} />
              <ReadOnlyField label="Nama Perusahaan" value={vendor.company_name} />
              <ReadOnlyField label="Jenis Perusahaan" value={vendor.company_type} />
              <ReadOnlyField label="Kota" value={vendor.city} />
              <div className="col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Alamat</label>
                <textarea
                  value={vendor.address}
                  readOnly
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900"
                />
              </div>
              <ReadOnlyField label="Nama Direktur" value={vendor.director_name} />
              <ReadOnlyField label="Email" value={vendor.email} />
              <ReadOnlyField label="Telepon" value={vendor.phone} />
              <ReadOnlyField label="Bank Rekanan" value={vendor.bank} />
              <ReadOnlyField label="Nama Bank" value={vendor.bank_name} />
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="mb-6 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-emerald-50 p-4">
                <h3 className="mb-2 font-semibold text-gray-900">Dokumen yang Diperlukan</h3>
                <p className="text-sm text-gray-600">
                  Vendor wajib melengkapi dokumen: SPT Tahunan, Neraca Keuangan, Anggaran Dasar,
                  dan Izin Perusahaan
                </p>
              </div>

              {DOCUMENT_FIELDS.map((doc) => {
                const filename = vendor.documents[doc.key]
                return (
                  <div
                    key={doc.key}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:border-emerald-500"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          filename ? 'bg-emerald-100' : 'bg-gray-100'
                        }`}
                      >
                        <FileText
                          className={`h-5 w-5 ${filename ? 'text-emerald-600' : 'text-gray-400'}`}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{doc.label}</div>
                        {doc.required && <div className="text-xs text-red-600">* Wajib</div>}
                      </div>
                    </div>
                    {filename ? (
                      <a
                        href={projectApi.documentUrl(filename)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-emerald-600 hover:underline"
                      >
                        ✓ Lihat dokumen
                      </a>
                    ) : (
                      <span className="text-sm text-gray-500">Belum diunggah</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="space-y-6">
              <div className="grid gap-4">
                {verificationSteps.map((step) => {
                  const Icon = step.icon
                  const isComplete = vendor.verification_step >= step.id
                  const isCurrent = vendor.verification_step + 1 === step.id

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-4 rounded-lg border-2 p-4 transition-all ${
                        isComplete
                          ? 'border-emerald-500 bg-emerald-50'
                          : isCurrent
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                          isComplete
                            ? 'bg-emerald-500 text-white'
                            : isCurrent
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isComplete ? <Check className="h-6 w-6" /> : step.id}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon
                            className={`h-5 w-5 ${
                              isComplete ? 'text-emerald-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'
                            }`}
                          />
                          <h4
                            className={`font-semibold ${
                              isComplete ? 'text-emerald-900' : isCurrent ? 'text-blue-900' : 'text-gray-700'
                            }`}
                          >
                            {step.label}
                          </h4>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {isComplete
                            ? 'Verifikasi selesai'
                            : isCurrent
                              ? 'Sedang dalam proses'
                              : 'Menunggu verifikasi'}
                        </p>
                      </div>
                      <div>
                        {isComplete && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                            <Check className="mr-1 h-3 w-3" />
                            Verifikasi
                          </span>
                        )}
                        {isCurrent && (
                          <button
                            onClick={() => advanceToStep(step.id)}
                            disabled={updateVerification.isPending}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            Verifikasi
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {vendor.verification_step < 8 && (
                <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Catatan:</strong> Vendor ini masih dalam proses verifikasi. Lengkapi
                    semua tahapan untuk menyelesaikan verifikasi.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 p-6 text-white">
                <h3 className="mb-2 text-xl font-bold">Produk Bank Mandiri untuk Vendor</h3>
                <p className="text-blue-100">
                  Dapatkan kemudahan dalam mengelola keuangan bisnis Anda dengan produk-produk
                  Bank Mandiri
                </p>
              </div>

              {bankMandiriProducts.map((product) => {
                const Icon = product.icon
                return (
                  <div
                    key={product.title}
                    className="rounded-xl border-2 border-gray-200 p-6 transition-all hover:border-blue-500 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                        <Icon className="h-7 w-7 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="mb-2 text-lg font-semibold text-gray-900">{product.title}</h4>
                        <p className="mb-4 text-gray-600">{product.description}</p>
                        <a
                          href={product.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          <LinkIcon className="h-4 w-4" />
                          Pelajari Lebih Lanjut
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === '5c' && (
            <div className="space-y-6">
              <div className="mb-6 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-6">
                <h3 className="mb-2 text-xl font-semibold text-gray-900">Analisis 5C Vendor</h3>
                <p className="text-sm text-gray-600">
                  Penilaian komprehensif berdasarkan Character, Capacity, Capital, Collateral, dan
                  Condition
                </p>
              </div>

              {scores ? (
                <div className="space-y-4">
                  {FIVE_C.map((item) => {
                    const score = scores[item.key] ?? 0
                    return (
                      <div key={item.key} className="rounded-lg border border-gray-200 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{item.label}</h4>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <div className="text-2xl font-bold text-emerald-600">{score}</div>
                        </div>
                        <div className="relative h-3 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                              score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}

                  {overallScore !== null && (
                    <div className="mt-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="mb-1 text-lg font-semibold">Skor Keseluruhan</h4>
                          <p className="text-sm text-white/90">Rata-rata dari semua kategori</p>
                        </div>
                        <div className="text-4xl font-bold">{overallScore}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <TrendingUp className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Belum Ada Penilaian 5C</h3>
                  <p className="text-gray-600">
                    Vendor ini belum memiliki profil 5C. Lengkapi verifikasi untuk mendapatkan
                    penilaian.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-2">
            {vendor.status === 'verified' ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-100 px-4 py-2 text-emerald-700">
                <Check className="h-5 w-5" />
                <span className="font-medium">Vendor Terverifikasi</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-yellow-100 px-4 py-2 text-yellow-700">
                <span className="font-medium">
                  Status: {STATUS_LABEL[vendor.status] ?? vendor.status}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {vendor.verification_step === 8 && vendor.status !== 'verified' && (
              <button
                onClick={() => advanceToStep(8)}
                disabled={updateVerification.isPending}
                className="rounded-lg bg-emerald-500 px-6 py-2 font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
              >
                Tandai Sebagai Terverifikasi
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        readOnly
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-900"
      />
    </div>
  )
}
