import React, { useState, useEffect, useCallback } from 'react';
import { apiConfig } from '../../../../config/api';

// ─── Real API fetch ───────────────────────────────────────────────────────────
// Fetches aggregated broadcast KPIs and recent 5 campaigns from the database.
// `timeRange` supports 'all-time' | 'last_7_days' | 'last_30_days' | 'last_quarter'
const fetchDashboardData = async (userId, timeRange) => {
  const token = localStorage.getItem('authToken');
  const url = `${apiConfig.dbServerConfig.baseURL}/api/broadcasts/user/${userId}/dashboard?timeRange=${timeRange}`;

  const response = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch dashboard data');
  }

  const result = await response.json();
  return result.data;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_STYLES = {
  Completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Running:   'bg-blue-50   text-blue-700   ring-1 ring-blue-200',
  Scheduled: 'bg-amber-50  text-amber-700  ring-1 ring-amber-200',
  Failed:    'bg-red-50    text-red-700    ring-1 ring-red-200',
};

const RANGE_LABELS = {
  'all-time':     'All Time',
  'last_7_days':  'Last 7 Days',
  'last_30_days': 'Last 30 Days',
  'last_quarter': 'Last Quarter',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className = '' }) => (
  <span className={`skeleton inline-block ${className}`}>&nbsp;</span>
);

// ─── KPI card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon, iconBg, label, value, sub, loading, delay = '' }) => (
  <div className={`card p-5 card-lift animate-fadeUp ${delay}`}>
    <div className="flex items-start gap-4">
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.14em] mb-1.5">{label}</p>
        {loading
          ? <Sk className="h-7 w-32 block mb-1" />
          : <p className="text-[22px] font-bold text-slate-900 leading-tight tabular-nums">{value}</p>}
        {loading
          ? <Sk className="h-4 w-40 block mt-1" />
          : <p className="text-xs text-slate-400 mt-1 leading-snug">{sub}</p>}
      </div>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * DashboardOverview
 *
 * Props (all optional):
 *   timeRange – 'all-time' | 'last_7_days' | 'last_30_days' | 'last_quarter'
 *               Pass from parent to control the range externally.
 *               Omit to let this component render its own selector.
 */
const DashboardOverview = ({ timeRange: externalRange, user, userData } = {}) => {
  const [internalRange, setInternalRange] = useState('all-time');
  const timeRange = externalRange !== undefined ? externalRange : internalRange;

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Initial load (shows skeleton spinner) ──────────────────────────────────
  useEffect(() => {
    const userId = userData?.db_id || user?.db_id;
    if (!userId) {
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);
    fetchDashboardData(userId, timeRange)
      .then((d) => {
        if (alive) { setData(d); setLoading(false); }
      })
      .catch((err) => {
        if (alive) {
          console.error('Dashboard fetch error:', err);
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { alive = false; };
  }, [timeRange, user, userData]);

  // ── 30-second background polling (silent — no loading flash) ───────────────
  useEffect(() => {
    const userId = userData?.db_id || user?.db_id;
    if (!userId) return;

    const POLL_INTERVAL_MS = 30_000;

    const poll = () => {
      fetchDashboardData(userId, timeRange)
        .then((d) => setData(d))
        .catch((err) => console.warn('Dashboard poll error (silent):', err));
    };

    const intervalId = setInterval(poll, POLL_INTERVAL_MS);

    // Cleanup: stop polling when component unmounts or dependencies change
    return () => clearInterval(intervalId);
  }, [timeRange, user, userData]);

  const rangeLabel    = RANGE_LABELS[timeRange] || 'All Time';
  const hasBroadcasts = !loading && data?.recentBroadcasts?.length > 0;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full animate-fadeIn">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Broadcast performance &amp; attributed revenue
          </p>
        </div>

        {/* Time range control – only when parent isn't controlling it */}
        {externalRange === undefined && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label htmlFor="dashRangeSelect" className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Period:
            </label>
            <select
              id="dashRangeSelect"
              value={internalRange}
              onChange={(e) => setInternalRange(e.target.value)}
              className="input !py-2 !px-3 text-xs w-40"
            >
              <option value="all-time">All Time</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_quarter">Last Quarter</option>
            </select>
          </div>
        )}
      </div>

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          delay="delay-75"
          loading={loading}
          iconBg="bg-emerald-50"
          icon={
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Attributed Revenue"
          value={data ? fmt(data.attributedRevenue) : '—'}
          sub={`Orders via broadcast UTM & discount links · ${rangeLabel}`}
        />

        <KpiCard
          delay="delay-150"
          loading={loading}
          iconBg="bg-blue-50"
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          label="Actual ROI / ROAS"
          value={data ? `${data.actualRoi}%  ·  ${data.roas}×` : '—'}
          sub="Return generated vs. WhatsApp messaging costs"
        />

        <KpiCard
          delay="delay-225"
          loading={loading}
          iconBg="bg-violet-50"
          icon={
            <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          }
          label="Total Broadcasts"
          value={data ? data.totalBroadcasts.toLocaleString() : '—'}
          sub={`Cumulative campaigns triggered · ${rangeLabel}`}
        />

        <KpiCard
          delay="delay-300"
          loading={loading}
          iconBg="bg-amber-50"
          icon={
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Delivered & Read"
          value={data ? `${data.messagesDelivered.toLocaleString()} msgs` : '—'}
          sub={data ? `${data.readRate}% read rate · ${rangeLabel}` : '—'}
        />
      </div>

      {/* ── Campaign table ── */}
      <div className="card animate-fadeUp delay-300">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Recent Broadcasts</h2>
            <p className="text-xs text-slate-400 mt-0.5">Last 5 campaigns · {rangeLabel}</p>
          </div>
        </div>

        {loading ? (
          /* Skeleton rows */
          <div className="divide-y divide-slate-50">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-6">
                <Sk className="h-4 w-36" />
                <Sk className="h-4 w-20" />
                <Sk className="h-4 w-16 ml-auto" />
                <Sk className="h-4 w-12" />
                <Sk className="h-4 w-12" />
                <Sk className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : hasBroadcasts ? (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] bg-slate-50/70">
                  <th className="px-5 py-3 text-left">Campaign</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-right">Recipients</th>
                  <th className="px-5 py-3 text-right">Delivery</th>
                  <th className="px-5 py-3 text-right">Click</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentBroadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                      {b.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap text-xs">
                      {fmtDate(b.date)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-600 tabular-nums">
                      {b.recipients.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-semibold tabular-nums ${b.deliveryPct >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {b.deliveryPct}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-semibold tabular-nums ${b.clickPct >= 15 ? 'text-blue-600' : 'text-slate-500'}`}>
                        {b.clickPct}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[b.status] || 'bg-slate-100 text-slate-600'}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">No broadcasts sent yet</h3>
            <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">
              Create your first campaign to see delivery and sales metrics here.
            </p>
            <button className="btn-primary mt-6 text-xs gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Create your first campaign
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;
