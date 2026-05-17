import { useBalanceHistoryQuery } from '@graphql/generated';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BalanceTrend({ walletId }: { walletId: string }) {
  const { data, isLoading } = useBalanceHistoryQuery({ walletId });

  if (isLoading) return <div>Loading chart...</div>;

  const chartData = data?.balanceHistory?.map((snap) => ({
    date: snap.date,
    balance: snap.balance,
  })) ?? [];

  return (
    <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2>Net Worth Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}