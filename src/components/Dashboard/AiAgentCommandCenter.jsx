import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  CircleStackIcon,
  SparklesIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import LiveInboxView from './ai-agent/LiveInboxView';
import KnowledgeBaseManagerView from './ai-agent/KnowledgeBaseManagerView';
import {
  getTenantId,
  fetchGlobalAgentSettings,
  updateGlobalAgentSettings,
  connectAiAgentSocket
} from '../../services/aiAgentService';

export default function AiAgentCommandCenter({ user, userData }) {
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'kb'
  const [aiGlobalActive, setAiGlobalActive] = useState(true);
  const [updatingGlobal, setUpdatingGlobal] = useState(false);
  const [escalatedCount, setEscalatedCount] = useState(0);
  const tenantId = user?.db_id || userData?.db_id || user?.uid || getTenantId();

  // Load initial global switch setting
  useEffect(() => {
    let mounted = true;
    fetchGlobalAgentSettings().then((settings) => {
      if (mounted && settings && typeof settings.agent_on === 'boolean') {
        setAiGlobalActive(settings.agent_on);
      }
    });
    return () => { mounted = false; };
  }, [tenantId]);

  // Real-time listener for global switch updates from other windows/services
  useEffect(() => {
    if (!tenantId) return;
    const socket = connectAiAgentSocket(tenantId, {
      onGlobalToggle: (data) => {
        if (typeof data?.agent_on === 'boolean') {
          setAiGlobalActive(data.agent_on);
        }
      }
    });

    return () => {
      if (socket && socket.disconnect) socket.disconnect();
    };
  }, [tenantId]);

  const handleToggleGlobal = async () => {
    const nextVal = !aiGlobalActive;
    setAiGlobalActive(nextVal);
    setUpdatingGlobal(true);
    try {
      await updateGlobalAgentSettings(nextVal);
    } catch (err) {
      console.error('Failed to update global AI status:', err);
      setAiGlobalActive(!nextVal); // Revert on failure
    } finally {
      setUpdatingGlobal(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 font-sans text-slate-900 p-3 sm:p-4 min-h-0 overflow-hidden">
      {/* ─── TOP UNIFIED HEADER BAR ─── */}
      <div className="mb-3 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
              activeTab === 'inbox'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>Live Inbox</span>
            <span
              className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full transition ${
                activeTab === 'inbox'
                  ? 'bg-white/20 text-white'
                  : escalatedCount > 0
                  ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {escalatedCount} Escalated
            </span>
          </button>

          <button
            onClick={() => setActiveTab('kb')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
              activeTab === 'kb'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <CircleStackIcon className="w-4 h-4" />
            <span>AI Knowledge Base & Training</span>
            <span
              className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full transition ${
                activeTab === 'kb'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
              }`}
            >
              Active
            </span>
          </button>
        </div>

        {/* Right: Tenant ID & Global AI Status Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Tenant Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-mono">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Tenant: #{tenantId}</span>
          </div>

          {/* AI Global Status Switch */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
              Global Agent:
            </span>
            <button
              onClick={handleToggleGlobal}
              disabled={updatingGlobal}
              className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 shadow-xs cursor-pointer select-none ${
                aiGlobalActive
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100/90 ring-1 ring-emerald-200'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200/80 ring-1 ring-slate-200'
              }`}
              title={
                aiGlobalActive
                  ? 'Global AI routing is ON. Inbound customer messages will be handled by the AI agent.'
                  : 'Global AI routing is OFF. Inbound messages will go directly to human inbox without AI processing.'
              }
            >
              {/* Visual Toggle Pill */}
              <div
                className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                  aiGlobalActive ? 'bg-[#25D366]' : 'bg-slate-400'
                }`}
              >
                <div
                  className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-200 ${
                    aiGlobalActive ? 'translate-x-3' : 'translate-x-0'
                  }`}
                />
              </div>

              <span className="font-bold">
                {aiGlobalActive ? '🟢 AGENT ON' : '⚪ AGENT OFF'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── TAB CONTENT VIEWS ─── */}
      <div className="flex-1 min-h-0 w-full h-full overflow-hidden flex flex-col">
        {activeTab === 'inbox' ? (
          <LiveInboxView
            tenantId={tenantId}
            onEscalatedCountChange={setEscalatedCount}
            globalAgentOn={aiGlobalActive}
          />
        ) : (
          <KnowledgeBaseManagerView tenantId={tenantId} />
        )}
      </div>
    </div>
  );
}
