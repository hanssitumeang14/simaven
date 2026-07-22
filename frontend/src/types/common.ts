export interface Page<T> {
  items: T[]
  total: number
  page: number
  size: number
}

export interface ApiError {
  code: string
  message: string
}

export interface PageQuery {
  page?: number
  size?: number
}
