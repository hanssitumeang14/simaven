import { QueryClient } from '@tanstack/react-query'

import { ApiRequestError } from '@/lib/api-client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // 4xx tidak perlu diulang — permintaannya memang salah.
        if (error instanceof ApiRequestError && error.status < 500) return false
        return failureCount < 2
      },
    },
  },
})

export const queryKeys = {
  vendors: {
    all: ['vendors'] as const,
    list: (query: unknown) => ['vendors', 'list', query] as const,
    detail: (id: string) => ['vendors', 'detail', id] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: (query: unknown) => ['projects', 'list', query] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
  },
  spk: {
    all: ['spk'] as const,
    list: (query: unknown) => ['spk', 'list', query] as const,
    detail: (id: string) => ['spk', 'detail', id] as const,
  },
}
