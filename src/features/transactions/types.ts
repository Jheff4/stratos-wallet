export type Transaction = {
  id: string
  accountId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
}
