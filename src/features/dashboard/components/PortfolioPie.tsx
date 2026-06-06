import { useAccountsQuery } from '@graphql/generated';
import WidgetSkeleton from '@shared/components/WidgetSkeleton';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@shared/utils/formatters';

const COLORS = ['#4f6ef7', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)',
      padding: '8px 12px',
      boxShadow: 'var(--shadow-md)',
      fontSize: 13,
    }}>
      <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>{name}</div>
      <div style={{ fontWeight: 600 }}>{formatCurrency(value)}</div>
    </div>
  );
}

export default function PortfolioPie({ walletId }: { walletId: string }) {
  const { data, isLoading } = useAccountsQuery({ walletId });

  if (isLoading) return <WidgetSkeleton chart />;
  if (!data) return <WidgetSkeleton chart />;

  const chartData = data?.accounts?.map((account) => ({
    name:  account.name,
    value: account.balance,
  })) ?? [];

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Portfolio Allocation</div>
          <div className="card-subtitle">Total: {formatCurrency(total)}</div>
        </div>
      </div>
      <div className="card-body" style={{ paddingTop: 'var(--space-4)' }}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
