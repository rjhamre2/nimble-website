import React from 'react';
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

const BroadcastAnalytics = ({ onNewBroadcastClick }) => {
  // Mock data for the historical table based on your specs
  const historicalCampaigns = [
    {
      name: "Carat&Chrome Akshaya Tritiya Blast",
      date: "May 12, 2026",
      segment: "All Past Buyers",
      openRate: "91.2%",
      clickRate: "22.4%",
      revenue: "₹4,12,500"
    },
    {
      name: "Abandoned Cart Sequence (Automated)",
      date: "Ongoing",
      segment: "Cart Drop-offs",
      openRate: "88.5%",
      clickRate: "19.1%",
      revenue: "₹1,89,200 (Mo)"
    },
    {
      name: "Weekend Flash Sale",
      date: "Apr 18, 2026",
      segment: "Tag: High Spenders",
      openRate: "79.4%",
      clickRate: "15.2%",
      revenue: "₹2,45,000"
    }
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
        {[
          { title: "Attributed Revenue", value: "₹4,12,500", icon: IndianRupee, color: "text-[#25D366]", bg: "bg-[#25D366]/10", sub: "24-hour attribution window" },
          { title: "Campaign Cost", value: "₹33,266", icon: Activity, color: "text-gray-700", bg: "bg-gray-100", sub: "Meta API + Platform fees" },
          { title: "ROAS", value: "12.4x", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100", sub: "Return on ad spend" },
          { title: "Conversion Rate", value: "3.2%", icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-100", sub: "From delivered to ordered" }
        ].map((metric, i) => (
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
            {[
              { label: "Sent", count: "10,000", pct: 100, color: "bg-gray-200" },
              { label: "Delivered", count: "9,820", pct: 98.2, color: "bg-blue-200" },
              { label: "Read", count: "8,500", pct: 85.0, color: "bg-purple-200" },
              { label: "Clicked", count: "1,850", pct: 18.5, color: "bg-yellow-200" },
              { label: "Converted", count: "320", pct: 3.2, color: "bg-[#25D366]" }
            ].map((step, i) => (
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
                {historicalCampaigns.map((camp, index) => (
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