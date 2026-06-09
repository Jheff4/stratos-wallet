import { useBalanceHistoryQuery } from '@graphql/generated';
import WidgetSkeleton from '@shared/components/WidgetSkeleton';
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

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
      <div style={{ fontWeight: 600, color: 'var(--color-brand)' }}>
        ${payload[0].value.toLocaleString()}
      </div>
    </div>
  );
}

export default function BalanceTrend({ walletId }: { walletId: string }) {
  const { data, isLoading } = useBalanceHistoryQuery({ walletId });

  if (isLoading) return <WidgetSkeleton chart />;
  if (!data) return <WidgetSkeleton chart />;

  const chartData = data?.balanceHistory?.map((snap) => ({
    date: snap.date,
    balance: snap.balance,
  })) ?? [];

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Net Worth Over Time</div>
          <div className="card-subtitle">30-day balance trend</div>
        </div>
      </div>
      <div className="card-body" style={{ paddingTop: 'var(--space-4)' }}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4f6ef7" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#4f6ef7"
              strokeWidth={2}
              fill="url(#balanceGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#4f6ef7' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
