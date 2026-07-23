interface SimavenLogoProps {
  iconSize?: number
  withTagline?: boolean
  wordmarkClassName?: string
}

/**
 * Rekreasi ikon+wordmark SIMAVEN (hati + garis detak jantung, gradasi hijau-biru).
 * Placeholder sampai aset PNG/SVG asli tersedia — ganti path gambar di sini kalau sudah ada.
 */
export function SimavenLogo({ iconSize = 36, withTagline = false, wordmarkClassName }: SimavenLogoProps) {
  return (
    <div className="flex items-center gap-2">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="simavenIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path
          d="M50,90 C50,90 8,60 8,34 C8,17 21,7 35,7 C44,7 50,13 50,13 C50,13 56,7 65,7 C79,7 92,17 92,34 C92,60 50,90 50,90 Z"
          fill="url(#simavenIconGradient)"
        />
        <path
          d="M18 44 H36 L41 33 L50 60 L57 40 L62 44 H82"
          stroke="white"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className={
            wordmarkClassName ??
            'bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-xl font-extrabold text-transparent'
          }
        >
          simaven
        </span>
        {withTagline && (
          <span className="text-[10px] tracking-widest text-slate-500">sistem manajemen vendor</span>
        )}
      </div>
    </div>
  )
}
