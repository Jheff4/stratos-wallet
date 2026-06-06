import { useSpendingByCategoryQuery } from '@graphql/generated';
import WidgetSkeleton from '@shared/components/WidgetSkeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const BAR_COLORS = ['#4f6ef7', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)',
      padding: '8px 12px',
      boxShadow: 'var(--shadow-md)',
      fontSize: 13,
    }}>
      <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>${payload[0].value.toLocaleString()}</div>
    </div>
  );
}

export default function SpendingChart({ walletId }: { walletId: string }) {
  const { data, isLoading } = useSpendingByCategoryQuery({
    walletId,
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    endDate:   new Date().toISOString().slice(0, 10),
  });

  if (isLoading) return <WidgetSkeleton chart />;
  if (!data) return <WidgetSkeleton chart />;

  const chartData = data?.spendingByCategory?.map((cat) => ({
    name:   cat.category,
    amount: cat.amount,
  })) ?? [];

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Spending by Category</div>
          <div className="card-subtitle">Last 30 days</div>
        </div>
      </div>
      <div className="card-body" style={{ paddingTop: 'var(--space-4)' }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg)' }} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
