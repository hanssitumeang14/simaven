import { useState } from 'react'
import { Building2, ExternalLink, FileCheck, TrendingUp, X } from 'lucide-react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { useAuth } from '@/context/AuthContext'
import { useProjects } from '@/hooks/useProjects'
import { useVendors } from '@/hooks/useVendors'
import { formatRupiah } from '@/lib/format'

function KopraBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 px-5 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src="https://upload.wikimedia.org/wikipedia/id/thumb/f/fa/Bank_Mandiri_logo.svg/1280px-Bank_Mandiri_logo.svg.png"
          alt="Bank Mandiri"
          className="h-7 w-7 shrink-0 object-contain"
        />
        <p className="truncate text-sm text-gray-700">
          <span className="font-semibold text-blue-900">Kopra by Mandiri</span> — ajukan Bank
          Garansi vendor secara digital, tanpa perlu ke cabang.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <a
          href="https://www.bankmandiri.co.id/kopra-trade"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md bg-blue-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-800"
        >
          Pelajari <ExternalLink className="h-3 w-3" />
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md p-1.5 text-blue-900/50 hover:bg-blue-900/10 hover:text-blue-900"
          title="Tutup"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  Registrasi: '#3b82f6',
  Terverifikasi: '#10b981',
  'Perlu Verifikasi': '#f59e0b',
  Ditolak: '#ef4444',
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data: vendorPage } = useVendors({ page: 1, size: 100 })
  const { data: projectPage } = useProjects({ page: 1, size: 100 })

  const vendors = vendorPage?.items ?? []
  const projects = projectPage?.items ?? []

  const mandiriProjects = projects.filter((p) => p.bank === 'Mandiri')
  const otherBankProjects = projects.filter((p) => !p.bank || p.bank !== 'Mandiri')

  const totalMandiriHps = mandiriProjects.reduce((sum, p) => sum + Number(p.hps), 0)
  const totalOtherHps = otherBankProjects.reduce((sum, p) => sum + Number(p.hps), 0)
  const totalHps = totalMandiriHps + totalOtherHps

  const projectsByType = projects.reduce<{ type: string; count: number }[]>((acc, project) => {
    const existing = acc.find((item) => item.type === project.type)
    if (existing) {
      existing.count += 1
    } else {
      acc.push({ type: project.type, count: 1 })
    }
    return acc
  }, [])

  const statusData = [
    { name: 'Registrasi', value: vendors.filter((v) => v.status === 'pending').length },
    { name: 'Terverifikasi', value: vendors.filter((v) => v.status === 'verified').length },
    {
      name: 'Perlu Verifikasi',
      value: vendors.filter((v) => v.status === 'need-verification').length,
    },
    { name: 'Ditolak', value: vendors.filter((v) => v.status === 'rejected').length },
  ].filter((item) => item.value > 0)

  const verifiedVendors = vendors.filter((v) => v.status === 'verified').slice(0, 5)

  return (
    <div className="mx-auto max-w-[1600px] p-6">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">Ringkasan vendor dan pengadaan</p>
      </div>

      {user?.role === 'rs' && <KopraBanner />}

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-blue-900 to-blue-800 p-8 text-white shadow-lg">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <img
              src="https://upload.wikimedia.org/wikipedia/id/thumb/f/fa/Bank_Mandiri_logo.svg/1280px-Bank_Mandiri_logo.svg.png"
              alt="Mandiri"
              className="h-12 w-12 object-contain"
            />
          </div>
          <h3 className="mb-6 text-center text-xl font-semibold">Bank Mandiri</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-90">Total Pengadaan</span>
              <span className="font-bold">{mandiriProjects.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-90">Total HPS</span>
              <span className="font-bold">{formatRupiah(totalMandiriHps)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-8 text-white shadow-lg">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <Building2 className="h-10 w-10 text-teal-600" />
          </div>
          <h3 className="mb-6 text-center text-xl font-semibold">Bank Lainnya</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-90">Total Pengadaan</span>
              <span className="font-bold">{otherBankProjects.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-90">Total HPS</span>
              <span className="font-bold">{formatRupiah(totalOtherHps)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 p-8 text-white shadow-lg">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <TrendingUp className="h-10 w-10 text-pink-500" />
          </div>
          <h3 className="mb-4 text-center text-xl font-semibold">Total Pengadaan</h3>
          <div className="mb-2 text-center text-4xl font-bold">{projects.length}</div>
          <div className="mb-4 text-center text-sm opacity-90">{formatRupiah(totalHps)}</div>
          <div className="space-y-2 border-t border-white/20 pt-4">
            {projectsByType.map((item) => (
              <div key={item.type} className="flex items-center justify-between text-sm">
                <span className="opacity-90">Pengadaan {item.type}</span>
                <span className="font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-gray-900">
            Jumlah Perusahaan per Status
          </h3>

          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-gray-500">
              Tidak ada data
            </div>
          )}

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Registrasi:</span>
              <span className="font-semibold text-blue-600">
                {vendors.filter((v) => v.status === 'pending').length} Perusahaan
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Terverifikasi:</span>
              <span className="font-semibold text-green-600">
                {vendors.filter((v) => v.status === 'verified').length} Perusahaan
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Perlu Verifikasi:</span>
              <span className="font-semibold text-orange-600">
                {vendors.filter((v) => v.status === 'need-verification').length} Perusahaan
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Vendor:</span>
              <span className="font-semibold text-gray-900">{vendors.length} Perusahaan</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-gray-900">
            Perusahaan Terverifikasi
          </h3>

          <div className="space-y-3">
            {verifiedVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <FileCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900">
                    {vendor.company_name}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-600">
                    Status: <span className="font-medium text-emerald-600">Terverifikasi</span>
                  </div>
                </div>
              </div>
            ))}

            {verifiedVendors.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                Tidak ada perusahaan yang telah diverifikasi
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
