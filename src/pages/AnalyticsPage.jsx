import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as analyticsApi from '../api/analytics.js';
import { ApiError } from '../api/client.js';
import { useSlowLoad } from '../hooks/useSlowLoad.js';
import { StatCard } from '../components/StatCard.jsx';
import styles from './AnalyticsPage.module.css';

const RANGE_OPTIONS = [
  { value: '7d', label: '7 days', days: 7 },
  { value: '30d', label: '30 days', days: 30 },
  { value: '90d', label: '90 days', days: 90 },
  { value: '1y', label: '1 year', days: 365 },
];

// Recharts wants literal color strings, not CSS custom properties - these
// mirror index.css's --stat-blue/--stat-green light-mode values (the chart
// surface here is always the light .card background, dark mode isn't wired
// through this library the same way plain CSS handles it elsewhere).
const BOOKINGS_COLOR = '#2a78d6';
const REVENUE_COLOR = '#008300';

function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// dailyBookings/dailyRevenue from the API are sparse - $group only emits
// days that had activity. Reconstruct a dense, contiguous day-by-day array
// so the bar chart shows a true zero bar on quiet days instead of silently
// skipping them.
function fillDateRange(sparse, days, valueKey) {
  const map = new Map(sparse.map((d) => [d.date, d[valueKey]]));
  const today = new Date();
  const result = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toLocalDateKey(d);
    result.push({ date: key, [valueKey]: map.get(key) || 0 });
  }
  return result;
}

function formatTick(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

function formatMoney(amount) {
  return `R${Number(amount || 0).toFixed(2)}`;
}

export function AnalyticsPage() {
  const [range, setRange] = useState('30d');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const slowLoad = useSlowLoad(loading);

  async function load(selectedRange) {
    setLoading(true);
    setError(null);
    try {
      setSummary(await analyticsApi.getSummary(selectedRange));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const rangeMeta = RANGE_OPTIONS.find((r) => r.value === range);
  const tickInterval = rangeMeta ? Math.max(0, Math.floor(rangeMeta.days / 8) - 1) : 0;
  const bookingsData = summary ? fillDateRange(summary.dailyBookings, rangeMeta.days, 'count') : [];
  const revenueData = summary ? fillDateRange(summary.dailyRevenue, rangeMeta.days, 'amount') : [];

  return (
    <div>
      <div className="page-header">
        <h1>Business Analytics</h1>
        <div className={styles.rangeGroup}>
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`btn btn-sm ${range === opt.value ? 'btn-primary' : ''}`}
              onClick={() => setRange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading || !summary ? (
        <p className="muted">{slowLoad ? 'Waking up the server — this can take a few seconds…' : 'Loading…'}</p>
      ) : (
        <>
          <div className={styles.grid}>
            <StatCard label="Combined revenue" value={formatMoney(summary.combinedRevenue)} icon="💰" tone="green" />
            <StatCard label="Bookings" value={summary.bookingsCount} icon="📅" tone="blue" />
            <StatCard label="Total clients" value={summary.totalClients} icon="👥" tone="violet" />
            <StatCard label="Completion rate" value={`${summary.completionRate}%`} icon="✅" tone="aqua" />
            <StatCard label="Loyalty members" value={summary.loyaltyMembers} icon="⭐" tone="orange" />
          </div>

          <div className={styles.charts}>
            <section className="card">
              <h2 style={{ marginTop: 0 }}>Daily bookings</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={bookingsData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatTick}
                    interval={tickInterval}
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                    tickLine={false}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip
                    labelFormatter={formatTick}
                    formatter={(value) => [value, 'Bookings']}
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13 }}
                  />
                  <Bar dataKey="count" fill={BOOKINGS_COLOR} radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="card">
              <h2 style={{ marginTop: 0 }}>Daily revenue</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatTick}
                    interval={tickInterval}
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickFormatter={(v) => `R${v}`}
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip
                    labelFormatter={formatTick}
                    formatter={(value) => [formatMoney(value), 'Revenue']}
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13 }}
                  />
                  <Bar dataKey="amount" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
