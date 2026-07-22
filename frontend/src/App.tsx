import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'

import { Toaster } from '@/components/ui/sonner'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProjectListPage } from '@/pages/ProjectListPage'
import { SpkListPage } from '@/pages/SpkListPage'
import { VendorListPage } from '@/pages/VendorListPage'
import { queryClient } from '@/lib/query-client'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/vendors', label: 'Rekanan Bank' },
  { to: '/projects', label: 'Pengadaan' },
  { to: '/spk', label: 'SPK' },
]

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-gray-50">
        <aside className="w-60 shrink-0 border-r bg-white">
          <div className="px-5 py-6">
            <p className="font-medium">SIMAVEN</p>
            <p className="text-xs text-muted-foreground">RSAB Harapan Kita</p>
          </div>
          <nav className="space-y-1 px-3">
            {NAV.map((item) => (
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
        </aside>

        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/vendors" element={<VendorListPage />} />
            <Route path="/projects" element={<ProjectListPage />} />
            <Route path="/spk" element={<SpkListPage />} />
          </Routes>
        </main>
      </div>

      <Toaster />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
