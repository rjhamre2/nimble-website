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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">Campaign Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time performance for your latest broadcast.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Export Report
          </button>
          <button 
            onClick={onNewBroadcastClick}
            className="px-4 py-2 text-sm font-medium text-white bg-[#25D366] rounded-lg shadow-[0_0_20px_rgba(37,211,102,0.2)] hover:scale-[1.02] transition-all"
          >
            New Broadcast
          </button>
        </div>
      </div>

      {/* 1. The Financial Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {heroCards.map((metric, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${metric.bg}`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-[#0A0A0A] tracking-tight">{metric.value}</h3>
            <p className="text-sm font-medium text-gray-700 mt-1">{metric.title}</p>
            <p className="text-xs text-gray-400 mt-1">{metric.sub}</p>
          </div>
        ))}
      </div>

      {/* Bento Grid Layer 1: Funnel & E-commerce */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. The Conversational Marketing Funnel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#0A0A0A] mb-1">Conversion Funnel</h3>
          <p className="text-sm text-gray-500 mb-6">Diagnose copy and offer drop-offs at every micro-interaction.</p>
          
          <div className="space-y-5">
            {funnelData.map((step, i) => (
              <div key={i} className="relative">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700 w-24">{step.label}</span>
                  <span className="text-gray-500 font-medium">{step.pct}% ({step.count})</span>
                </div>
                <div className="h-3 w-full bg-[#F9FAFB] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${step.color}`} 
                    style={{ width: `${step.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. E-commerce Specific Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-bold text-[#0A0A0A] mb-1">E-commerce Impact</h3>
          <p className="text-sm text-gray-500 mb-6">Cash flow & product performance.</p>

          <div className="bg-[#F9FAFB] rounded-lg p-4 mb-4 border border-gray-100">
            <div className="text-sm text-gray-500 font-medium mb-1">Average Order Value (AOV)</div>
            <div className="text-2xl font-bold text-[#0A0A0A]">₹1,850</div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-gray-700 flex items-center gap-1"><CreditCard className="w-4 h-4"/> Prepaid (70%)</span>
              <span className="text-gray-700">COD (30%)</span>
            </div>
            <div className="h-2 w-full flex rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[70%]" />
              <div className="h-full bg-orange-400 w-[30%]" />
            </div>
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-semibold text-[#0A0A0A] mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" /> Top Products Driven
            </h4>
            <ul className="space-y-3 text-sm">
              {['Signature Gold Hoops', 'Minimalist Ring Set', 'Diamond Tennis Bracelet'].map((prod, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-gray-600 truncate mr-2">{prod}</span>
                  <span className="font-semibold text-gray-900">#{i + 1}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bento Grid Layer 2: Deliverability & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 4. Deliverability & Account Health Telemetry */}
        <div className="bg-[#0A0A0A] rounded-xl p-6 shadow-lg relative overflow-hidden">
          {/* Subtle background glow effect for dark mode bento */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366] rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
          
          <h3 className="text-lg font-bold text-white mb-1">Account Health</h3>
          <p className="text-sm text-gray-400 mb-6">WABA metrics and API telemetry.</p>
          
          <div className="space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div>
                <div className="text-sm font-medium text-gray-300">Opt-Out Rate</div>
                <div className="text-xs text-gray-500">Target: &lt; 1.5%</div>
              </div>
              <div className="text-xl font-bold text-[#25D366]">0.8%</div>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div>
                <div className="text-sm font-medium text-gray-300">Bounce / Failed</div>
                <div className="text-xs text-gray-500">Auto-purged from list</div>
              </div>
              <div className="text-xl font-bold text-yellow-400">0.2%</div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-gray-300">Phone Quality Score</div>
              <div className="px-3 py-1 bg-[#25D366]/20 border border-[#25D366]/50 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#25D366]" />
                <span className="text-xs font-bold text-[#25D366]">EXCELLENT</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Historical Campaigns Comparison Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-[#0A0A0A] mb-1">Historical Comparison</h3>
            <p className="text-sm text-gray-500">Review past campaigns to identify top-performing hooks.</p>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F9FAFB] text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Campaign Name</th>
                  <th className="px-6 py-3">Date Sent</th>
                  <th className="px-6 py-3">Audience Segment</th>
                  <th className="px-6 py-3">Open Rate</th>
                  <th className="px-6 py-3">Click Rate</th>
                  <th className="px-6 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">Loading campaigns...</td>
                  </tr>
                ) : historicalCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No broadcast history found</td>
                  </tr>
                ) : historicalCampaigns.map((camp, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-[#0A0A0A]">{camp.name}</td>
                    <td className="px-6 py-4 text-gray-500">{camp.date}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                        {camp.segment}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{camp.openRate}</td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{camp.clickRate}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#25D366]">{camp.revenue}</td>
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