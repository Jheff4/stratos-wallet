export type ApiResponse<T> = {
  data: T
  message?: string
}

export type User = {
  id: string
  email: string
  name: string
}
