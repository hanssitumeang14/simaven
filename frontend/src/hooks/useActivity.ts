import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { activityApi } from '@/api/activity'
import { queryKeys } from '@/lib/query-client'

export function useActivityFeed() {
  return useQuery({
    queryKey: queryKeys.activity.feed,
    queryFn: () => activityApi.getFeed(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })
}

export function useMarkNotificationsSeen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => activityApi.markSeen(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.activity.feed }),
  })
}
