const STORAGE_KEY = 'simaven_token'

export const authToken = {
  get: (): string | null => localStorage.getItem(STORAGE_KEY),
  set: (token: string): void => localStorage.setItem(STORAGE_KEY, token),
  clear: (): void => localStorage.removeItem(STORAGE_KEY),
}
