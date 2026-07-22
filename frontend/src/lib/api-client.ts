import { authToken } from '@/lib/auth-token'
import type { ApiError } from '@/types/common'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const API_PREFIX = '/api/v1'

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

type QueryValue = string | number | boolean | undefined | null

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${BASE_URL}${API_PREFIX}${path}`
  if (!query) return url

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

async function toError(response: Response): Promise<ApiRequestError> {
  let code = 'http_error'
  let message = `Permintaan gagal (${response.status})`
  try {
    const body = (await response.json()) as Partial<ApiError> & { detail?: unknown }
    if (body.code && body.message) {
      code = body.code
      message = body.message
    } else if (body.detail) {
      // Format bawaan FastAPI untuk error validasi
      code = 'validation_error'
      message = Array.isArray(body.detail)
        ? body.detail.map((d) => (d as { msg?: string }).msg ?? '').join(', ')
        : String(body.detail)
    }
  } catch {
    // Response bukan JSON, pakai pesan default.
  }
  return new ApiRequestError(response.status, code, message)
}

interface RequestOptions {
  query?: Record<string, QueryValue>
  body?: unknown
  signal?: AbortSignal
}

function authHeaders(): Record<string, string> {
  const token = authToken.get()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(buildUrl(path, options.query), {
    method,
    headers: {
      ...authHeaders(),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })

  if (!response.ok) throw await toError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string, query?: Record<string, QueryValue>) =>
    request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: (path: string) => request<void>('DELETE', path),

  /** Kirim multipart/form-data (dipakai untuk upload file). */
  async postForm<T>(path: string, formData: FormData): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    })
    if (!response.ok) throw await toError(response)
    return (await response.json()) as T
  },

  /** Ambil response biner (dipakai untuk unduh PDF SPK). */
  async blob(path: string, query?: Record<string, QueryValue>): Promise<Blob> {
    const response = await fetch(buildUrl(path, query), { headers: authHeaders() })
    if (!response.ok) throw await toError(response)
    return response.blob()
  },
}
