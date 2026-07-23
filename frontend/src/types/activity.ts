import type { ProjectStage } from '@/types/project'

export interface ActivityItem {
  id: string
  project_id: string
  project_code: string
  project_name: string
  stage: ProjectStage
  actor_role: 'rs' | 'vendor' | 'bank_mandiri' | null
  note: string | null
  created_at: string
  is_cross_sell_opportunity: boolean
}

export interface ActivityFeed {
  unread_count: number
  items: ActivityItem[]
}
