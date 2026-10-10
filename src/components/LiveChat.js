import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import websocketService from "../services/websocketService";
import {
  fetchRecentChats,
  fetchInboxSummary,
  markConversationRead,
  chatService,
  formatConversationTime,
  formatMessageTime,
  formatDateSeparator,
} from "../services/chatService";
import {
  ReplyButtonsBuilder, MediaBuilder, LocationBuilder, RequestLocationBuilder,
  ContactBuilder, RequestAddressBuilder, InteractiveListBuilder,
  InteractiveCarouselBuilder, CtaUrlBuilder, ProductCarouselBuilder, DummyBuilder
} from "./LiveChatModals";
import {
  ArrowLeftIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon,
  PaperAirplaneIcon, PaperClipIcon, MapPinIcon, PhotoIcon,
  DocumentIcon, XMarkIcon, MusicalNoteIcon, UserIcon, LinkIcon,
  ListBulletIcon, ViewColumnsIcon, ShoppingBagIcon, CheckCircleIcon,
  PlayIcon, ArrowDownTrayIcon, FilmIcon, EyeIcon, ArrowUturnLeftIcon
} from "@heroicons/react/24/outline";

// ── WhatsApp-style status ticks ──────────────────────────────────────────────
const MessageTicks = ({ status, isOutbound }) => {
  if (!isOutbound) return null;
  if (status === "sending") return (
    <svg className="w-3 h-3 text-white/50 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
  if (status === "failed") return (
    <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
    </svg>
  );
  if (status === "sent") return (
    <svg className="w-3.5 h-3 text-white/60" viewBox="0 0 12 9" fill="currentColor">
      <path d="M10.94.94L4.5 7.38 2.06 4.94.5 6.5 4.5 10.5 12.5 2.5z"/>
    </svg>
  );
  if (status === "delivered") return (
    <svg className="w-5 h-3 text-white/60" viewBox="0 0 18 11" fill="currentColor">
      <path d="M16.5 0L8 8.5l-2-2L4.5 8l3.5 3.5L18 1.5z"/>
      <path d="M10.5 0L4 6.5 1.5 4 0 5.5l4 4L12 1.5z"/>
    </svg>
  );
  if (status === "read") return (
    <svg className="w-5 h-3 text-[#53bdeb]" viewBox="0 0 18 11" fill="currentColor">
      <path d="M16.5 0L8 8.5l-2-2L4.5 8l3.5 3.5L18 1.5z"/>
      <path d="M10.5 0L4 6.5 1.5 4 0 5.5l4 4L12 1.5z"/>
    </svg>
  );
  return null;
};

// ── Date separator pill ──────────────────────────────────────────────────────
const DateSeparator = ({ label, isDarkMode }) => (
  <div className="flex items-center justify-center my-3">
    <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
      isDarkMode ? "bg-[#182229] text-slate-400 border border-[#2A3942]" : "bg-white/90 text-slate-500 border border-slate-200 shadow"
    }`}>{label}</span>
  </div>
);

// ── Phone normalization helper ──────────────────────────────────────────────
const normalizePhone = (p) => (p ? String(p).replace(/\D/g, '') : '');
const isPhoneMatch = (p1, p2) => {
  const n1 = normalizePhone(p1);
  const n2 = normalizePhone(p2);
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  if (n1.length >= 10 && n2.length >= 10 && n1.slice(-10) === n2.slice(-10)) return true;
  return false;
};

// ── Attachment menu button ───────────────────────────────────────────────────
const ActionMenuButton = ({ icon, label, onClick, colorClass, isDarkMode }) => (
  <button onClick={onClick} className={`flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm font-medium text-left transition-all hover:scale-[1.02] ${isDarkMode ? "text-slate-300 hover:bg-[#2A3942]" : "text-slate-700 hover:bg-slate-50"}`}>
    <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-white shadow-sm ${colorClass}`}>{icon}</div>
    <span className="truncate text-[13px]">{label}</span>
  </button>
);

// ── Lazy/On-Demand Media Bubble Component ─────────────────────────────────────
const LazyMediaBubble = ({ type, url, caption, isOut, timeMeta, onOpenLightbox }) => {
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (type === "video") {
    return (
      <div className="flex flex-col gap-1.5 p-1">
        {isPlayingInline && url ? (
          <div className="rounded-xl overflow-hidden bg-black max-h-72 w-full shadow">
            <video
              src={url}
              className="w-full max-h-72 rounded-xl object-contain bg-black"
              controls
              autoPlay
              preload="auto"
            />
          </div>
        ) : (
          <div
            onClick={() => {
              if (url) {
                onOpenLightbox({ url, type: "video", caption });
              }
            }}
            className="group relative rounded-xl overflow-hidden bg-slate-900 aspect-video w-full max-h-60 flex flex-col items-center justify-center cursor-pointer border border-white/10 hover:border-white/25 transition-all shadow"
          >
            {/* Background overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
            
            {/* Play button */}
            <div className="relative z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-[#25D366] transition-all">
              <PlayIcon className="w-6 h-6 fill-current ml-0.5" />
            </div>

            <div className="relative z-10 mt-2 flex items-center gap-1.5 text-xs text-white/90 font-medium">
              <FilmIcon className="w-4 h-4" />
              <span>Tap to Play Video</span>
            </div>

            {/* Inline play trigger */}
            {url && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsPlayingInline(true); }}
                className="absolute bottom-2 right-2 z-10 text-[10px] px-2 py-0.5 rounded-md bg-black/60 hover:bg-black/90 text-white/90 font-medium backdrop-blur-sm transition-colors"
              >
                Play inline
              </button>
            )}
          </div>
        )}
        {caption && !caption.startsWith("[") && <p className="px-1.5 text-sm">{caption}</p>}
        <div className="px-1.5">{timeMeta}</div>
      </div>
    );
  }

  // Photo / Image
  return (
    <div className="flex flex-col gap-1.5 p-1">
      {url ? (
        <div 
          onClick={() => onOpenLightbox({ url, type: "image", caption })}
          className="group relative rounded-xl overflow-hidden cursor-pointer max-h-64 bg-black/10 flex items-center justify-center transition-all"
        >
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-200/50 dark:bg-slate-800/50 animate-pulse min-h-[120px]">
              <PhotoIcon className="w-8 h-8 text-slate-400 opacity-60" />
            </div>
          )}
          <img
            src={url}
            alt={caption || "Photo"}
            onLoad={() => setImageLoaded(true)}
            className={`rounded-xl max-h-64 object-cover w-full transition-transform duration-200 group-hover:scale-[1.02] ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <span className="p-2 rounded-full bg-black/60 text-white backdrop-blur-sm shadow flex items-center gap-1 text-xs font-medium">
              <EyeIcon className="w-4 h-4" /> View Full
            </span>
          </div>
        </div>
      ) : (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${isOut ? "bg-black/10" : "bg-slate-100"}`}>
          <PhotoIcon className="w-5 h-5"/>
          <span className="italic">Image</span>
        </div>
      )}
      {caption && !caption.startsWith("[") && <p className="px-1.5 text-sm">{caption}</p>}
      <div className="px-1.5">{timeMeta}</div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const LiveChat = ({ isDarkMode, onTotalUnreadChange }) => {
  const { user, userData } = useAuth();
  const [allMessages, setAllMessages] = useState([]);
  const [selectedSenderNumber, setSelectedSenderNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [inputText, setInputText] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [activeBuilder, setActiveBuilder] = useState(null);
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const chatContainerRef = useRef(null);
  const conversationsRef = useRef([]);

  const getUserId = useCallback(() => {
    if (user?.db_id) return user.db_id;
    if (user?.uid) return user.uid;
    if (userData?.db_id) return userData.db_id;
    if (userData?.uid) return userData.uid;
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('userData');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.db_id || parsed.uid || parsed.id;
      }
    } catch {}
    return null;
  }, [user, userData]);

  const loadInboxSummary = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const data = await fetchInboxSummary(userId);
      if (data && data.data) {
        setConversations(data.data);
        conversationsRef.current = data.data;
        const total = data.totalUnread || 0;
        setTotalUnread(total);
        if (onTotalUnreadChange) onTotalUnreadChange(total);
      }
    } catch (err) { console.error("inbox summary err", err); }
    finally { setLoadingConversations(false); }
  }, [getUserId, onTotalUnreadChange]);

  const loadMessages = useCallback(async () => {
    const userId = getUserId();
    if (!userId) { setLoading(false); return; }
    try {
      const data = await fetchRecentChats(userId);
      if (data && data.data) {
        const sorted = data.data.sort((a, b) =>
          new Date(a.created_at || a.time_stamp).getTime() - new Date(b.created_at || b.time_stamp).getTime()
        );
        setAllMessages(sorted);
      }
    } catch (err) { console.error("load msgs err", err); }
    finally { setLoading(false); }
  }, [getUserId]);

  useEffect(() => {
    const userId = getUserId();
    console.log("🟢 [LiveChat] useEffect running. Resolved userId:", userId, { user, userData });
    if (!userId) {
      console.warn("⚠️ [LiveChat] No userId resolved, skipping WebSocket connection");
      setLoading(false);
      setLoadingConversations(false);
      return;
    }
    websocketService.connect(userId);
    loadInboxSummary();
    loadMessages();

    const handleNew = (data) => {
      // If data is the message object itself with .message as string text, keep data
      // If data is a wrapper { message: { ... } }, extract the inner object
      const m = (typeof data?.message === 'object' && data?.message !== null ? data.message : null) || data;
      if (!m || typeof m !== 'object') return;
      console.log("📨 [LiveChat] Appending live message to active state:", m);
      setAllMessages(prev => {
        // 1. Exact match by id or wamid
        const existingIdx = prev.findIndex(x => (m.id && x.id === m.id) || (m.wamid && x.wamid && x.wamid === m.wamid));
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...m };
          return updated;
        }

        // 2. Reconcile temporary optimistic message for outbound sends
        if (m.direction === 'outbound') {
          const tempIdx = prev.findIndex(x =>
            x.id?.toString().startsWith('temp-') &&
            x.direction === 'outbound' &&
            (isPhoneMatch(x.sender_number, m.sender_number) || isPhoneMatch(x.to_number, m.sender_number) || isPhoneMatch(x.sender_number, m.to_number)) &&
            (x.message === m.message || x.message_type === m.message_type)
          );
          if (tempIdx !== -1) {
            const updated = [...prev];
            updated[tempIdx] = { ...updated[tempIdx], ...m };
            return updated;
          }
        }

        return [...prev, m];
      });
      loadInboxSummary();
    };

    const handleUpdate = (data) => {
      const m = (typeof data?.message === 'object' && data?.message !== null ? data.message : null) || data;
      if (!m || typeof m !== 'object') return;
      setAllMessages(prev =>
        prev.map(x => ((m.id && x.id === m.id) || (m.wamid && x.wamid && x.wamid === m.wamid)) ? { ...x, ...m, status: m.status || x.status } : x)
      );
    };

    websocketService.onMessage("new_message", handleNew);
    websocketService.onMessage("message_updated", handleUpdate);
    websocketService.onMessage("message_update", handleUpdate);

    return () => {
      websocketService.offMessage("new_message", handleNew);
      websocketService.offMessage("message_updated", handleUpdate);
      websocketService.offMessage("message_update", handleUpdate);
    };
  }, [getUserId, loadInboxSummary, loadMessages]);

  useEffect(() => {
    if (!selectedSenderNumber) return;
    const userId = getUserId();
    if (!userId) return;
    markConversationRead(userId, selectedSenderNumber).then(() => {
      const conv = conversationsRef.current.find(c => isPhoneMatch(c.sender_number, selectedSenderNumber));
      const prevCount = conv?.unread_count || 0;
      setConversations(prev => prev.map(c => isPhoneMatch(c.sender_number, selectedSenderNumber) ? { ...c, unread_count: 0 } : c));
      setTotalUnread(t => {
        const next = Math.max(0, t - prevCount);
        if (onTotalUnreadChange) onTotalUnreadChange(next);
        return next;
      });
    });
  }, [selectedSenderNumber, getUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      if (chatContainerRef.current)
        chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    }, 100);
  };
  useEffect(() => { if (selectedSenderNumber) scrollToBottom(false); }, [selectedSenderNumber]);

  const activeMessages = useMemo(() => {
    if (!selectedSenderNumber) return [];
    return allMessages.filter(m => 
      isPhoneMatch(m.sender_number, selectedSenderNumber) || 
      isPhoneMatch(m.to_number, selectedSenderNumber)
    );
  }, [allMessages, selectedSenderNumber]);

  useEffect(() => { if (activeMessages.length > 0) scrollToBottom(true); }, [activeMessages.length]);

  const selectedConversation = useMemo(() =>
    conversations.find(c => isPhoneMatch(c.sender_number, selectedSenderNumber)),
    [conversations, selectedSenderNumber]
  );
  const selectedName = selectedConversation?.display_name || selectedSenderNumber;

  const filteredConversations = useMemo(() => {
    let r = conversations;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const qClean = q.replace(/\D/g, '');
      r = r.filter(c => 
        c.display_name?.toLowerCase().includes(q) || 
        c.sender_number?.includes(q) ||
        (qClean && c.sender_number && String(c.sender_number).replace(/\D/g, '').includes(qClean))
      );
    }
    if (activeFilter === "unread") r = r.filter(c => c.unread_count > 0);
    return r;
  }, [conversations, searchQuery, activeFilter]);

  const messagesWithSeparators = useMemo(() => {
    const items = [];
    let lastDate = null;
    for (const msg of activeMessages) {
      const ts = msg.created_at || msg.time_stamp;
      const d = new Date(ts?.toString().length === 10 ? ts * 1000 : ts);
      const dk = isNaN(d.getTime()) ? null : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (dk && dk !== lastDate) { items.push({ type: "sep", key: `sep-${dk}`, label: formatDateSeparator(ts) }); lastDate = dk; }
      items.push({ type: "msg", key: msg.id || `msg-${Math.random()}`, msg });
    }
    return items;
  }, [activeMessages]);

  const getMessageSnippet = (m) => {
    if (!m) return "";
    const mt = m.message_type;
    if (mt === "image") return "📷 Photo";
    if (mt === "video") return "🎥 Video";
    if (mt === "audio") return "🎵 Audio";
    if (mt === "document") return "📄 Document";
    if (mt === "location" || mt === "send-location") {
      const meta = m.metadata || m.message_metadata || {};
      const req = meta.request || (typeof m.content === "object" ? m.content : {}) || {};
      const loc = meta.location || req.location || req || {};
      return `📍 ${loc.name || loc.address || "Location"}`;
    }
    if (mt === "contact" || mt === "send-contact") return "👤 Contact";
    const meta = m.metadata || m.message_metadata || {};
    const req = meta.request || (typeof m.content === "object" ? m.content : {}) || {};
    if (mt === "reply-buttons" || mt === "interactive") {
      return req.body || (typeof m.content === "object" ? m.content.body : null) || m.message || "🔘 Interactive Message";
    }
    if (mt === "list" || mt === "interactive-list") {
      return req.body || req.header || (typeof m.content === "object" ? (m.content.body || m.content.header) : null) || (typeof m.message === "string" && !m.message.startsWith("[Menu]") ? m.message : null) || "📋 List Menu";
    }
    return m.message || (typeof m.content === "string" ? m.content : "") || "Message";
  };

  const findParentMessage = useCallback((msg) => {
    if (!msg) return null;
    const meta = msg.metadata || msg.message_metadata || {};
    const contextId = meta.context?.id || meta.context_message_id || msg.reply_to_wamid || msg.context?.id || msg.context_id;

    if (contextId) {
      const found = allMessages.find(m => 
        (m.wamid && m.wamid === contextId) || 
        (m.id && String(m.id) === String(contextId))
      );
      if (found) return found;
    }

    // Fallback for reply-button choices / button tap messages where contextId might not match or be missing
    const isButtonReply = msg.message_type === "button" || 
      meta.type === "button" || 
      meta.button_reply || 
      meta.interactive?.button_reply ||
      meta.button;
      
    if (isButtonReply) {
      const msgTime = new Date(msg.created_at || msg.time_stamp).getTime();
      // Find the latest outbound interactive / reply-buttons message sent before this reply
      const priorOutboundButtons = activeMessages.filter(m => {
        const isOut = m.direction === "outbound" || m.sender === "agent";
        const isInteractive = m.message_type === "reply-buttons" || m.message_type === "interactive";
        const mTime = new Date(m.created_at || m.time_stamp).getTime();
        return isOut && isInteractive && (isNaN(msgTime) || isNaN(mTime) || mTime <= msgTime);
      });
      if (priorOutboundButtons.length > 0) {
        return priorOutboundButtons[priorOutboundButtons.length - 1];
      }
    }

    return null;
  }, [allMessages, activeMessages]);

  const scrollToMessage = (targetId) => {
    if (!targetId) return;
    const elem = document.getElementById(`msg-${targetId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(targetId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    }
  };

  const renderQuotedCard = (parentMsg) => {
    if (!parentMsg) return null;
    const isParentOut = parentMsg.direction === "outbound" || parentMsg.sender === "agent";
    const senderTitle = isParentOut ? "You" : (selectedName || "Customer");
    const targetId = parentMsg.wamid || parentMsg.id;

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          scrollToMessage(targetId);
        }}
        className="mb-1.5 rounded-lg border-l-4 border-[#25D366] bg-black/15 hover:bg-black/25 dark:bg-black/30 dark:hover:bg-black/40 p-2 cursor-pointer transition-all text-left overflow-hidden select-none"
      >
        <p className="text-[11px] font-bold text-[#25D366] leading-tight mb-0.5 truncate">
          {senderTitle}
        </p>
        <p className="text-xs opacity-85 truncate leading-snug">
          {getMessageSnippet(parentMsg)}
        </p>
      </div>
    );
  };

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedSenderNumber) return;
    const targetRecipient = selectedSenderNumber;
    const textToSend = inputText;
    const replyContextId = replyingToMessage ? (replyingToMessage.wamid || replyingToMessage.id) : null;
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId, message: textToSend, direction: "outbound",
      time_stamp: Math.floor(Date.now() / 1000), created_at: new Date().toISOString(),
      status: "sending", sender_number: targetRecipient, message_type: "text",
      reply_to_wamid: replyContextId,
      metadata: replyContextId ? { context: { id: replyContextId } } : undefined
    };
    setAllMessages(prev => [...prev, tempMsg]);
    setConversations(prev => prev.map(c => isPhoneMatch(c.sender_number, targetRecipient)
      ? { ...c, last_message: textToSend, sent_at: tempMsg.created_at, last_message_direction: "outbound", last_message_status: "sending" }
      : c
    ));
    setInputText("");
    setReplyingToMessage(null);
    try {
      const res = await chatService.sendText(targetRecipient, textToSend, replyContextId);
      const wamid = res?.data?.messages?.[0]?.id || res?.messages?.[0]?.id;
      setAllMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: "sent", ...(wamid ? { wamid } : {}) } : m));
      setConversations(prev => prev.map(c => isPhoneMatch(c.sender_number, targetRecipient) ? { ...c, last_message_status: "sent" } : c));
    } catch {
      setAllMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: "failed" } : m));
      setConversations(prev => prev.map(c => isPhoneMatch(c.sender_number, targetRecipient) ? { ...c, last_message_status: "failed" } : c));
    }
  };

  const handleSendComplexMessage = async ({ type, payload }) => {
    if (!selectedSenderNumber) return;
    const targetRecipient = selectedSenderNumber;
    const replyContextId = replyingToMessage ? (replyingToMessage.wamid || replyingToMessage.id) : null;
    setActiveBuilder(null);
    setReplyingToMessage(null);
    let disp = "[Interactive Message]";
    if (type === "reply-buttons") disp = payload.body;
    else if (type === "media") disp = payload.caption || `[${payload.mediaType?.toUpperCase()}] Attachment`;
    else if (type === "send-location") disp = payload.name || `Location: ${payload.latitude}, ${payload.longitude}`;
    else if (type === "request-location") disp = payload.body;
    else if (type === "send-contact") disp = `Contact: ${payload.name?.formatted_name}`;
    else if (type === "request-address") disp = payload.body;
    else if (type === "interactive-list") disp = payload.body || payload.header || `[Menu] ${payload.button_text}`;
    else if (type === "interactive-carousel") disp = `[Carousel] ${payload.cards?.length} cards`;
    else if (type === "cta-url") disp = `[Link] ${payload.display_text}`;
    else if (type === "product-carousel") disp = `[Catalog] ${payload.product_ids?.length} items`;
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId, message: disp,
      message_type: type === "media" ? payload.mediaType : type,
      direction: "outbound", time_stamp: Math.floor(Date.now() / 1000),
      created_at: new Date().toISOString(), status: "sending",
      localPreview: payload.localPreview, content: payload,
      sender_number: targetRecipient,
      reply_to_wamid: replyContextId,
      metadata: replyContextId ? { context: { id: replyContextId } } : undefined
    };
    setAllMessages(prev => [...prev, tempMsg]);
    setConversations(prev => prev.map(c => isPhoneMatch(c.sender_number, targetRecipient)
      ? { ...c, last_message: disp, sent_at: tempMsg.created_at, last_message_direction: "outbound" }
      : c
    ));
    try {
      let res;
      if (type === "reply-buttons") res = await chatService.sendReplyButtons(targetRecipient, payload, replyContextId);
      else if (type === "media") {
        let id = payload.mediaId;
        let link = payload.mediaUrl;
        if (!id && !link && payload.file) {
          const up = await chatService.uploadMedia(payload.file);
          if (up.id && /^\d+$/.test(up.id)) {
            id = up.id;
          }
          link = up.s3_url || up.url || (typeof up.id === 'string' && up.id.startsWith('http') ? up.id : undefined);
          if (!id && !link) id = up.id || up.data?.id || up.media_id;
        }
        const mediaTarget = id || link;
        if (!mediaTarget) throw new Error("No media ID or S3 URL available for sending");
        res = await chatService.sendMedia(targetRecipient, mediaTarget, payload.mediaType, payload.caption, replyContextId);
      }
      else if (type === "send-location") res = await chatService.sendLocation(targetRecipient, payload.latitude, payload.longitude, payload.name, payload.address);
      else if (type === "request-location") res = await chatService.sendLocationRequest(targetRecipient, payload.body);
      else if (type === "send-contact") res = await chatService.sendContact(targetRecipient, payload, replyContextId);
      else if (type === "request-address") res = await chatService.sendAddressRequest(targetRecipient, payload, replyContextId);
      else if (type === "interactive-list") res = await chatService.sendInteractiveList(targetRecipient, payload);
      else if (type === "interactive-carousel") res = await chatService.sendInteractiveCarousel(targetRecipient, payload);
      else if (type === "cta-url") res = await chatService.sendCtaUrl(targetRecipient, payload);
      else if (type === "product-carousel") res = await chatService.sendProductCarousel(targetRecipient, payload);
      
      const wamid = res?.data?.messages?.[0]?.id || res?.messages?.[0]?.id;
      setAllMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: "sent", ...(wamid ? { wamid } : {}) } : m));
      setConversations(prev => prev.map(c => isPhoneMatch(c.sender_number, targetRecipient) ? { ...c, last_message_status: "sent" } : c));
    } catch (err) {
      console.error(`Failed to send ${type}`, err);
      setAllMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: "failed" } : m));
      setConversations(prev => prev.map(c => isPhoneMatch(c.sender_number, targetRecipient) ? { ...c, last_message_status: "failed" } : c));
    }
  };

  const getMediaUrl = (msg) => {
    if (!msg) return null;

    // 1. Direct preview or direct S3/HTTPS link on message
    if (msg.localPreview) return msg.localPreview;
    if (typeof msg.url === "string" && msg.url.startsWith("http")) return msg.url;
    if (typeof msg.s3_url === "string" && msg.s3_url.startsWith("http")) return msg.s3_url;

    // 2. Check msg.content object or string
    if (msg.content) {
      if (typeof msg.content === "string" && msg.content.startsWith("http")) return msg.content;
      if (typeof msg.content === "object") {
        if (msg.content.mediaUrl && typeof msg.content.mediaUrl === "string" && msg.content.mediaUrl.startsWith("http")) return msg.content.mediaUrl;
        if (msg.content.localPreview) return msg.content.localPreview;
        if (msg.content.url && typeof msg.content.url === "string" && msg.content.url.startsWith("http")) return msg.content.url;
        if (msg.content.s3_url && typeof msg.content.s3_url === "string" && msg.content.s3_url.startsWith("http")) return msg.content.s3_url;
        if (msg.content.link && typeof msg.content.link === "string" && msg.content.link.startsWith("http")) return msg.content.link;
      }
    }

    // 3. Check metadata (message_metadata or metadata)
    const meta = msg.metadata || msg.message_metadata;
    if (meta) {
      const req = meta.request;
      if (req) {
        if (req.link && typeof req.link === "string" && req.link.startsWith("http")) return req.link;
        if (req.url && typeof req.url === "string" && req.url.startsWith("http")) return req.url;
        if (req.mediaUrl && typeof req.mediaUrl === "string" && req.mediaUrl.startsWith("http")) return req.mediaUrl;
        if (req.id && typeof req.id === "string" && req.id.startsWith("http")) return req.id;
      }

      const mediaObj = meta.image || meta.video || meta.audio || meta.document;
      if (mediaObj) {
        if (mediaObj.link && typeof mediaObj.link === "string" && mediaObj.link.startsWith("http")) return mediaObj.link;
        if (mediaObj.url && typeof mediaObj.url === "string" && mediaObj.url.startsWith("http")) return mediaObj.url;
      }

      if (meta.link && typeof meta.link === "string" && meta.link.startsWith("http")) return meta.link;
      if (meta.url && typeof meta.url === "string" && meta.url.startsWith("http")) return meta.url;
      if (meta.s3_url && typeof meta.s3_url === "string" && meta.s3_url.startsWith("http")) return meta.s3_url;

      // 4. Meta numeric media ID
      let mid = null;
      if (msg.direction === "outbound" && req?.id && /^\d+$/.test(String(req.id))) {
        mid = req.id;
      } else if (msg.direction === "inbound") {
        if (msg.message_type === "image" && meta.image?.id) mid = meta.image.id;
        if (msg.message_type === "video" && meta.video?.id) mid = meta.video.id;
        if (msg.message_type === "audio" && meta.audio?.id) mid = meta.audio.id;
        if (msg.message_type === "document" && meta.document?.id) mid = meta.document.id;
      }

      if (mid) {
        const rawUser = localStorage.getItem('user') || localStorage.getItem('userData');
        let uid = 1;
        try {
          if (rawUser) {
            const u = JSON.parse(rawUser);
            uid = u.db_id || u.uid || 1;
          }
        } catch (_) {}
        const waBase = (process.env.REACT_APP_WA_SERVER_URL || 'http://localhost:3004').replace(/\/$/, '');
        return `${waBase}/api/media/download/${mid}?user_id=${uid}`;
      }
    }

    // 5. If msg.message is itself an HTTP URL
    if (typeof msg.message === "string" && msg.message.startsWith("http")) {
      return msg.message;
    }

    return null;
  };

  // ── Render single message bubble ─────────────────────────────────────────
  const renderBubble = (msg) => {
    const isOut = msg.direction === "outbound" || msg.sender === "agent";
    const ts = msg.created_at || msg.time_stamp;
    const timeStr = formatMessageTime(ts);

    const timeMeta = (
      <div className={`flex items-center justify-end gap-1 mt-1 ${isOut ? "text-white/55" : "text-slate-400"}`}>
        <span className="text-[10px] leading-none">{timeStr}</span>
        <MessageTicks status={msg.status} isOutbound={isOut}/>
      </div>
    );

    const bubbleCls = isOut
      ? "max-w-[72%] rounded-2xl rounded-br-none text-sm shadow-sm bg-[#005C4B] text-white"
      : `max-w-[72%] rounded-2xl rounded-bl-none text-sm shadow-sm ${isDarkMode ? "bg-[#202C33] text-white border border-[#2A3942]" : "bg-white text-slate-800 border border-slate-100 shadow"}`;

    const darkOrLight = (dark, light) => isDarkMode ? dark : light;
    const mt = msg.message_type;
    let body;

    if (mt === "image" || mt === "video") {
      const preview = getMediaUrl(msg);
      body = (
        <LazyMediaBubble
          type={mt}
          url={preview}
          caption={msg.message}
          isOut={isOut}
          timeMeta={timeMeta}
          onOpenLightbox={(media) => setLightboxMedia(media)}
        />
      );
    } else if (mt === "document" || mt === "audio") {
      const preview = getMediaUrl(msg);
      body = (
        <div className="flex flex-col gap-2 p-3">
          {mt === "audio" && preview ? (
            <div className="flex flex-col gap-1">
              <audio src={preview} controls className="w-full max-w-xs h-10 rounded-lg" />
            </div>
          ) : (
            <div className={`flex items-center justify-between gap-3 p-3 rounded-xl ${isOut ? "bg-black/10" : "bg-slate-100"}`}>
              <div className="flex items-center gap-2 min-w-0">
                {mt === "audio" ? <MusicalNoteIcon className="w-5 h-5 shrink-0"/> : <DocumentIcon className="w-5 h-5 shrink-0"/>}
                <span className="font-medium text-xs truncate capitalize">{msg.message || `${mt} Attachment`}</span>
              </div>
              {preview && (
                <a href={preview} target="_blank" rel="noopener noreferrer" download className="text-xs font-bold underline shrink-0 hover:opacity-80">
                  Open
                </a>
              )}
            </div>
          )}
          {msg.message && !msg.message.startsWith("[") && mt !== "document" && <p className="text-sm">{msg.message}</p>}
          {timeMeta}
        </div>
      );
    } else if (mt === "send-location" || mt === "location") {
      const meta = msg.metadata || msg.message_metadata || {};
      const req = meta.request || (typeof msg.content === "object" ? msg.content : {}) || {};
      const loc = meta.location || req.location || req || (typeof msg.content === "object" ? msg.content : {}) || {};

      let lat = loc.latitude || meta.latitude || msg.content?.latitude;
      let lng = loc.longitude || meta.longitude || msg.content?.longitude;

      if (!lat && typeof msg.message === "string") {
        const match = msg.message.match(/Lat:\s*([0-9.-]+)/i);
        if (match) lat = parseFloat(match[1]);
      }
      if (!lng && typeof msg.message === "string") {
        const match = msg.message.match(/Long?:\s*([0-9.-]+)/i);
        if (match) lng = parseFloat(match[1]);
      }

      lat = lat ? parseFloat(lat) : null;
      lng = lng ? parseFloat(lng) : null;

      const locName = loc.name || meta.name || (typeof msg.content === "object" ? msg.content?.name : null) || (lat && lng ? (loc.address ? "Location" : "Pinned Location") : (msg.message || "Location"));
      const locAddress = loc.address || meta.address || (typeof msg.content === "object" ? msg.content?.address : null) || (lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "");
      const mapUrl = lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null;

      body = (
        <div className="flex flex-col min-w-[240px] max-w-[320px] rounded-2xl overflow-hidden">
          {/* Map Preview Snapshot */}
          {lat && lng ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative w-full h-36 bg-slate-800 overflow-hidden block group cursor-pointer"
            >
              <iframe
                title="Location Map Preview"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.0035}%2C${lng + 0.005}%2C${lat + 0.0035}&layer=mapnik&marker=${lat}%2C${lng}`}
                className="w-full h-full border-0 pointer-events-none"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-full bg-black/75 text-white text-[11px] font-semibold flex items-center gap-1 shadow backdrop-blur-sm">
                  <MapPinIcon className="w-3.5 h-3.5 text-red-400" /> Open in Maps
                </span>
              </div>
            </a>
          ) : (
            <div className={`flex items-center gap-2 p-3 ${isOut ? "bg-black/10" : "bg-slate-100"}`}>
              <MapPinIcon className="w-5 h-5 text-red-500 shrink-0"/>
              <span className="text-xs font-semibold">Location Shared</span>
            </div>
          )}

          {/* Place details */}
          <div className="p-3 flex flex-col gap-1">
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-red-500/20 text-red-500 rounded-full mt-0.5 shrink-0">
                <MapPinIcon className="w-4 h-4 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm leading-tight text-white/95 dark:text-white truncate">
                  {locName}
                </p>
                {locAddress && (
                  <p className={`text-xs mt-0.5 leading-snug line-clamp-2 ${isOut ? "text-white/75" : "text-slate-500"}`}>
                    {locAddress}
                  </p>
                )}
              </div>
            </div>

            {/* Direct Google Maps Action link */}
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-2 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  isOut
                    ? "bg-white/15 hover:bg-white/25 text-white"
                    : "bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#005C4B] dark:text-[#25D366]"
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>View on Google Maps →</span>
              </a>
            )}
          </div>

          <div className="px-3 pb-2">{timeMeta}</div>
        </div>
      );
    } else if (mt === "interactive" || mt === "reply-buttons") {
      const meta = msg.metadata || msg.message_metadata || {};
      const req = meta.request || (typeof msg.content === "object" ? msg.content : {}) || {};
      const interactive = meta.interactive || req.interactive || {};

      const headerText = (typeof msg.content === "object" && msg.content?.header_text) || req.header_text || req.header || interactive.header?.text || null;
      const bodyText = (typeof msg.content === "object" && msg.content?.body) || req.body || interactive.body?.text || msg.message || (typeof msg.content === "string" ? msg.content : "");
      const footerText = (typeof msg.content === "object" && msg.content?.footer) || req.footer || interactive.footer?.text || null;
      
      const rawBtns = (typeof msg.content === "object" && msg.content?.buttons) || req.buttons || interactive.action?.buttons || [];
      const buttonsList = Array.isArray(rawBtns) ? rawBtns.map(b => b.reply?.title || b.title || b.text || (typeof b === "string" ? b : "")).filter(Boolean) : [];

      body = (
        <div className="flex flex-col min-w-[200px] max-w-[320px]">
          <div className="p-3.5 flex flex-col gap-1.5">
            {headerText && (
              <p className="font-bold text-[15px] leading-snug tracking-tight text-white/95 dark:text-white">
                {headerText}
              </p>
            )}
            <p className="text-sm whitespace-pre-wrap leading-relaxed opacity-90">
              {bodyText}
            </p>
            {footerText && (
              <p className={`text-xs mt-1 font-normal ${isOut ? "text-white/60" : "text-slate-400"}`}>
                {footerText}
              </p>
            )}
          </div>
          {buttonsList.length > 0 ? (
            <div className={`flex flex-col border-t ${isOut ? "border-white/15" : "border-slate-200"}`}>
              {buttonsList.map((btnTitle, bi) => (
                <div
                  key={bi}
                  className={`py-2 px-3 text-center text-xs font-bold border-b last:border-b-0 ${
                    isOut ? "border-white/10 text-[#25D366] bg-black/10" : `${darkOrLight("border-[#2A3942] text-[#25D366] bg-[#2A3942]/50", "border-slate-100 text-[#005C4B] bg-slate-50")}`
                  } ${bi === buttonsList.length - 1 ? "rounded-b-2xl" : ""}`}
                >
                  {btnTitle}
                </div>
              ))}
            </div>
          ) : (
            <div className={`py-1.5 px-3 flex items-center justify-center gap-1 text-[11px] font-bold border-t rounded-b-2xl ${
              isOut ? "border-white/15 bg-black/10 text-white/70" : "border-slate-200 bg-slate-50 text-slate-500"
            }`}>
              <CheckCircleIcon className="w-3.5 h-3.5 text-[#25D366]"/>
              <span>Interactive Buttons</span>
            </div>
          )}
          <div className="px-3 pb-2 pt-1">{timeMeta}</div>
        </div>
      );
    } else if (mt === "list" || mt === "interactive-list") {
      const meta = msg.metadata || msg.message_metadata || {};
      const req = meta.request || (typeof msg.content === "object" ? msg.content : {}) || {};
      const interactive = meta.interactive || req.interactive || {};

      const headerText = (typeof msg.content === "object" && msg.content?.header) || req.header || interactive.header?.text || null;
      const bodyText = (typeof msg.content === "object" && msg.content?.body) || req.body || interactive.body?.text || (typeof msg.message === "string" && !msg.message.startsWith("[Menu]") ? msg.message : null) || (typeof msg.content === "string" && !msg.content.startsWith("[Menu]") ? msg.content : null) || (typeof msg.message === "string" && msg.message.startsWith("[Menu] ") ? "Please select an option below:" : "Please select an option from the menu below:");
      const footerText = (typeof msg.content === "object" && msg.content?.footer) || req.footer || interactive.footer?.text || null;
      const btnText = (typeof msg.content === "object" && msg.content?.button_text) || req.button_text || interactive.action?.button || (typeof msg.message === "string" && msg.message.startsWith("[Menu] ") ? msg.message.replace("[Menu] ", "") : "View Options");

      body = (
        <div className="flex flex-col min-w-[220px] max-w-[340px]">
          <div className="p-3.5 flex flex-col gap-1.5">
            {headerText && (
              <p className="font-bold text-[15px] leading-snug tracking-tight text-white/95 dark:text-white">
                {headerText}
              </p>
            )}
            <p className="text-sm whitespace-pre-wrap leading-relaxed opacity-90">
              {bodyText}
            </p>
            {footerText && (
              <p className={`text-xs mt-1 font-normal ${isOut ? "text-white/60" : "text-slate-400"}`}>
                {footerText}
              </p>
            )}
          </div>
          <div className={`py-2.5 px-3 flex items-center justify-center gap-2 border-t font-semibold text-sm rounded-b-2xl select-none ${
            isOut ? "border-white/15 bg-black/15 text-white/95" : `border-slate-200 ${darkOrLight("bg-[#2A3942] text-[#25D366]", "bg-slate-50 text-[#005C4B]")}`
          }`}>
            <ListBulletIcon className="w-4 h-4 shrink-0 text-[#25D366]"/>
            <span className="truncate">{btnText}</span>
          </div>
          <div className="px-3 pb-2">{timeMeta}</div>
        </div>
      );
    } else if (mt === "cta-url" || mt === "cta_url") {
      const meta = msg.metadata || msg.message_metadata || {};
      const req = meta.request || (typeof msg.content === "object" ? msg.content : {}) || {};
      const interactive = meta.interactive || req.interactive || {};

      const headerType = (typeof msg.content === "object" && msg.content?.header_type) || req.header_type || interactive.header?.type || null;
      const headerLink = (typeof msg.content === "object" && msg.content?.header_link) || req.header_link || interactive.header?.image?.link || null;
      const headerText = (typeof msg.content === "object" && msg.content?.header_text) || req.header_text || interactive.header?.text || null;
      const bodyText = (typeof msg.content === "object" && msg.content?.body) || req.body || interactive.body?.text || (typeof msg.message === "string" ? msg.message.replace("[Link] ", "") : "");
      const footerText = (typeof msg.content === "object" && msg.content?.footer) || req.footer || interactive.footer?.text || null;
      const displayText = (typeof msg.content === "object" && msg.content?.display_text) || req.display_text || interactive.action?.parameters?.display_text || "Open Link";
      const urlLink = (typeof msg.content === "object" && msg.content?.url) || req.url || interactive.action?.parameters?.url || null;

      body = (
        <div className="flex flex-col min-w-[200px] max-w-[320px]">
          <div className="p-3.5 flex flex-col gap-1.5">
            {headerType === "image" && headerLink && (
              <img src={headerLink} alt="" className="w-full h-28 object-cover rounded-lg mb-1 shadow"/>
            )}
            {headerType === "text" && headerText && (
              <p className="font-bold text-[15px] leading-snug tracking-tight text-white/95 dark:text-white">{headerText}</p>
            )}
            <p className="text-sm whitespace-pre-wrap leading-relaxed opacity-90">{bodyText}</p>
            {footerText && <p className={`text-xs mt-1 font-normal ${isOut ? "text-white/60" : "text-slate-400"}`}>{footerText}</p>}
          </div>
          {urlLink ? (
            <a
              href={urlLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`py-2.5 px-3 flex items-center justify-center gap-2 border-t font-semibold text-sm rounded-b-2xl transition-colors ${
                isOut ? "border-white/15 bg-black/15 text-white/95 hover:bg-black/25" : `border-slate-200 ${darkOrLight("bg-[#2A3942] text-[#25D366] hover:bg-[#33444e]", "bg-slate-50 text-[#005C4B] hover:bg-slate-100")}`
              }`}
            >
              <LinkIcon className="w-4 h-4 shrink-0 text-[#25D366]"/>
              <span className="truncate">{displayText}</span>
            </a>
          ) : (
            <div className={`py-2.5 px-3 flex items-center justify-center gap-2 border-t font-semibold text-sm rounded-b-2xl ${
              isOut ? "border-white/15 bg-black/15 text-white/95" : `border-slate-200 ${darkOrLight("bg-[#2A3942] text-[#25D366]", "bg-slate-50 text-[#005C4B]")}`
            }`}>
              <LinkIcon className="w-4 h-4 shrink-0 text-[#25D366]"/>
              <span className="truncate">{displayText}</span>
            </div>
          )}
          <div className="px-3 pb-2">{timeMeta}</div>
        </div>
      );
    } else if (mt === "request-location") {
      body = (
        <div className="p-3">
          <span className="text-[10px] uppercase tracking-wider opacity-70 font-bold flex items-center gap-1 mb-1">
            <MapPinIcon className="w-3 h-3"/> Location Request
          </span>
          <p className="text-sm">{msg.message || (typeof msg.content === "string" ? msg.content : "")}</p>
          {timeMeta}
        </div>
      );
    } else if (mt === "request-address" || mt === "address_message" || msg.metadata?.interactive?.nfm_reply?.name === "address_message" || msg.message_metadata?.interactive?.nfm_reply?.name === "address_message") {
      const meta = msg.metadata || msg.message_metadata || {};
      const req = meta.request || (typeof msg.content === "object" ? msg.content : {}) || {};
      const nfmReply = meta.interactive?.nfm_reply || meta.nfm_reply || req.interactive?.nfm_reply;

      if (nfmReply && nfmReply.name === "address_message") {
        let addrObj = null;
        try {
          if (nfmReply.response_json) {
            addrObj = typeof nfmReply.response_json === "string" ? JSON.parse(nfmReply.response_json) : nfmReply.response_json;
          }
        } catch (_) {}

        const values = addrObj?.values || {};
        const nameVal = values.name;
        const phoneVal = values.phone_number;
        const streetLines = [
          values.house_number ? `Flat/House: ${values.house_number}` : null,
          values.floor_number ? `Floor: ${values.floor_number}` : null,
          values.tower_number ? `Tower: ${values.tower_number}` : null,
          values.building_name,
          values.address,
          values.landmark_area ? `Landmark: ${values.landmark_area}` : null
        ].filter(Boolean).join(", ");
        const cityStatePin = [values.city, values.state, values.in_pin_code].filter(Boolean).join(" - ");
        const mapQuery = [values.address, values.landmark_area, values.city, values.in_pin_code].filter(Boolean).join(", ");

        body = (
          <div className="flex flex-col min-w-[240px] max-w-[340px]">
            <div className="p-3.5 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#25D366]">
                <DocumentIcon className="w-4 h-4" />
                <span>Delivery Address Received</span>
              </div>

              {(nameVal || phoneVal) && (
                <div className="border-b pb-2 border-white/10 dark:border-white/10">
                  {nameVal && <p className="font-bold text-sm leading-tight text-white/95 dark:text-white">{nameVal}</p>}
                  {phoneVal && <p className="text-xs opacity-75 mt-0.5">{phoneVal}</p>}
                </div>
              )}

              <div className="text-xs leading-relaxed opacity-90 font-medium">
                {streetLines && <p>{streetLines}</p>}
                {cityStatePin && <p className="font-bold mt-1 text-white/95 dark:text-white">{cityStatePin}</p>}
                {!streetLines && !cityStatePin && <p className="whitespace-pre-wrap">{nfmReply.body || msg.message}</p>}
              </div>

              {mapQuery && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isOut ? "bg-white/15 hover:bg-white/25 text-white" : "bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#005C4B] dark:text-[#25D366]"
                  }`}
                >
                  <MapPinIcon className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Search Address on Map →</span>
                </a>
              )}
            </div>
            <div className="px-3 pb-2">{timeMeta}</div>
          </div>
        );
      } else {
        const countryCode = req.country || (typeof msg.content === "object" ? msg.content?.country : null) || "IN";
        const bodyText = req.body || (typeof msg.content === "object" ? msg.content?.body : null) || msg.message || "Please share your shipping address.";

        body = (
          <div className="flex flex-col min-w-[220px] max-w-[320px]">
            <div className="p-3.5">
              <span className="text-[10px] uppercase tracking-wider opacity-75 font-bold flex items-center gap-1 mb-1.5 text-[#25D366]">
                <DocumentIcon className="w-3.5 h-3.5"/> Address Request ({countryCode})
              </span>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{bodyText}</p>
            </div>
            <div className={`py-2 px-3 text-center text-xs font-bold border-t rounded-b-2xl ${
              isOut ? "border-white/15 bg-black/10 text-white/90" : `border-slate-200 ${darkOrLight("bg-[#2A3942] text-[#25D366]", "bg-slate-50 text-[#005C4B]")}`
            }`}>
              📝 Native Address Form ({countryCode})
            </div>
            <div className="px-3 pb-2 pt-1">{timeMeta}</div>
          </div>
        );
      }
    } else if (mt === "send-contact" || mt === "contacts") {
      const rc = msg.metadata?.request?.contacts || msg.metadata?.contacts || (Array.isArray(msg.content) ? msg.content : [msg.content]);
      const cl = Array.isArray(rc) ? rc.filter(Boolean) : [];
      body = (
        <div className="flex flex-col min-w-[200px]">
          <div className={`rounded-t-2xl overflow-hidden ${isOut ? "bg-black/10" : `${darkOrLight("bg-[#2A3942]", "bg-slate-50")} border border-slate-200`}`}>
            {cl.length === 0
              ? <div className="p-3 text-sm flex items-center gap-2"><UserIcon className="w-5 h-5 opacity-60"/>{msg.message || "Contact"}</div>
              : cl.slice(0, 3).map((c, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 ${i > 0 ? `border-t ${isOut ? "border-white/10" : "border-slate-200"}` : ""}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isOut ? "bg-white/20" : "bg-slate-200 text-slate-500"}`}>
                      <UserIcon className="w-5 h-5"/>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{c.name?.formatted_name || "Unknown"}</p>
                      {c.phones?.[0]?.phone && <p className="text-xs opacity-70">{c.phones[0].phone}</p>}
                    </div>
                  </div>
                ))
            }
            {cl.length > 3 && (
              <div className={`text-center text-xs font-bold py-2 border-t ${isOut ? "border-white/10 text-white/70" : "border-slate-200 text-slate-500"}`}>
                +{cl.length - 3} more
              </div>
            )}
          </div>
          <div className={`text-center text-xs font-bold py-2 cursor-pointer rounded-b-2xl ${
            isOut ? "bg-black/10 hover:bg-black/20" : `${darkOrLight("bg-[#2A3942] text-[#25D366]", "bg-slate-50 text-[#005C4B]")} hover:bg-slate-100 border border-t-0 border-slate-200`
          }`}>
            View Contact{cl.length > 1 ? "s" : ""}
          </div>
          <div className="px-3 pb-2 pt-1">{timeMeta}</div>
        </div>
      );
    } else if (mt === "carousel" || mt === "interactive-carousel") {
      body = (
        <div className="flex flex-col gap-2 max-w-[320px]">
          <div className="p-3">
            <p className="text-sm">{msg.content?.body || (typeof msg.message === "string" ? msg.message.replace(/\[Carousel\].*/, "") : "")}</p>
          </div>
          <div className="flex overflow-x-auto gap-2 pb-2 px-3 snap-x">
            {(msg.content?.cards || msg.metadata?.request?.cards || []).map((card, i) => (
              <div key={i} className={`min-w-[160px] flex-shrink-0 rounded-xl overflow-hidden snap-center flex flex-col ${
                isOut ? "bg-black/10 border border-white/20" : `${darkOrLight("bg-[#2A3942]", "bg-white")} border border-slate-200 shadow-sm`
              }`}>
                {card.header?.image?.link && <img src={card.header.image.link} alt="" className="w-full h-20 object-cover"/>}
                <div className="p-2 flex flex-col flex-1">
                  <p className="text-xs font-medium flex-1 line-clamp-2">{card.body?.text}</p>
                  <div className={`mt-1.5 text-center text-xs font-bold py-1 border-t ${isOut ? "border-white/20" : `border-slate-100 ${darkOrLight("text-[#25D366]", "text-[#005C4B]")}`}`}>
                    {card.action?.parameters?.display_text || "Link"}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-3 pb-2">{timeMeta}</div>
        </div>
      );
    } else if (mt === "product-carousel" || mt === "catalog_message") {
      body = (
        <div className="flex flex-col gap-2 min-w-[200px] max-w-[280px] p-3">
          <p className="text-sm">{msg.content?.body || (typeof msg.message === "string" ? msg.message.replace(/\[Product Catalog\].*/, "") : "")}</p>
          <div className={`p-3 rounded-lg border ${isOut ? "bg-black/10 border-white/20" : `${darkOrLight("bg-[#2A3942]", "bg-slate-50")} border-slate-200`}`}>
            <p className="text-xs font-bold mb-2 flex items-center gap-1 uppercase">
              <ShoppingBagIcon className="w-4 h-4"/>
              Catalog: {msg.content?.catalog_id || "Attached"}
            </p>
            <div className="flex flex-wrap gap-1">
              {(msg.content?.product_ids || []).map((id, i) => (
                <span key={i} className={`text-[10px] font-mono px-2 py-0.5 rounded border ${isOut ? "bg-white/20 border-white/10" : "bg-white border-slate-200"}`}>{id}</span>
              ))}
            </div>
          </div>
          {timeMeta}
        </div>
      );
    } else {
      body = (
        <div className="px-3.5 py-2.5">
          <p className="leading-relaxed text-sm whitespace-pre-wrap break-words">
            {msg.message || (typeof msg.content === "string" ? msg.content : "")}
          </p>
          {timeMeta}
        </div>
      );
    }

    const replyButton = (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setReplyingToMessage(msg);
        }}
        className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-full transition-all duration-150 ${
          isDarkMode ? "hover:bg-[#202C33] text-slate-400 hover:text-slate-200" : "hover:bg-slate-200/80 text-slate-400 hover:text-slate-700"
        }`}
        title="Reply to this message"
      >
        <ArrowUturnLeftIcon className="w-4 h-4" />
      </button>
    );

    const isHighlighted = highlightedMessageId && (msg.wamid === highlightedMessageId || String(msg.id) === String(highlightedMessageId));
    const parentMsg = findParentMessage(msg);

    return (
      <div
        id={`msg-${msg.wamid || msg.id}`}
        className={`group flex items-center gap-1.5 my-1 transition-all duration-300 ${isOut ? "justify-end flex-row" : "justify-start flex-row"}`}
      >
        {isOut && replyButton}
        <div className={`${bubbleCls} ${isHighlighted ? "ring-2 ring-[#25D366] ring-offset-2 ring-offset-[#0B141A] scale-[1.02]" : ""}`} style={{ wordBreak: "break-word" }}>
          {parentMsg && (
            <div className="pt-2 px-2 pb-0.5">
              {renderQuotedCard(parentMsg)}
            </div>
          )}
          {body}
        </div>
        {!isOut && replyButton}
      </div>
    );
  };

  const hdr = isDarkMode ? "bg-[#202C33]" : "bg-[#F0F2F5]";

  return (
    <div className={`flex-1 min-h-0 w-full h-full flex overflow-hidden ${isDarkMode ? "bg-[#111B21]" : "bg-[#F0F2F5]"}`}>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <div className={`${selectedSenderNumber ? "hidden lg:flex" : "flex"} w-full lg:w-[340px] lg:min-w-[280px] lg:max-w-[400px] border-r flex-col z-10 ${isDarkMode ? "border-[#202C33] bg-[#111B21]" : "border-slate-200 bg-white"}`}>

        {/* Header */}
        <div className={`px-4 pt-4 pb-3 border-b ${isDarkMode ? "border-[#202C33]" : "border-slate-100"}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>Messages</h2>
            {totalUnread > 0 && (
              <span className="bg-[#25D366] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
          <div className={`relative flex items-center rounded-xl px-3 py-1.5 ${isDarkMode ? "bg-[#202C33]" : "bg-slate-100"}`}>
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 shrink-0 mr-2"/>
            <input
              type="text" placeholder="Search or start new chat"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className={`flex-1 bg-transparent text-sm focus:outline-none ${isDarkMode ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}`}
            />
          </div>
          <div className="flex gap-2 mt-3">
            {["all", "unread"].map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                  activeFilter === f
                    ? "bg-[#25D366] text-white shadow-sm"
                    : isDarkMode ? "bg-[#202C33] text-slate-400 hover:bg-[#2A3942]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}>
                {f === "all" ? "All" : `Unread${totalUnread > 0 ? ` (${totalUnread})` : ""}`}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading chats...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <ChatBubbleLeftRightIcon className="w-10 h-10 mx-auto text-slate-300 mb-3"/>
              <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                {activeFilter === "unread" ? "No unread messages" : "No conversations yet"}
              </p>
            </div>
          ) : filteredConversations.map(chat => {
            const isSel = isPhoneMatch(selectedSenderNumber, chat.sender_number);
            const unread = chat.unread_count > 0;
            return (
              <div
                key={chat.sender_number || Math.random()}
                onClick={() => setSelectedSenderNumber(chat.sender_number)}
                className={`px-3 py-3 cursor-pointer transition-all border-b flex items-center gap-3 ${
                  isDarkMode ? "border-[#202C33]/60" : "border-slate-100/80"
                } ${isSel
                  ? isDarkMode ? "bg-[#2A3942]" : "bg-[#F0F2F5]"
                  : isDarkMode ? "hover:bg-[#202C33]" : "hover:bg-slate-50"
                }`}
              >
                <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-bold text-lg ${isDarkMode ? "bg-[#2A3942] text-slate-400" : "bg-[#DFE5EA] text-slate-500"}`}>
                  {(chat.display_name || chat.sender_number || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`font-semibold text-[15px] truncate ${isDarkMode ? "text-gray-100" : "text-slate-900"}`}>
                      {chat.display_name}
                    </h3>
                    <span className={`text-[11px] whitespace-nowrap ml-2 ${unread ? "text-[#25D366] font-semibold" : isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                      {formatConversationTime(chat.sent_at || chat.time_stamp)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className={`text-[13px] truncate flex-1 flex items-center gap-1 ${
                      unread ? isDarkMode ? "text-slate-200 font-medium" : "text-slate-800 font-medium"
                             : isDarkMode ? "text-slate-500" : "text-slate-500"
                    }`}>
                      {chat.last_message_direction === "outbound" && (
                        <span className="shrink-0 inline-flex">
                          <MessageTicks status={chat.last_message_status} isOutbound={true}/>
                        </span>
                      )}
                      <span className="truncate">{chat.last_message}</span>
                    </p>
                    {unread && (
                      <span className="bg-[#25D366] text-white text-[10px] font-bold px-1.5 min-w-[20px] h-5 rounded-full flex items-center justify-center shrink-0">
                        {chat.unread_count > 99 ? "99+" : chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CHAT AREA ──────────────────────────────────────────────────────── */}
      <div className={`${!selectedSenderNumber ? "hidden lg:flex" : "flex"} flex-1 flex-col relative z-0 min-h-0 ${isDarkMode ? "bg-[#0B141A]" : "bg-[#EFEAE2]"}`}>
        {selectedSenderNumber ? (
          <>
            {/* Header */}
            <div className={`shrink-0 px-4 py-3 flex items-center gap-3 shadow-sm z-10 ${hdr}`}>
              <button
                onClick={() => setSelectedSenderNumber(null)}
                className={`lg:hidden p-1.5 rounded-full transition-colors ${isDarkMode ? "hover:bg-[#2A3942]" : "hover:bg-slate-200"}`}
              >
                <ArrowLeftIcon className={`w-5 h-5 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}/>
              </button>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${isDarkMode ? "bg-[#2A3942] text-slate-300" : "bg-[#DFE5EA] text-slate-500"}`}>
                {(selectedName || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-base truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>{selectedName}</h3>
                <p className={`text-xs truncate ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{selectedSenderNumber}</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-1">
              {loading
                ? <div className="flex items-center justify-center h-full"><div className="text-slate-400 text-sm animate-pulse">Loading messages...</div></div>
                : messagesWithSeparators.length === 0
                ? <div className="flex items-center justify-center h-full"><p className={`text-sm ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>No messages yet</p></div>
                : messagesWithSeparators.map(item =>
                    item.type === "sep"
                      ? <DateSeparator key={item.key} label={item.label} isDarkMode={isDarkMode}/>
                      : <div key={item.key} className="mb-0.5">{renderBubble(item.msg)}</div>
                  )
              }
            </div>

            {/* Input area */}
            <div className={`shrink-0 px-4 py-3 relative z-20 ${hdr}`}>
              {/* Attachment popup */}
              {showAttachments && (
                <div className={`absolute bottom-20 left-4 rounded-2xl p-4 z-50 w-72 grid grid-cols-2 gap-2 shadow-2xl border ${isDarkMode ? "bg-[#233138] border-[#2A3942]" : "bg-white border-slate-100"}`}>
                  <div className={`col-span-2 text-[10px] font-bold mb-1 uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Media & Docs</div>
                  <ActionMenuButton isDarkMode={isDarkMode} colorClass="bg-pink-500"    icon={<PhotoIcon    className="w-4 h-4"/>} label="Image / Video"    onClick={() => { setShowAttachments(false); setActiveBuilder("media");            }}/>
                  <ActionMenuButton isDarkMode={isDarkMode} colorClass="bg-purple-500"  icon={<DocumentIcon className="w-4 h-4"/>} label="Document"         onClick={() => { setShowAttachments(false); setActiveBuilder("document");         }}/>
                  <ActionMenuButton isDarkMode={isDarkMode} colorClass="bg-orange-500"  icon={<MusicalNoteIcon className="w-4 h-4"/>} label="Audio"         onClick={() => { setShowAttachments(false); setActiveBuilder("audio");           }}/>
                  <div className={`col-span-2 text-[10px] font-bold mt-2 mb-1 uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Interactive</div>
                  <ActionMenuButton isDarkMode={isDarkMode} colorClass="bg-[#25D366]"   icon={<CheckCircleIcon className="w-4 h-4"/>} label="Reply Buttons"  onClick={() => { setShowAttachments(false); setActiveBuilder("reply-buttons");   }}/>
                  <ActionMenuButton isDarkMode={isDarkMode} colorClass="bg-[#25D366]"   icon={<ListBulletIcon  className="w-4 h-4"/>} label="List Menu"      onClick={() => { setShowAttachments(false); setActiveBuilder("list");           }}/>
                  <ActionMenuButton isDarkMode={isDarkMode} colorClass="bg-[#25D366]"   icon={<ViewColumnsIcon className="w-4 h-4"/>} label="Carousel"       onClick={() => { setShowAttachments(false); setActiveBuilder("carousel");       }}/>
                  <ActionMenuButton isDarkMode={isDarkMode} colorClass="bg-[#25D366]"   icon={<LinkIcon        className="w-4 h-4"/>} label="CTA Link"       onClick={() => { setShowAttachments(false); setActiveBuilder("cta-url");        }}/>
                  <ActionMenuButton isDarkMode={isDarkMode} colorClass="bg-[#25D366]"   icon={<ShoppingBagIcon className="w-4 h-4"/>} label="Products"       onClick={() => { setShowAttachments(false); setActiveBuilder("product-carousel");}}/>
                  <div className={`col-span-2 text-[10px] font-bold mt-2 mb-1 uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Utilities</div>
                  <ActionMenuButton isDarkMode={isDarkMode} colorClass="bg-emerald-500" icon={<MapPinIcon  className="w-4 h-4"/>} label="Send Location"     onClick={() => { setShowAttachments(false); setActiveBuilder("send-location");   }}/>
                  <ActionMenuButton isDarkMode={isDarkMode} colorClass="bg-teal-500"    icon={<MapPinIcon  className="w-4 h-4"/>} label="Request Location"  onClick={() => { setShowAttachments(false); setActiveBuilder("request-location");}}/>
                  <ActionMenuButton isDarkMode={isDarkMode} colorClass="bg-blue-500"    icon={<UserIcon    className="w-4 h-4"/>} label="Send Contact"      onClick={() => { setShowAttachments(false); setActiveBuilder("contact");        }}/>
                  <ActionMenuButton isDarkMode={isDarkMode} colorClass="bg-indigo-500"  icon={<DocumentIcon className="w-4 h-4"/>} label="Request Address"  onClick={() => { setShowAttachments(false); setActiveBuilder("request-address");}}/>
                </div>
              )}
              {/* Replying banner */}
              {replyingToMessage && (
                <div className={`mb-2 p-2.5 rounded-xl flex items-center justify-between border-l-4 border-[#25D366] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                  isDarkMode ? "bg-[#1F2C34] text-white" : "bg-white text-slate-800"
                }`}>
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#25D366]">
                      <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
                      <span>
                        Replying to {replyingToMessage.direction === "outbound" || replyingToMessage.sender === "agent" ? "yourself" : (selectedName || "Customer")}
                      </span>
                    </div>
                    <p className="text-xs truncate opacity-80 mt-0.5 font-normal">
                      {getMessageSnippet(replyingToMessage)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingToMessage(null)}
                    className={`p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors shrink-0`}
                    title="Cancel reply"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
              <form onSubmit={handleSendText} className="flex items-center gap-2">
                <button type="button" onClick={() => setShowAttachments(!showAttachments)}
                  className={`p-2.5 rounded-full transition-colors ${isDarkMode ? "text-slate-400 hover:bg-[#2A3942]" : "text-slate-500 hover:bg-slate-200"}`}>
                  {showAttachments ? <XMarkIcon className="w-5 h-5"/> : <PaperClipIcon className="w-5 h-5"/>}
                </button>
                <input
                  type="text" value={inputText} onChange={e => setInputText(e.target.value)}
                  placeholder="Type a message"
                  className={`flex-1 rounded-full px-5 py-2.5 text-sm focus:outline-none transition-all ${
                    isDarkMode
                      ? "bg-[#2A3942] text-white placeholder-slate-500 border border-transparent focus:border-[#25D366]/30"
                      : "bg-white text-slate-900 placeholder-slate-400 border border-slate-200 focus:border-[#25D366]/40"
                  }`}
                />
                <button type="submit" disabled={!inputText.trim()}
                  className={`p-2.5 rounded-full transition-all duration-200 ${
                    !inputText.trim()
                      ? isDarkMode ? "bg-[#2A3942] text-slate-600" : "bg-slate-200 text-slate-400"
                      : "bg-[#25D366] text-white hover:bg-[#22C55E] shadow-md shadow-green-500/30"
                  }`}>
                  <PaperAirplaneIcon className="w-5 h-5"/>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? "bg-[#202C33]" : "bg-white shadow-inner"}`}>
              <ChatBubbleLeftRightIcon className={`w-10 h-10 ${isDarkMode ? "text-slate-600" : "text-slate-300"}`}/>
            </div>
            <p className={`text-lg font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>NimbleAI for WhatsApp</p>
            <p className={`text-sm mt-2 max-w-xs text-center ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
              Select a conversation from the sidebar to start messaging.
            </p>
          </div>
        )}
      </div>

      {/* ── MODAL MANAGER ─────────────────────────────────────────────────── */}
      {activeBuilder && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${isDarkMode ? "bg-[#202C33] text-white" : "bg-white text-slate-900"}`}>
            <div className={`flex justify-between items-center px-5 py-4 border-b ${isDarkMode ? "border-[#2A3942]" : "border-slate-100"}`}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#25D366]"/>
                <h3 className="text-base font-bold capitalize">{activeBuilder.replace(/-/g, " ")}</h3>
              </div>
              <button onClick={() => setActiveBuilder(null)}
                className={`p-1.5 rounded-full transition-colors ${isDarkMode ? "hover:bg-[#2A3942] text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
                <XMarkIcon className="w-5 h-5"/>
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {activeBuilder === "reply-buttons"   ? <ReplyButtonsBuilder      isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)}/>
              : activeBuilder === "media" || activeBuilder === "document" || activeBuilder === "audio"
                                                  ? <MediaBuilder             isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)}/>
              : activeBuilder === "send-location"   ? <LocationBuilder          isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)}/>
              : activeBuilder === "request-location"? <RequestLocationBuilder   isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)}/>
              : activeBuilder === "contact"          ? <ContactBuilder           isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)}/>
              : activeBuilder === "request-address"  ? <RequestAddressBuilder    isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)}/>
              : activeBuilder === "list"             ? <InteractiveListBuilder   isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)}/>
              : activeBuilder === "carousel"         ? <InteractiveCarouselBuilder isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)}/>
              : activeBuilder === "cta-url"          ? <CtaUrlBuilder            isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)}/>
              : activeBuilder === "product-carousel" ? <ProductCarouselBuilder   isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)}/>
              : <DummyBuilder name={activeBuilder.replace(/-/g, " ")} onClose={() => setActiveBuilder(null)}/>}
            </div>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN LIGHTBOX / MEDIA VIEWER ────────────────────────────── */}
      {lightboxMedia && (
        <div 
          onClick={() => setLightboxMedia(null)}
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
        >
          {/* Header Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-3 z-10" onClick={e => e.stopPropagation()}>
            <a
              href={lightboxMedia.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors shadow"
              title="Download full file"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
            </a>
            <button
              onClick={() => setLightboxMedia(null)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors shadow"
              title="Close viewer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Media Container */}
          <div className="max-w-4xl max-h-[85vh] w-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            {lightboxMedia.type === "video" ? (
              <video
                src={lightboxMedia.url}
                controls
                autoPlay
                className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl bg-black"
              />
            ) : (
              <img
                src={lightboxMedia.url}
                alt={lightboxMedia.caption || "Full photo"}
                className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
              />
            )}
            {lightboxMedia.caption && !lightboxMedia.caption.startsWith("[") && (
              <p className="text-white text-xs sm:text-sm text-center mt-3 bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-sm shadow border border-white/10">
                {lightboxMedia.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveChat;
