const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/** Nilai uang dikirim backend sebagai string agar presisi Decimal tidak hilang. */
export function formatRupiah(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-'
  const num = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(num) ? rupiahFormatter.format(num) : '-'
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatTanggal(value: string | null | undefined): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : dateFormatter.format(date)
}

/** Waktu relatif singkat (mis. "5 menit lalu", "2 hari lalu"), dipakai di feed notifikasi. */
export function formatRelativeTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.round(diffMs / 60_000)

  if (diffMin < 1) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} menit lalu`
  const diffHour = Math.round(diffMin / 60)
  if (diffHour < 24) return `${diffHour} jam lalu`
  const diffDay = Math.round(diffHour / 24)
  if (diffDay < 7) return `${diffDay} hari lalu`
  return formatTanggal(value)
}

export function formatNpwp(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 15) return value
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}.${digits.slice(8, 9)}-${digits.slice(9, 12)}.${digits.slice(12)}`
}
