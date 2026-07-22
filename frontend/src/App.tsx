import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProjectListPage } from '@/pages/ProjectListPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { RegisterVendorPage } from '@/pages/RegisterVendorPage'
import { SpkListPage } from '@/pages/SpkListPage'
import { VendorHomePage } from '@/pages/vendor-portal/VendorHomePage'
import { VendorSpkPage } from '@/pages/vendor-portal/VendorSpkPage'
import { VendorTendersPage } from '@/pages/vendor-portal/VendorTendersPage'
import { VendorWorkPage } from '@/pages/vendor-portal/VendorWorkPage'
import { VendorListPage } from '@/pages/VendorListPage'
import { BankProjectsPage } from '@/pages/bank-portal/BankProjectsPage'
import { queryClient } from '@/lib/query-client'
import { cn } from '@/lib/utils'

const RS_NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/vendors', label: 'Rekanan Bank' },
  { to: '/projects', label: 'Pengadaan' },
  { to: '/spk', label: 'SPK' },
]

const VENDOR_NAV = [
  { to: '/vendor/profil', label: 'Profil Saya' },
  { to: '/vendor/tender', label: 'Tender Tersedia' },
  { to: '/vendor/pekerjaan', label: 'Pekerjaan Saya' },
  { to: '/vendor/spk', label: 'SPK Saya' },
]

const BANK_NAV = [
  { to: '/bank/dashboard', label: 'Dashboard' },
  { to: '/bank/projects', label: 'Progress Pengadaan' },
]

function Sidebar({ nav }: { nav: { to: string; label: string }[] }) {
  const { user, logout } = useAuth()

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-white">
      <div className="px-5 py-6">
        <p className="font-medium">SIMAVEN</p>
        <p className="text-xs text-muted-foreground">RSJPD Harapan Kita</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'block rounded-md px-3 py-2 text-sm',
                isActive ? 'bg-gray-100 font-medium' : 'text-muted-foreground hover:bg-gray-50',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t px-3 py-4">
        <p className="truncate px-2 text-sm font-medium">{user?.full_name}</p>
        <p className="truncate px-2 text-xs text-muted-foreground">{user?.email}</p>
        <button
          onClick={logout}
          className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </aside>
  )
}

function Shell({ nav, children }: { nav: { to: string; label: string }[]; children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar nav={nav} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function RsShell() {
  return (
    <Shell nav={RS_NAV}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/vendors" element={<VendorListPage />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/spk" element={<SpkListPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Shell>
  )
}

function VendorShell() {
  return (
    <Shell nav={VENDOR_NAV}>
      <Routes>
        <Route path="/" element={<Navigate to="/vendor/profil" replace />} />
        <Route path="/vendor/profil" element={<VendorHomePage />} />
        <Route path="/vendor/tender" element={<VendorTendersPage />} />
        <Route path="/vendor/pekerjaan" element={<VendorWorkPage />} />
        <Route path="/vendor/spk" element={<VendorSpkPage />} />
        <Route path="*" element={<Navigate to="/vendor/profil" replace />} />
      </Routes>
    </Shell>
  )
}

function BankShell() {
  return (
    <Shell nav={BANK_NAV}>
      <Routes>
        <Route path="/" element={<Navigate to="/bank/dashboard" replace />} />
        <Route path="/bank/dashboard" element={<DashboardPage />} />
        <Route path="/bank/projects" element={<BankProjectsPage />} />
        <Route path="*" element={<Navigate to="/bank/dashboard" replace />} />
      </Routes>
    </Shell>
  )
}

function RoleRouter() {
  const { user } = useAuth()

  if (user?.role === 'vendor') return <VendorShell />
  if (user?.role === 'bank_mandiri') return <BankShell />
  return <RsShell />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register-vendor" element={<RegisterVendorPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <RoleRouter />
              </ProtectedRoute>
            }
          />
        </Routes>

        <Toaster />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </AuthProvider>
    </QueryClientProvider>
  )
}
