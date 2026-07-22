import type { VendorCreateInput } from '@/api/vendor'
import { api } from '@/lib/api-client'
import type { TokenResponse, User } from '@/types/user'

export interface RegisterInput {
  email: string
  full_name: string
  password: string
}

export interface RegisterVendorInput {
  vendor: VendorCreateInput
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export const authApi = {
  register: (input: RegisterInput) => api.post<TokenResponse>('/auth/register', input),
  registerVendor: (input: RegisterVendorInput) =>
    api.post<TokenResponse>('/auth/register-vendor', input),
  login: (input: LoginInput) => api.post<TokenResponse>('/auth/login', input),
  me: () => api.get<User>('/auth/me'),
}
