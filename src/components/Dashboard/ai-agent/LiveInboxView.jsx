import React, { useState, useEffect, useRef } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ShieldExclamationIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  SparklesIcon,
  ClockIcon,
  PhoneIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import {
  fetchConversations,
  fetchConversationMessages,
  sendManualMessage,
  resumeAiAutomation,
  toggleChatAgent,
  connectAiAgentSocket
} from '../../../services/aiAgentService';

export default function LiveInboxView({ tenantId, onEscalatedCountChange, globalAgentOn = true }) {
  const [filter, setFilter] = useState('all');
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [resumingAi, setResumingAi] = useState(false);
  const [togglingAgent, setTogglingAgent] = useState(false);
  const [expandedToolIds, setExpandedToolIds] = useState({});
  const chatScrollContainerRef = useRef(null);
  const selectedConvIdRef = useRef(selectedConvId);

  // Keep selectedConvIdRef in sync with state for socket callbacks
  useEffect(() => {
    selectedConvIdRef.current = selectedConvId;
  }, [selectedConvId]);

  // Load conversations
  const loadConversations = async (currentFilter = filter) => {
    try {
      setLoadingConv(true);
      const data = await fetchConversations(currentFilter);
      setConversations(data);
      if (data.length > 0 && !selectedConvId) {
        setSelectedConvId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    loadConversations(filter);
  }, [filter, tenantId]);

  // Sync escalated count to parent if callback provided
  useEffect(() => {
    if (typeof onEscalatedCountChange === 'function') {
      const count = conversations.filter((c) => c.status === 'HUMAN_TAKEOVER').length;
      onEscalatedCountChange(count);
    }
  }, [conversations, onEscalatedCountChange]);

  // Real-time WebSocket connection for live inbox updates
  useEffect(() => {
    if (!tenantId) return;

    // Web Audio chime synthesizer (zero external audio file dependency)
    const playNotificationChime = () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const audioCtx = new AudioContextClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {
        // AudioContext may be blocked before first user gesture
      }
    };

    console.log(`🔌 [LiveInboxView] Initializing Socket.IO connection for tenant ${tenantId}...`);
    const socket = connectAiAgentSocket(tenantId, {
      // 1. New Escalation Alert
      onEscalated: (event) => {
        console.log('🚨 [LiveInboxView] conversation.escalated received:', event);
        playNotificationChime();

        const convId = event.conversationId || event.conversation_id;
        const phone = event.customerPhone || event.customer_phone;

        setConversations((prev) => {
          const existingIdx = prev.findIndex(
            (c) => (convId && c.id === convId) || (phone && c.customer_phone === phone)
          );

          if (existingIdx !== -1) {
            const existing = prev[existingIdx];
            const updatedConv = {
              ...existing,
              status: 'HUMAN_TAKEOVER',
              handoff_urgency: event.urgency || existing.handoff_urgency || 'HIGH',
              handoff_reason: event.reason_category || event.reason || existing.handoff_reason || 'MANUAL_ESCALATION',
              handoff_summary: event.handoff_summary || existing.handoff_summary,
              escalated_at: event.escalated_at || new Date().toISOString()
            };
            const rest = prev.filter((_, idx) => idx !== existingIdx);
            return [updatedConv, ...rest];
          } else {
            const newConv = {
              id: convId || `conv-${Date.now()}`,
              tenant_id: tenantId,
              customer_phone: phone || '',
              customer_name: event.customerName || phone || 'Customer',
              status: 'HUMAN_TAKEOVER',
              handoff_urgency: event.urgency || 'HIGH',
              handoff_reason: event.reason_category || event.reason || 'MANUAL_ESCALATION',
              handoff_summary: event.handoff_summary || 'Customer escalated to human support.',
              escalated_at: event.escalated_at || new Date().toISOString(),
              issue_tag: event.reason_category || 'Escalation',
              last_message: {
                content: event.handoff_summary || 'Needs human intervention',
                role: 'user',
                created_at: event.escalated_at || new Date().toISOString()
              }
            };
            return [newConv, ...prev];
          }
        });
      },

      // 2. Incoming / Outgoing Message
      onNewMessage: (msg) => {
        console.log('📨 [LiveInboxView] conversation.new_message received:', msg);
        const convId = msg.conversationId || msg.conversation_id;
        const currentActiveId = selectedConvIdRef.current;

        // If the open thread is this conversation, append the message
        if (convId && currentActiveId && convId.toString() === currentActiveId.toString()) {
          setMessages((prevMsgs) => {
            const isDup = prevMsgs.some(
              (m) =>
                (msg.id && m.id && m.id === msg.id) ||
                (m.content === msg.content &&
                  Math.abs(new Date(m.created_at || Date.now()) - new Date(msg.timestamp || Date.now())) < 2000)
            );
            if (isDup) return prevMsgs;

            return [
              ...prevMsgs,
              {
                id: msg.id || 'msg-' + Date.now(),
                role: msg.role === 'agent_human' ? 'agent_human' : msg.role || 'user',
                content: msg.content,
                tool_calls: msg.tool_calls || null,
                created_at: msg.timestamp || new Date().toISOString()
              }
            ];
          });
        }

        // Update preview in conversation list
        setConversations((prev) =>
          prev.map((c) => {
            if (convId && c.id && c.id.toString() === convId.toString()) {
              return {
                ...c,
                last_message: {
                  content: msg.content,
                  role: msg.role || 'user',
                  created_at: msg.timestamp || new Date().toISOString()
                }
              };
            }
            return c;
          })
        );
      },

      // 3. AI Automation Resumed
      onAiResumed: (data) => {
        console.log('🟢 [LiveInboxView] conversation.ai_resumed received:', data);
        const convId = data.conversationId || data.conversation_id;
        setConversations((prev) =>
          prev.map((c) => {
            if (convId && c.id && c.id.toString() === convId.toString()) {
              return {
                ...c,
                status: 'AI_ACTIVE',
                agent_on: true,
                handoff_urgency: null,
                handoff_reason: null,
                handoff_summary: null
              };
            }
            return c;
          })
        );
      },

      // 4. Individual Chat Agent Switch Toggled
      onAgentToggled: (data) => {
        console.log('🔀 [LiveInboxView] conversation.agent_toggled received:', data);
        const convId = data.conversationId;
        const phone = data.customerPhone;
        setConversations((prev) =>
          prev.map((c) => {
            if ((convId && c.id === convId) || (phone && c.customer_phone === phone)) {
              return {
                ...c,
                agent_on: data.agent_on,
                status: data.status || (data.agent_on ? 'ACTIVE' : 'HUMAN_TAKEOVER'),
                ...(data.agent_on ? { handoff_urgency: null, handoff_reason: null, handoff_summary: null } : {})
              };
            }
            return c;
          })
        );
      }
    });

    return () => {
      console.log('🔌 [LiveInboxView] Cleaning up Socket.IO connection...');
      if (socket && typeof socket.disconnect === 'function') {
        socket.disconnect();
      }
    };
  }, [tenantId]);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedConvId) return;
    const loadMsgs = async () => {
      try {
        setLoadingMessages(true);
        const msgs = await fetchConversationMessages(selectedConvId);
        setMessages(msgs);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMsgs();
  }, [selectedConvId]);

  // Scroll only the chat container internally without scrolling outer window/page
  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loadingMessages]);

  const activeConversation = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const toggleToolExpand = (index) => {
    setExpandedToolIds((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConversation || sendingReply) return;

    try {
      setSendingReply(true);
      const text = replyText.trim();
      setReplyText('');

      // Optimistic message update
      const tempMsg = {
        id: 'msg-' + Date.now(),
        role: 'agent',
        content: text,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tempMsg]);

      // Call API
      await sendManualMessage(activeConversation.id, text, activeConversation.customer_phone);

      // Lock conversation to HUMAN_TAKEOVER
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                status: 'HUMAN_TAKEOVER',
                last_message: { content: text, role: 'agent', created_at: new Date().toISOString() }
              }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleResumeAi = async () => {
    if (!activeConversation || resumingAi) return;
    try {
      setResumingAi(true);
      await resumeAiAutomation(activeConversation.id, activeConversation.customer_phone);

      // Update local conversation state to AI_ACTIVE
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                status: 'AI_ACTIVE',
                agent_on: true,
                handoff_urgency: null,
                handoff_reason: null,
                handoff_summary: null
              }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to resume AI:', err);
    } finally {
      setResumingAi(false);
    }
  };

  const handleToggleChatAgent = async () => {
    if (!activeConversation || togglingAgent) return;
    const isCurrentlyOn = activeConversation.agent_on !== false && activeConversation.status !== 'HUMAN_TAKEOVER';
    const nextVal = !isCurrentlyOn;

    setTogglingAgent(true);

    // Optimistically update conversation
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id || c.customer_phone === activeConversation.customer_phone
          ? {
              ...c,
              agent_on: nextVal,
              status: nextVal ? 'ACTIVE' : 'HUMAN_TAKEOVER',
              handoff_urgency: nextVal ? null : c.handoff_urgency,
              handoff_reason: nextVal ? null : c.handoff_reason,
              handoff_summary: nextVal ? null : c.handoff_summary
            }
          : c
      )
    );

    try {
      await toggleChatAgent(activeConversation.customer_phone, nextVal, activeConversation.id);
    } catch (err) {
      console.error('Failed to toggle chat agent:', err);
    } finally {
      setTogglingAgent(false);
    }
  };

  // Filtered conversation list
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (c.customer_name || '').toLowerCase().includes(q);
    const phoneMatch = (c.customer_phone || '').includes(q);
    const issueMatch = (c.issue_tag || '').toLowerCase().includes(q);
    const lastMsgMatch = (c.last_message?.content || '').toLowerCase().includes(q);
    return nameMatch || phoneMatch || issueMatch || lastMsgMatch;
  });

  const isHumanTakeover = activeConversation?.status === 'HUMAN_TAKEOVER';

  return (
    <div className="flex flex-1 min-h-0 w-full h-full bg-white text-slate-800 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* ─── LEFT: CONVERSATION SIDEBAR ─── */}
      <div className="w-80 md:w-96 flex flex-col border-r border-slate-200 bg-white shrink-0">
        {/* Search & Header */}
        <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Conversations</span>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-slate-200/70 text-slate-700 rounded-full">
                {conversations.length}
              </span>
            </div>
            <button
              onClick={() => loadConversations(filter)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition"
              title="Refresh inbox"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${loadingConv ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer, phone, order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white text-xs rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition shadow-2xs"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('needs_human')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1.5 transition ${
                filter === 'needs_human'
                  ? 'bg-rose-50 text-rose-700 border border-rose-300 font-bold shadow-2xs'
                  : 'bg-white text-rose-600 border border-slate-200 hover:bg-rose-50/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              🔴 Needs Human
            </button>
            <button
              onClick={() => handleFilterChange('ai_active')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1.5 transition ${
                filter === 'ai_active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold shadow-2xs'
                  : 'bg-white text-emerald-600 border border-slate-200 hover:bg-emerald-50/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
              🟢 AI Active
            </button>
            <button
              onClick={() => handleFilterChange('resolved')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                filter === 'resolved'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Resolved
            </button>
          </div>
        </div>

        {/* Conversation Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loadingConv && conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              const isEscalated = conv.status === 'HUMAN_TAKEOVER';
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-all duration-150 relative group ${
                    isSelected
                      ? 'bg-blue-50/80 border-l-4 border-l-blue-600'
                      : 'hover:bg-slate-50'
                  } ${isEscalated && !isSelected ? 'bg-rose-50/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isEscalated ? (
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full h-2 w-2 bg-[#25D366] shrink-0"></span>
                      )}
                      <span className={`text-xs sm:text-sm truncate ${isSelected ? 'text-blue-950 font-bold' : 'text-slate-900 font-semibold'}`}>
                        {conv.customer_name || 'Customer'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                      {conv.last_message?.created_at
                        ? new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '11:22 AM'}
                    </span>
                  </div>

                  {/* Urgency & Issue Tag & Agent Status */}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {conv.agent_on !== false && conv.status !== 'HUMAN_TAKEOVER' ? (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">
                        🤖 AI ON
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-slate-200 text-slate-700">
                        👤 Human
                      </span>
                    )}
                    {isEscalated && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-rose-100 text-rose-700 ring-1 ring-rose-200 uppercase tracking-wider">
                        ⚠️ {conv.handoff_urgency || 'HIGH'}
                      </span>
                    )}
                    {conv.issue_tag && (
                      <span className="text-[10px] font-medium text-slate-500 truncate">
                        {conv.issue_tag}
                      </span>
                    )}
                  </div>

                  {/* Message Snippet */}
                  <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-normal">
                    {conv.last_message?.content || 'No messages yet'}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── RIGHT: LIVE THREAD & ACTIONS ─── */}
      <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
        {activeConversation ? (
          <>
            {/* Conversation Header Bar */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
                  {activeConversation.customer_name?.charAt(0) || 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                      {activeConversation.customer_name}
                    </h2>
                    <span className="text-xs text-slate-500 font-mono">
                      ({activeConversation.customer_phone})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {isHumanTakeover ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        Status: 🔴 HUMAN TAKEOVER (Paused AI)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                        Status: 🟢 AI ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action & Individual Chat Switch */}
              <div className="flex items-center gap-3">
                {/* Chat Switch Toggle */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-600 hidden md:inline">
                    Chat AI Agent:
                  </span>
                  <button
                    onClick={handleToggleChatAgent}
                    disabled={togglingAgent}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer select-none ${
                      activeConversation.agent_on !== false && !isHumanTakeover
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100/80 ring-1 ring-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100/80 ring-1 ring-rose-200'
                    }`}
                    title={
                      activeConversation.agent_on !== false && !isHumanTakeover
                        ? 'Chat switch is ON: AI Agent will automatically reply to incoming messages for this chat.'
                        : 'Chat switch is OFF: AI Agent will not reply. Human agent only.'
                    }
                  >
                    <div
                      className={`w-6 h-3.5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                        activeConversation.agent_on !== false && !isHumanTakeover ? 'bg-[#25D366]' : 'bg-slate-400'
                      }`}
                    >
                      <div
                        className={`bg-white w-2.5 h-2.5 rounded-full shadow transform transition-transform duration-200 ${
                          activeConversation.agent_on !== false && !isHumanTakeover ? 'translate-x-2.5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                    <span>
                      {activeConversation.agent_on !== false && !isHumanTakeover ? '🟢 AI ON' : '⚪ AI OFF'}
                    </span>
                  </button>
                </div>

                {/* Resume AI Shortcut Button (when in HUMAN_TAKEOVER) */}
                {isHumanTakeover ? (
                  <button
                    onClick={handleResumeAi}
                    disabled={resumingAi}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    {resumingAi ? 'Resuming...' : 'Resume AI 🟢'}
                  </button>
                ) : (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                    <SparklesIcon className="w-3.5 h-3.5 text-[#25D366]" />
                    AI Handling Responses
                  </div>
                )}
              </div>
            </div>

            {/* Smart Handoff Summary Banner (When in HUMAN_TAKEOVER) */}
            {isHumanTakeover && (
              <div className="mx-5 mt-4 p-4 rounded-xl bg-gradient-to-r from-rose-50 via-white to-amber-50/50 border border-rose-200 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-700 ring-1 ring-rose-200 shrink-0">
                    <ShieldExclamationIcon className="w-5 h-5 text-rose-600 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-wide text-rose-800 uppercase">
                          🚨 AI HANDOFF SUMMARY
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-200 rounded">
                          Urgency: {activeConversation.handoff_urgency || 'HIGH'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        Escalated 2m ago
                      </span>
                    </div>

                    <div className="mt-1.5 text-xs text-slate-700">
                      <span className="font-semibold text-rose-900">Reason: </span>
                      <code className="px-1.5 py-0.5 rounded bg-rose-100/70 text-rose-800 text-[11px] font-mono border border-rose-200">
                        {activeConversation.handoff_reason || 'DAMAGED_OR_WRONG_ITEM_RECEIVED'}
                      </code>
                    </div>

                    <p className="mt-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-rose-100 shadow-2xs leading-relaxed">
                      {activeConversation.handoff_summary ||
                        'Customer received a damaged item on Order #1042 and requested a human replacement approval.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Thread */}
            <div ref={chatScrollContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 bg-slate-50/60">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-xs gap-2">
                  <ArrowPathIcon className="w-4 h-4 animate-spin text-blue-600" />
                  Loading message history...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No message history found for this conversation.
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  const isAI = msg.role === 'assistant';
                  const isAgent = msg.role === 'agent' || msg.role === 'agent_human';
                  const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;

                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                    >
                      {/* Sender label */}
                      <span className="text-[10px] font-semibold text-slate-400 mb-1 px-1 flex items-center gap-1">
                        {isUser && '👤 Customer'}
                        {isAI && '🤖 AI Assistant'}
                        {isAgent && '👨‍💼 You (Merchant Agent)'}
                      </span>

                      {/* Tool Call Collapsible Pill (if tool executed before/with this message) */}
                      {hasToolCalls &&
                        msg.tool_calls.map((tool, tIdx) => {
                          const toolKey = `${idx}-${tIdx}`;
                          const isExpanded = !!expandedToolIds[toolKey];
                          return (
                            <div key={toolKey} className="w-full max-w-lg mb-2">
                              <button
                                onClick={() => toggleToolExpand(toolKey)}
                                className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 text-left transition text-xs font-mono text-slate-700 shadow-2xs group"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <WrenchScrewdriverIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span className="truncate">
                                    🔧 Tool Executed: <strong className="text-blue-700">{tool.tool}</strong> ({tool.execution_time_ms || 140}ms)
                                  </span>
                                </div>
                                {isExpanded ? (
                                  <ChevronUpIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                ) : (
                                  <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                )}
                              </button>

                              {isExpanded && (
                                <div className="mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-200 space-y-2 shadow-inner">
                                  <div>
                                    <span className="text-slate-400 uppercase tracking-wider text-[9px] block">Arguments:</span>
                                    <pre className="text-emerald-400 overflow-x-auto p-1.5 bg-slate-950/80 rounded mt-0.5">
                                      {JSON.stringify(tool.arguments || {}, null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 uppercase tracking-wider text-[9px] block">Result:</span>
                                    <pre className="text-sky-300 overflow-x-auto p-1.5 bg-slate-950/80 rounded mt-0.5">
                                      {JSON.stringify(tool.result || {}, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                          isUser
                            ? 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-sm'
                            : isAI
                            ? 'bg-blue-50 text-blue-950 border border-blue-200/80 rounded-tr-sm'
                            : 'bg-emerald-50 text-emerald-950 border border-emerald-200/80 rounded-tr-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div
                          className={`text-[9px] mt-1.5 flex items-center justify-end gap-1 ${
                            isUser ? 'text-slate-400' : isAI ? 'text-blue-400' : 'text-emerald-500'
                          }`}
                        >
                          {msg.created_at
                            ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Just now'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Response Shortcuts Bar */}
            <div className="px-5 py-2 bg-white border-t border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px]">
              <span className="text-slate-400 text-[10px] uppercase font-bold shrink-0">Quick:</span>
              <button
                onClick={() => setReplyText('Apologies for the trouble! I am checking your order details right now.')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition whitespace-nowrap border border-slate-200"
              >
                "Checking order now..."
              </button>
              <button
                onClick={() => setReplyText('Your replacement has been approved and dispatched free of charge.')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition whitespace-nowrap border border-slate-200"
              >
                "Replacement approved"
              </button>
              <button
                onClick={() => setReplyText('Could you please share a clear photo of the damaged parcel?')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition whitespace-nowrap border border-slate-200"
              >
                "Ask for photo"
              </button>
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendReply} className="p-3.5 bg-white border-t border-slate-200">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type manual reply to send on WhatsApp..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-slate-400 transition"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sendingReply}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Send</span>
                  <PaperAirplaneIcon className="w-4 h-4 -rotate-45" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 pl-1">
                ⚡ Sending a manual message automatically pauses AI and switches this conversation to <strong>Human Takeover</strong>.
              </p>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
            <UserCircleIcon className="w-12 h-12 text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">Select a conversation from the sidebar to view chat</p>
          </div>
        )}
      </div>
    </div>
  );
}
