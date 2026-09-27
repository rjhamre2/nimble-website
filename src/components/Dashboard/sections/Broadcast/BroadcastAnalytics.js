import React, { useState, useEffect } from 'react';
import { apiConfig } from '../../../../config/api';
import { 
  IndianRupee, 
  TrendingUp, 
  MousePointerClick, 
  ShoppingCart, 
  ShieldCheck, 
  AlertTriangle, 
  CreditCard,
  Package,
  Activity,
  ArrowRight
} from "lucide-react";

const BroadcastAnalytics = ({ onNewBroadcastClick, user, userData }) => {
  const [historicalCampaigns, setHistoricalCampaigns] = useState([]);
  const [latestBroadcast, setLatestBroadcast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserBroadcasts = async () => {
      try {
        const dbId = userData?.db_id || user?.db_id;
        if (!dbId) {
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${apiConfig.dbServerConfig.baseURL}/api/broadcasts/user/${dbId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch broadcasts');
        
        // Map the fetched data to match the UI format
        const formattedCampaigns = (data.data || []).map(broadcast => ({
          name: broadcast.name || "Unnamed Broadcast",
          date: new Date(broadcast.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          segment: broadcast.audienceListId ? `List: ${broadcast.audienceListId}` : "All Audience", 
          openRate: broadcast.stats?.openRate || "0%",
          clickRate: broadcast.stats?.clickRate || "0%",
          revenue: broadcast.stats?.revenue || "₹0"
        }));
        
        setHistoricalCampaigns(formattedCampaigns);
        setLatestBroadcast(data.data?.[0] || null);
      } catch (error) {
        console.error("Error fetching broadcasts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserBroadcasts();
  }, [user, userData]);

  const sent = parseInt(latestBroadcast?.messages_sent) || 0;
  const delivered = parseInt(latestBroadcast?.messages_delivered) || 0;
  const read = parseInt(latestBroadcast?.messages_read) || 0;
  const clicked = parseInt(latestBroadcast?.messages_clicked) || 0; 
  const converted = parseInt(latestBroadcast?.messages_converted) || 0;

  const funnelData = [
    { label: "Sent", count: sent.toLocaleString(), pct: sent ? 100 : 0, color: "bg-gray-200" },
    { label: "Delivered", count: delivered.toLocaleString(), pct: sent ? Math.round((delivered/sent)*100) : 0, color: "bg-blue-200" },
    { label: "Read", count: read.toLocaleString(), pct: sent ? Math.round((read/sent)*100) : 0, color: "bg-purple-200" },
    { label: "Clicked", count: clicked.toLocaleString(), pct: sent ? Math.round((clicked/sent)*100) : 0, color: "bg-yellow-200" },
    { label: "Converted", count: converted.toLocaleString(), pct: sent ? Math.round((converted/sent)*100) : 0, color: "bg-[#25D366]" }
  ];

  const heroCards = [
    { title: "Attributed Revenue", value: latestBroadcast?.attributed_revenue ? `₹${Number(latestBroadcast.attributed_revenue).toLocaleString()}` : "₹0", icon: IndianRupee, color: "text-[#25D366]", bg: "bg-[#25D366]/10", sub: "24-hour attribution window" },
    { title: "Campaign Cost", value: latestBroadcast?.campaign_cost ? `₹${Number(latestBroadcast.campaign_cost).toLocaleString()}` : "₹0", icon: Activity, color: "text-gray-700", bg: "bg-gray-100", sub: "Meta API + Platform fees" },
    { title: "ROAS", value: latestBroadcast?.roas ? `${Number(latestBroadcast.roas).toFixed(1)}x` : "0.0x", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100", sub: "Return on ad spend" },
    { title: "Conversion Rate", value: latestBroadcast?.conversion_rate ? `${Number(latestBroadcast.conversion_rate).toFixed(1)}%` : "0.0%", icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-100", sub: "From delivered to ordered" }
  ];


  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Broadcast Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">Performance metrics for your latest campaign</p>
        </div>
        <button
          onClick={onNewBroadcastClick}
          className="btn-primary text-xs gap-1.5 self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Broadcast
        </button>
      </div>

      {/* ── Hero KPI cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {heroCards.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="card p-5 card-lift">
              <div className={`w-9 h-9 rounded-xl ${metric.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${metric.color}`} size={18} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">{metric.title}</p>
              <p className="text-xl font-bold text-slate-900 tabular-nums leading-tight">{metric.value}</p>
              <p className="text-[11px] text-slate-400 mt-1">{metric.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Funnel + E-commerce ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Conversion funnel */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-0.5">Conversion Funnel</h3>
          <p className="text-xs text-slate-400 mb-5">Drop-off at every stage of the campaign journey.</p>
          <div className="space-y-4">
            {funnelData.map((step, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 w-20">{step.label}</span>
                  <span className="text-slate-400 tabular-nums">{step.pct}% ({step.count})</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${step.color}`}
                    style={{ width: `${step.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* E-commerce impact */}
        <div className="card p-6 flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 mb-0.5">E-commerce Impact</h3>
          <p className="text-xs text-slate-400 mb-5">Revenue & product performance.</p>

          <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Avg. Order Value</div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">₹1,850</div>
          </div>

          <div className="mb-5">
            <div className="flex justify-between text-xs font-semibold mb-2 text-slate-600">
              <span>Prepaid (70%)</span>
              <span>COD (30%)</span>
            </div>
            <div className="h-2 w-full flex rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[70%]" />
              <div className="h-full bg-amber-400 w-[30%]" />
            </div>
          </div>

          <div className="flex-1">
            <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">Top Products</h4>
            <ul className="space-y-2.5 text-sm">
              {['Signature Gold Hoops', 'Minimalist Ring Set', 'Diamond Bracelet'].map((prod, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs truncate mr-2">{prod}</span>
                  <span className="font-bold text-slate-800 text-xs">#{i + 1}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Account health + Historical table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Account Health – dark card */}
        <div className="rounded-2xl bg-slate-900 p-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#25D366] rounded-full blur-[70px] opacity-20 pointer-events-none" />
          <h3 className="text-sm font-bold text-white mb-0.5">Account Health</h3>
          <p className="text-xs text-slate-400 mb-5">WABA metrics & API telemetry.</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div>
                <div className="text-xs font-medium text-slate-300">Opt-Out Rate</div>
                <div className="text-[10px] text-slate-500">Target: &lt; 1.5%</div>
              </div>
              <div className="text-lg font-bold text-[#25D366] tabular-nums">0.8%</div>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div>
                <div className="text-xs font-medium text-slate-300">Bounce / Failed</div>
                <div className="text-[10px] text-slate-500">Auto-purged from list</div>
              </div>
              <div className="text-lg font-bold text-amber-400 tabular-nums">0.2%</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-xs font-medium text-slate-300">Phone Quality</div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 text-[11px] font-bold text-[#25D366]">
                <ShieldCheck size={12} />
                EXCELLENT
              </span>
            </div>
          </div>
        </div>

        {/* Historical comparison table */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Historical Comparison</h3>
            <p className="text-xs text-slate-400 mt-0.5">Identify top-performing campaigns.</p>
          </div>
          <div className="overflow-x-auto flex-1 scrollbar-thin">
            <table className="w-full text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-5 py-3 text-left">Campaign</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Segment</th>
                  <th className="px-5 py-3 text-right">Open</th>
                  <th className="px-5 py-3 text-right">Click</th>
                  <th className="px-5 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-slate-400">Loading campaigns…</td>
                  </tr>
                ) : historicalCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                      No broadcast history yet.
                    </td>
                  </tr>
                ) : historicalCampaigns.map((camp, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{camp.name}</td>
                    <td className="px-5 py-3.5 text-slate-400">{camp.date}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">{camp.segment}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-700">{camp.openRate}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-700">{camp.clickRate}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-[#25D366]">{camp.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastAnalytics;
