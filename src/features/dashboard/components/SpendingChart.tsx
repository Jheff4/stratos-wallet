import { useSpendingByCategoryQuery } from '@graphql/generated';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SpendingChart({ walletId }: { walletId: string }) {
  const { data, isLoading } = useSpendingByCategoryQuery({
    walletId,
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  });

  if (isLoading) return <div>Loading spending...</div>;

  const chartData = data?.spendingByCategory?.map((cat) => ({
    name: cat.category,
    amount: cat.amount,
  })) ?? [];

  return (
    <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2>Spending by Category (30 days)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Bar dataKey="amount" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}