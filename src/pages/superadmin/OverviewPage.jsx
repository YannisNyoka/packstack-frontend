import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users, Clock, CheckCircle2, AlertTriangle, Ban, CreditCard, Wallet } from 'lucide-react';
import * as overviewApi from '../../api/platformOverview.js';
import { ApiError } from '../../api/client.js';
import { StatCard } from '../../components/StatCard.jsx';
import { SkeletonStatGrid, Skeleton } from '../../components/Skeleton.jsx';
import styles from './OverviewPage.module.css';

function formatMoney(amount) {
  return `R${Number(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-ZA', { month: 'short' });
}

export function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    overviewApi
      .getOverview()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load overview.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Overview</h1>
        </div>
        <SkeletonStatGrid count={7} />
        <div className="card">
          <Skeleton width="30%" height={16} />
          <div style={{ marginTop: 16 }}>
            <Skeleton width="100%" height={220} radius="8px" />
          </div>
        </div>
      </div>
    );
  }

  if (error) return <p className="error-text">{error}</p>;

  const { totalTenants, byStatus, everCharged, mrr, signupsByMonth } = data;
  const chartData = signupsByMonth.map((b) => ({ ...b, label: formatMonthLabel(b.month) }));

  return (
    <div>
      <div className="page-header">
        <h1>Overview</h1>
      </div>

      <div className={styles.grid}>
        <StatCard label="Total tenants" value={totalTenants} icon={Users} tone="blue" />
        <StatCard label="On trial" value={byStatus.trial} icon={Clock} tone="aqua" />
        <StatCard label="Active (paying)" value={byStatus.active} icon={CheckCircle2} tone="green" />
        <StatCard label="Past due" value={byStatus.past_due} icon={AlertTriangle} tone="yellow" />
        <StatCard label="Suspended" value={byStatus.suspended} icon={Ban} tone="red" />
        <StatCard label="Ever charged" value={everCharged} icon={CreditCard} tone="violet" />
        <StatCard label="MRR" value={formatMoney(mrr)} icon={Wallet} tone="orange" />
      </div>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Signups by month</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              formatter={(value) => [value, 'Signups']}
              contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13 }}
            />
            <Bar dataKey="count" fill="#2a78d6" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
