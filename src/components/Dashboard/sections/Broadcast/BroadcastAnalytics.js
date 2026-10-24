import React, { useState, useEffect, useCallback } from 'react';
import { apiConfig } from '../../../../config/api';
import websocketService from '../../../../services/websocketService';
import { 
  IndianRupee, 
  TrendingUp, 
  MousePointerClick, 
  ShoppingCart, 
  Activity, 
  Clock,
  Send,
  CheckCheck,
  Eye,
  Megaphone,
  Calendar,
  Info,
  X
} from "lucide-react";

const BroadcastAnalytics = ({ onNewBroadcastClick, user, userData }) => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReadReceiptInfo, setShowReadReceiptInfo] = useState(false);

  // 1. Fetch user broadcasts
  const fetchUserBroadcasts = useCallback(async (showLoading = true) => {
    try {
      const dbId = userData?.db_id || user?.db_id;
      if (!dbId) {
        if (showLoading) setIsLoading(false);
        return;
      }

      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const response = await fetch(`${apiConfig.dbServerConfig.baseURL}/api/broadcasts/user/${dbId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch broadcasts');
      
      const list = data.data || [];
      setBroadcasts(list);
      setSelectedBroadcastId(prev => {
        if (prev && list.some(b => b.broadcast_id === prev)) return prev;
        return list[0]?.broadcast_id || null;
      });
    } catch (error) {
      console.error("Error fetching broadcasts:", error);
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, userData]);

  // Initial load
  useEffect(() => {
    fetchUserBroadcasts(true);
  }, [fetchUserBroadcasts]);

  const selectedBroadcast = broadcasts.find(b => b.broadcast_id === selectedBroadcastId) || broadcasts[0] || null;

  // Extract funnel metrics with accurate calculations and fallbacks
  const delivered = parseInt(selectedBroadcast?.messages_delivered) || 0;
  const read = parseInt(selectedBroadcast?.messages_read) || 0;
  const clicked = parseInt(selectedBroadcast?.messages_clicked) || 0; 
  const converted = parseInt(selectedBroadcast?.messages_converted) || 0;
  
  // Sent is at least delivered
  const rawSent = parseInt(selectedBroadcast?.messages_sent) || 0;
  const sent = Math.max(rawSent, delivered);

  // Queued is known immediately from messages_queued, recipient_count, or audience_count
  const rawQueued = parseInt(selectedBroadcast?.messages_queued) || 
                    parseInt(selectedBroadcast?.recipient_count) || 
                    parseInt(selectedBroadcast?.audience_count) || 
                    0;
  const queued = Math.max(rawQueued, sent);

  // 2. WebSocket listener for live message and broadcast updates
  useEffect(() => {
    const dbId = userData?.db_id || user?.db_id;
    if (dbId) {
      websocketService.connect(dbId);
    }

    const handleRealtimeUpdate = () => {
      // Trigger background sync when any message status or broadcast updates
      fetchUserBroadcasts(false);
    };

    websocketService.onMessage('message_updated', handleRealtimeUpdate);
    websocketService.onMessage('message_update', handleRealtimeUpdate);
    websocketService.onMessage('new_message', handleRealtimeUpdate);
    websocketService.onMessage('broadcast_updated', handleRealtimeUpdate);

    return () => {
      websocketService.offMessage('message_updated', handleRealtimeUpdate);
      websocketService.offMessage('message_update', handleRealtimeUpdate);
      websocketService.offMessage('new_message', handleRealtimeUpdate);
      websocketService.offMessage('broadcast_updated', handleRealtimeUpdate);
    };
  }, [user, userData, fetchUserBroadcasts]);

  // 3. Smart interval polling fallback (every 3s when processing/sending, every 10s otherwise)
  useEffect(() => {
    const isProcessing = selectedBroadcast?.status === 'processing' || 
                         (queued > 0 && (sent < queued || delivered < sent));
    const intervalMs = isProcessing ? 3000 : 10000;

    const timer = setInterval(() => {
      fetchUserBroadcasts(false);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [selectedBroadcast?.status, queued, sent, delivered, fetchUserBroadcasts]);

  const funnelData = [
    { 
      label: "Queued", 
      count: queued.toLocaleString(), 
      displayCount: queued.toLocaleString(),
      pct: queued > 0 ? 100 : 0, 
      displayPct: `${queued > 0 ? 100 : 0}%`,
      color: "bg-slate-400",
      accent: "text-slate-700 bg-slate-100",
      icon: Clock,
      sub: "Enqueued recipients"
    },
    { 
      label: "Sent", 
      count: sent.toLocaleString(), 
      displayCount: sent.toLocaleString(),
      pct: queued > 0 ? Math.round((sent / queued) * 100) : (sent > 0 ? 100 : 0), 
      displayPct: `${queued > 0 ? Math.round((sent / queued) * 100) : (sent > 0 ? 100 : 0)}%`,
      color: "bg-sky-500",
      accent: "text-sky-700 bg-sky-50",
      icon: Send,
      sub: "Dispatched to Meta"
    },
    { 
      label: "Delivered", 
      count: delivered.toLocaleString(), 
      displayCount: delivered.toLocaleString(),
      pct: queued > 0 ? Math.round((delivered / queued) * 100) : (sent > 0 ? Math.round((delivered / sent) * 100) : 0), 
      displayPct: `${queued > 0 ? Math.round((delivered / queued) * 100) : (sent > 0 ? Math.round((delivered / sent) * 100) : 0)}%`,
      color: "bg-indigo-500",
      accent: "text-indigo-700 bg-indigo-50",
      icon: CheckCheck,
      sub: "Arrived on handset"
    },
    { 
      label: "Read", 
      isRead: true,
      count: read.toLocaleString(), 
      displayCount: `>${read.toLocaleString()}`,
      pct: queued > 0 ? Math.round((read / queued) * 100) : (sent > 0 ? Math.round((read / sent) * 100) : 0), 
      displayPct: `>${queued > 0 ? Math.round((read / queued) * 100) : (sent > 0 ? Math.round((read / sent) * 100) : 0)}%`,
      color: "bg-purple-500",
      accent: "text-purple-700 bg-purple-50",
      icon: Eye,
      sub: "Opened by recipient"
    },
    { 
      label: "Clicked", 
      count: clicked.toLocaleString(), 
      displayCount: clicked.toLocaleString(),
      pct: queued > 0 ? Math.round((clicked / queued) * 100) : (sent > 0 ? Math.round((clicked / sent) * 100) : 0), 
      displayPct: `${queued > 0 ? Math.round((clicked / queued) * 100) : (sent > 0 ? Math.round((clicked / sent) * 100) : 0)}%`,
      color: "bg-amber-500",
      accent: "text-amber-700 bg-amber-50",
      icon: MousePointerClick,
      sub: "Button interactions"
    },
    { 
      label: "Converted", 
      count: converted.toLocaleString(), 
      displayCount: converted.toLocaleString(),
      pct: queued > 0 ? Math.round((converted / queued) * 100) : (sent > 0 ? Math.round((converted / sent) * 100) : 0), 
      displayPct: `${queued > 0 ? Math.round((converted / queued) * 100) : (sent > 0 ? Math.round((converted / sent) * 100) : 0)}%`,
      color: "bg-[#25D366]",
      accent: "text-[#128C7E] bg-[#25D366]/10",
      icon: ShoppingCart,
      sub: "Purchased orders"
    }
  ];

  const heroCards = [
    { title: "Attributed Revenue", value: selectedBroadcast?.attributed_revenue ? `₹${Number(selectedBroadcast.attributed_revenue).toLocaleString()}` : "₹0", icon: IndianRupee, color: "text-[#25D366]", bg: "bg-[#25D366]/10", sub: "24-hour attribution window" },
    { title: "Campaign Cost", value: selectedBroadcast?.campaign_cost ? `₹${Number(selectedBroadcast.campaign_cost).toLocaleString()}` : "₹0", icon: Activity, color: "text-gray-700", bg: "bg-gray-100", sub: "Meta API + Platform fees" },
    { title: "ROAS", value: selectedBroadcast?.roas ? `${Number(selectedBroadcast.roas).toFixed(1)}x` : "0.0x", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100", sub: "Return on ad spend" },
    { title: "Conversion Rate", value: selectedBroadcast?.conversion_rate ? `${Number(selectedBroadcast.conversion_rate).toFixed(1)}%` : "0.0%", icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-100", sub: "From delivered to ordered" }
  ];

  const broadcastName = selectedBroadcast?.name || "Unnamed Broadcast";
  const broadcastDate = selectedBroadcast?.created_at
    ? new Date(selectedBroadcast.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : "Recent";

  // Formatted campaigns for comparison table
  const formattedCampaigns = broadcasts.map(b => {
    const bDelivered = parseInt(b.messages_delivered) || 0;
    const bRead = parseInt(b.messages_read) || 0;
    const bClicked = parseInt(b.messages_clicked) || 0;
    const bSent = Math.max(parseInt(b.messages_sent) || 0, bDelivered);
    const bQueued = Math.max(
      parseInt(b.messages_queued) || 0,
      parseInt(b.recipient_count) || 0,
      parseInt(b.audience_count) || 0,
      bSent
    );
    const openRate = bDelivered > 0 ? `>${Math.round((bRead / bDelivered) * 100)}%` : '0%';
    const clickRate = bDelivered > 0 ? `${Math.round((bClicked / bDelivered) * 100)}%` : '0%';
    const revenue = b.attributed_revenue ? `₹${Number(b.attributed_revenue).toLocaleString()}` : '₹0';
    return {
      id: b.broadcast_id,
      name: b.name || "Unnamed Broadcast",
      date: new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: b.status || 'completed',
      segment: b.audience_list_id ? `List: ${String(b.audience_list_id).slice(0, 8)}…` : "All Audience",
      queued: bQueued,
      sent: bSent,
      delivered: bDelivered,
      read: bRead > 0 ? `>${bRead}` : "0",
      openRate,
      clickRate,
      revenue
    };
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Broadcast Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">Performance metrics and real-time delivery progression</p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Live Sync Status Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Sync</span>
          </div>

          {/* Quick Refresh Button */}
          <button
            onClick={() => fetchUserBroadcasts(false)}
            disabled={isRefreshing}
            className="btn-outline text-xs gap-1.5 py-1.5 px-3"
            title="Sync metrics now"
          >
            <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isRefreshing ? 'Syncing…' : 'Refresh'}</span>
          </button>

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
      </div>

      {/* ── Active Broadcast Banner (Showing Broadcast Name) ── */}
      <div className="card p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#25D366] rounded-full blur-[100px] opacity-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
                Active Broadcast
              </span>
              {selectedBroadcast?.status && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/10 text-slate-300">
                  {selectedBroadcast.status}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#25D366] shrink-0" />
              <span>{broadcastName}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {broadcastDate}
              </span>
              <span>•</span>
              <span>{selectedBroadcast?.audience_list_id ? `Audience: ${String(selectedBroadcast.audience_list_id).slice(0, 8)}…` : "Audience: All Contacts"}</span>
              <span>•</span>
              <span className="text-slate-300 font-medium">{queued.toLocaleString()} Recipient{queued !== 1 ? 's' : ''} Enqueued</span>
            </div>
          </div>

          {/* Broadcast Switcher Dropdown (when multiple broadcasts exist) */}
          {broadcasts.length > 1 && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 pl-3 rounded-xl border border-white/10 self-start md:self-auto">
              <span className="text-xs text-slate-300 font-medium whitespace-nowrap">Switch Campaign:</span>
              <select
                value={selectedBroadcastId || ''}
                onChange={(e) => setSelectedBroadcastId(e.target.value)}
                className="bg-slate-800 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#25D366] cursor-pointer"
              >
                {broadcasts.map((b) => (
                  <option key={b.broadcast_id} value={b.broadcast_id} className="bg-slate-900 text-white">
                    {b.name || "Unnamed Broadcast"} ({new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
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

      {/* ── Conversion Funnel (Full Width: Queued, Sent, Delivered, Read, Clicked, Converted) ── */}
      <div className="card p-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Campaign Delivery & Conversion Funnel</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time progression through Queued, Sent, Delivered, Read, Clicked, and Converted</p>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
            {broadcastName}
          </div>
        </div>

        {/* Step-by-step pipeline badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {funnelData.map((step, i) => {
            const StepIcon = step.icon;
            return (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{step.label}</span>
                    {step.isRead && (
                      <button
                        type="button"
                        onClick={() => setShowReadReceiptInfo(true)}
                        className="text-slate-400 hover:text-purple-600 transition-colors p-0.5 rounded-full hover:bg-purple-50 inline-flex items-center justify-center"
                        title="Why does this show '>'? Click for details"
                      >
                        <Info size={12} />
                      </button>
                    )}
                  </div>
                  <div className={`w-6 h-6 rounded-lg ${step.accent} flex items-center justify-center`}>
                    <StepIcon size={13} />
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums flex items-center gap-1">
                    <span>{step.displayCount || step.count}</span>
                    {step.isRead && (
                      <button
                        type="button"
                        onClick={() => setShowReadReceiptInfo(true)}
                        className="text-purple-500 hover:text-purple-700 transition-colors"
                        title="Click to learn about WhatsApp read receipts"
                      >
                        <Info size={13} />
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 mt-0.5">{step.displayPct || `${step.pct}%`} of queued</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Funnel Progress Bars */}
        <div className="space-y-4 pt-2">
          {funnelData.map((step, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 w-24 flex items-center gap-1">
                    {step.label}
                    {step.isRead && (
                      <button
                        type="button"
                        onClick={() => setShowReadReceiptInfo(true)}
                        className="text-slate-400 hover:text-purple-600 transition-colors p-0.5 inline-flex items-center"
                        title="Why is this greater than (>)? Click for info"
                      >
                        <Info size={12} />
                      </button>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">{step.sub}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 tabular-nums">{step.displayCount || step.count}</span>
                  <span className="text-slate-400 tabular-nums">({step.displayPct || `${step.pct}%`})</span>
                </div>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${step.color}`}
                  style={{ width: `${Math.min(100, Math.max(0, step.pct))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Historical Comparison Table (Full Width) ── */}
      <div className="card overflow-hidden flex flex-col w-full">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Historical Comparison</h3>
            <p className="text-xs text-slate-400 mt-0.5">Click any campaign to inspect its performance metrics</p>
          </div>
          {broadcasts.length > 0 && (
            <span className="text-xs text-slate-400">Total: {broadcasts.length} broadcast{broadcasts.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="overflow-x-auto flex-1 scrollbar-thin">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="px-5 py-3 text-left">Campaign</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Segment</th>
                <th className="px-5 py-3 text-right">Queued</th>
                <th className="px-5 py-3 text-right">Sent</th>
                <th className="px-5 py-3 text-right">Delivered</th>
                <th className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span>Open Rate</span>
                    <button
                      type="button"
                      onClick={() => setShowReadReceiptInfo(true)}
                      className="text-slate-400 hover:text-purple-600 transition-colors"
                      title="Why are open rates marked with '>'? Click for details"
                    >
                      <Info size={11} />
                    </button>
                  </div>
                </th>
                <th className="px-5 py-3 text-right">Click Rate</th>
                <th className="px-5 py-3 text-right">Revenue</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="px-5 py-8 text-center text-slate-400">Loading campaigns…</td>
                </tr>
              ) : formattedCampaigns.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-5 py-12 text-center text-slate-400">
                    No broadcast history yet.
                  </td>
                </tr>
              ) : formattedCampaigns.map((camp) => {
                const isSelected = camp.id === selectedBroadcastId;
                return (
                  <tr 
                    key={camp.id} 
                    onClick={() => setSelectedBroadcastId(camp.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/60 font-semibold' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="px-5 py-3.5 text-slate-800 flex items-center gap-2">
                      {isSelected && <span className="w-2 h-2 rounded-full bg-[#25D366]" />}
                      <span>{camp.name}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{camp.date}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">{camp.segment}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-600 tabular-nums">{camp.queued}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-600 tabular-nums">{camp.sent}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-600 tabular-nums">{camp.delivered}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-700">{camp.openRate}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-700">{camp.clickRate}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-[#25D366]">{camp.revenue}</td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBroadcastId(camp.id);
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                          isSelected
                            ? 'bg-[#25D366] text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Viewing' : 'View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Read Receipts Privacy Info Modal ── */}
      {showReadReceiptInfo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowReadReceiptInfo(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Eye size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Why does Read show a &gt; sign?</h4>
                  <p className="text-xs text-slate-400">WhatsApp Read Receipts & Privacy</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReadReceiptInfo(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
              <p>
                The actual number of people who opened your broadcast is <strong>greater than the number shown</strong>.
              </p>
              <p>
                When WhatsApp users turn off <strong>Read Receipts (blue ticks)</strong> in their privacy settings, WhatsApp does not notify our system when they open your broadcast, even if they read it completely.
              </p>
              <p className="text-slate-500">
                Therefore, this number only includes recipients with read receipts enabled. The real number of readers is higher.
              </p>
            </div>

            <button
              onClick={() => setShowReadReceiptInfo(false)}
              className="btn-primary w-full text-xs py-2.5"
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default BroadcastAnalytics;
