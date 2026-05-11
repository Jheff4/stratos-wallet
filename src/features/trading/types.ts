export type TradeOrder = {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  status: 'open' | 'filled' | 'cancelled'
}
