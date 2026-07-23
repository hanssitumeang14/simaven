import { api } from '@/lib/api-client'
import type { ActivityFeed } from '@/types/activity'

export const activityApi = {
  getFeed: () => api.get<ActivityFeed>('/notifications/feed'),
  markSeen: () => api.post<void>('/notifications/mark-seen'),
}
