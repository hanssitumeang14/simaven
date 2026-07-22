export const USER_ROLE = ['rs', 'vendor', 'bank_mandiri'] as const
export type UserRole = (typeof USER_ROLE)[number]

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  vendor_id: string | null
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}
