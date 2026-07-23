import { Bell, Sparkles } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useActivityFeed, useMarkNotificationsSeen } from '@/hooks/useActivity'
import { useAuth } from '@/context/AuthContext'
import { formatRelativeTime } from '@/lib/format'
import type { ActivityItem } from '@/types/activity'

const FEED_LABEL: Record<string, string> = {
  vendor: 'Update dari RS',
  rs: 'Update dari vendor',
  bank_mandiri: 'Aktivitas tender Bank Mandiri',
}

export function NotificationBell() {
  const { user } = useAuth()
  const { data } = useActivityFeed()
  const markSeen = useMarkNotificationsSeen()

  const unreadCount = data?.unread_count ?? 0
  const items = data?.items ?? []
  const label = FEED_LABEL[user?.role ?? 'rs']

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && unreadCount > 0) markSeen.mutate()
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          className="relative rounded-full p-2 text-muted-foreground hover:bg-gray-100 hover:text-gray-900"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Belum ada update.</p>
          ) : (
            items.map((item) => <NotificationRow key={item.id} item={item} />)
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationRow({ item }: { item: ActivityItem }) {
  return (
    <div
      className={`border-b border-gray-100 px-3 py-2.5 last:border-b-0 ${
        item.is_cross_sell_opportunity ? 'bg-emerald-50' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-blue-700">
          {item.project_code} · {item.project_name}
        </span>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {formatRelativeTime(item.created_at)}
        </span>
      </div>
      <p className="mt-0.5 text-sm text-gray-700">{item.note ?? item.stage}</p>
      {item.is_cross_sell_opportunity && (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-700">
          <Sparkles className="h-3.5 w-3.5" />
          Peluang cross-selling — SPK terbit, vendor belum punya Bank Garansi
        </p>
      )}
    </div>
  )
}