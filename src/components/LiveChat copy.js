import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import websocketService from '../services/websocketService';
import { fetchRecentChats, chatService, formatRelativeTime } from '../services/chatService';
import { 
  ReplyButtonsBuilder, 
  MediaBuilder, 
  LocationBuilder, 
  RequestLocationBuilder, 
  ContactBuilder, 
  RequestAddressBuilder,
  InteractiveListBuilder,
  InteractiveCarouselBuilder,
  CtaUrlBuilder,
  ProductCarouselBuilder,
  DummyBuilder 
} from './LiveChatModals';

import { 
  MagnifyingGlassIcon, 
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon, 
  PaperClipIcon, 
  MapPinIcon, 
  PhotoIcon, 
  DocumentIcon, 
  XMarkIcon,
  MusicalNoteIcon, 
  UserIcon, 
  LinkIcon, 
  ListBulletIcon, 
  ViewColumnsIcon, 
  ShoppingBagIcon, 
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const LiveChat = ({ isDarkMode }) => {
  const { user, userData } = useAuth();
  
  // 1. ONE Source of Truth
  const [allMessages, setAllMessages] = useState([]); 
  const [selectedSenderNumber, setSelectedSenderNumber] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Input State
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  
  // Modal / Builder State
  const [activeBuilder, setActiveBuilder] = useState(null);

  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // 2. Load Data
  useEffect(() => {
    const userId = user?.db_id || userData?.db_id;
    if (!userId) {
      setLoading(false);
      return;
    }

    websocketService.connect(userId);

    const loadData = async () => {
      try {
        const data = await fetchRecentChats(userId);
        if (data && data.data) {
          const sorted = data.data.sort((a, b) => {
             const tA = new Date(a.created_at || a.time_stamp).getTime();
             const tB = new Date(b.created_at || b.time_stamp).getTime();
             return tA - tB;
          });
          setAllMessages(sorted);
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    const handleNewMessage = (newMessage) => {
      setAllMessages(prev => [...prev, newMessage]);
      if (selectedSenderNumber === newMessage.sender_number) {
        scrollToBottom();
      }
    };

    websocketService.socket?.on('new_message', handleNewMessage);
    return () => websocketService.socket?.off('new_message', handleNewMessage);
  }, [user, userData, selectedSenderNumber]);

  // 3. Sidebar List
  const conversations = useMemo(() => {
    const groups = new Map();
    [...allMessages].reverse().forEach(msg => {
      const contactNum = msg.sender_number; 
      
      if (contactNum && !groups.has(contactNum)) {
        groups.set(contactNum, {
          sender_number: contactNum,
          sender_name: msg.sender_name || contactNum,
          last_message: msg.message || msg.content || '[Media]',
          time_stamp: msg.time_stamp || msg.created_at
        });
      }
    });

    let params = Array.from(groups.values());
    if (searchQuery) {
      params = params.filter(c => 
        c.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.sender_number?.includes(searchQuery)
      );
    }
    return params;
  }, [allMessages, searchQuery]);

// 4. Chat History
  const activeMessages = useMemo(() => {
    if (!selectedSenderNumber) return [];
    return allMessages.filter(m => 
      m.sender_number === selectedSenderNumber || 
      m.to_number === selectedSenderNumber
    );
  }, [allMessages, selectedSenderNumber]);

  // SINGLE, ROBUST SCROLL LOGIC
  const scrollToBottom = () => {
    // The 100ms timeout guarantees React has finished drawing the new message on screen
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  // Run this whenever the active messages change (new message sent/received, or different chat opened)
  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  // --- HANDLERS ---
  const handleSendText = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedSenderNumber) return;

    const tempId = Date.now();
    const tempMsg = {
      id: tempId,
      message: inputText,
      direction: 'outbound',
      time_stamp: new Date().toISOString(),
      status: 'sending'
    };

    setAllMessages(prev => [...prev, tempMsg]);
    setInputText('');

    try {
      await chatService.sendText(selectedSenderNumber, tempMsg.message);
      setAllMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m));
    } catch (error) {
      console.error('Send failed', error);
      setAllMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
    }
  };

  const handleOpenBuilder = (type) => {
    setShowAttachments(false);
    setActiveBuilder(type);
  };

  const handleActionDirectly = async (type) => {
    setShowAttachments(false);
    if (!selectedSenderNumber) return;

    try {
      if (type === 'request-location') {
        console.log("Requesting Location from:", selectedSenderNumber);
      }
    } catch (error) {
      console.error(`Failed to execute ${type}:`, error);
    }
  };

const handleSendComplexMessage = async ({ type, payload }) => {
    if (!selectedSenderNumber) return;
    
    // 1. Close modal immediately
    setActiveBuilder(null);
    
    // 2. Set the display message based on the type
    let displayMessage = '[Interactive Message]';
    if (type === 'reply-buttons') displayMessage = payload.body;
    if (type === 'media') displayMessage = payload.caption || `[${payload.mediaType.toUpperCase()}] ${payload.file?.name || 'Attachment'}`;
    if (type === 'send-location') displayMessage = payload.name || `Location: ${payload.latitude}, ${payload.longitude}`;
    if (type === 'request-location') displayMessage = payload.body;
    if (type === 'send-contact') displayMessage = `Contact: ${payload.name.formatted_name}`; 
    if (type === 'request-address') displayMessage = payload.body; 
    if (type === 'interactive-list') displayMessage = `[Menu] ${payload.button_text}`; 
    if (type === 'interactive-carousel') displayMessage = `[Carousel] ${payload.cards.length} cards`; 
    if (type === 'cta-url') displayMessage = `[Link] ${payload.display_text}`; 
    if (type === 'product-carousel') displayMessage = `[Catalog] ${payload.product_ids.length} items`; 

    const tempId = Date.now();
    const tempMsg = {
      id: tempId,
      message: displayMessage,
      message_type: type === 'media' ? payload.mediaType : type,
      direction: 'outbound',
      time_stamp: new Date().toISOString(),
      status: 'sending',
      localPreview: payload.localPreview,
      content: payload 
    };
    
    setAllMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    // 3. Send via chatService
    try {
      if (type === 'reply-buttons') {
        await chatService.sendReplyButtons(selectedSenderNumber, payload);
      } 
      else if (type === 'media') {
        const uploadRes = await chatService.uploadMedia(payload.file);
        const mediaId = uploadRes.id || uploadRes.data?.id || uploadRes.media_id; 
        if (!mediaId) throw new Error("Upload succeeded but no Media ID was returned.");
        await chatService.sendMedia(selectedSenderNumber, mediaId, payload.mediaType, payload.caption);
      } 
      else if (type === 'send-location') {
        await chatService.sendLocation(selectedSenderNumber, payload.latitude, payload.longitude, payload.name, payload.address);
      } 
      else if (type === 'request-location') {
        await chatService.sendLocationRequest(selectedSenderNumber, payload.body);
      }
      else if (type === 'send-contact') {
        await chatService.sendContact(selectedSenderNumber, payload);
      }
      else if (type === 'request-address') {
        await chatService.sendAddressRequest(selectedSenderNumber, payload);
      }
      else if (type === 'interactive-list') {
        await chatService.sendInteractiveList(selectedSenderNumber, payload);
      }
      else if (type === 'interactive-carousel') {
        await chatService.sendInteractiveCarousel(selectedSenderNumber, payload);
      }
      else if (type === 'cta-url') {
        await chatService.sendCtaUrl(selectedSenderNumber, payload);
      }
      else if (type === 'product-carousel') {
        await chatService.sendProductCarousel(selectedSenderNumber, payload);
      }

      setAllMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m));
    } catch (error) {
      console.error(`Failed to send ${type}`, error);
      setAllMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
    }
  };

  // --- HELPER: Extract Media URL ---
  const getMediaUrl = (msg) => {
    if (!msg.metadata) return null;
    let mediaId = null;
    if (msg.direction === 'outbound' && msg.metadata.request?.id) {
      mediaId = msg.metadata.request.id;
    } 
    else if (msg.direction === 'inbound') {
      if (msg.message_type === 'image') mediaId = msg.metadata.image?.id;
      if (msg.message_type === 'video') mediaId = msg.metadata.video?.id;
    }
    const WA_SERVER_URL = 'https://api.nimbleai.in/api/wa-server'; 
    return mediaId ? `${WA_SERVER_URL}/media/download/${mediaId}` : null;
  };
  
  const selectedName = conversations.find(c => c.sender_number === selectedSenderNumber)?.sender_name || selectedSenderNumber;

  return (
    <div className={`h-[calc(100vh-64px)] flex relative ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
      
      {/* SIDEBAR */}
      <div className={`w-1/4 min-w-[320px] border-r flex flex-col z-10 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <div className="p-4">
          <h2 className={`text-xl font-bold tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Messages</h2>
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-all ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
             <div className="p-8 text-center text-slate-400 text-sm font-medium animate-pulse">Loading chats...</div>
          ) : conversations.map((chat) => {
            const isSelected = selectedSenderNumber === chat.sender_number;
            return (
              <div
                key={chat.sender_number}
                onClick={() => setSelectedSenderNumber(chat.sender_number)}
                className={`p-4 cursor-pointer transition-all border-b ${
                  isDarkMode ? 'border-slate-800' : 'border-slate-100'
                } ${
                  isSelected 
                    ? (isDarkMode ? 'bg-slate-800 border-l-4 border-l-[#25D366]' : 'bg-[#F9FAFB] border-l-4 border-l-[#25D366]') 
                    : 'border-l-4 border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-semibold text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-slate-900'}`}>
                    {chat.sender_name}
                  </h3>
                  <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap ml-2">
                    {formatRelativeTime(chat.time_stamp)}
                  </span>
                </div>
                <p className={`text-sm truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {chat.last_message}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex flex-col relative z-0 ${isDarkMode ? 'bg-[#0A0A0A]' : 'bg-[#F9FAFB]'}`}>
        {selectedSenderNumber ? (
          <>
            <div className={`p-4 border-b flex justify-between items-center z-10 backdrop-blur-md ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
              <div>
                <h3 className={`font-bold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{selectedName}</h3>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{selectedSenderNumber}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeMessages.map((msg, idx) => {
                 const isOutbound = msg.direction === 'outbound' || msg.sender === 'agent';

                 return (
                   <div key={idx} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[70%] p-3.5 rounded-2xl text-sm shadow-sm ${
                       isOutbound 
                         ? 'bg-[#DCF8C6] text-white rounded-br-sm' 
                         : (isDarkMode ? 'bg-slate-800 text-gray-200' : 'bg-white border border-slate-200 text-slate-800') + ' rounded-bl-sm'
                     }`}>
                       
                      {/* --- RICH MEDIA RENDERER --- */}
                       {msg.message_type === 'image' || msg.message_type === 'video' ? (
                         <div className="flex flex-col gap-2">
                           {msg.localPreview ? (
                             msg.message_type === 'image' 
                               ? <img src={msg.localPreview} alt="uploading" className="rounded-xl max-h-64 object-cover" />
                               : <video src={msg.localPreview} className="rounded-xl max-h-64" controls />
                           ) : 
                           getMediaUrl(msg) ? (
                             msg.message_type === 'image' 
                               ? <img src={getMediaUrl(msg)} alt="attachment" className="rounded-xl max-h-64 object-cover" />
                               : <video src={getMediaUrl(msg)} className="rounded-xl max-h-64" controls />
                           ) : (
                             <div className={`flex items-center gap-2 p-3 rounded-lg ${isOutbound ? 'bg-black/10' : 'bg-slate-100 dark:bg-slate-700'}`}>
                               <PhotoIcon className="w-5 h-5" /> 
                               <span className="italic font-medium">
                                 {msg.message_type === 'image' ? 'Image' : 'Video'} Attachment
                               </span>
                             </div>
                           )}
                           {msg.content && !msg.content.startsWith('[') && (
                             <p className="mt-1">{msg.content}</p>
                           )}
                         </div>
                         
                       ) : msg.message_type === 'document' || msg.message_type === 'audio' ? (
                         <div className="flex flex-col gap-2">
                           <div className={`flex items-center gap-3 p-3 rounded-lg ${isOutbound ? 'bg-black/10' : 'bg-slate-100 dark:bg-slate-700'}`}>
                             {msg.message_type === 'audio' ? <MusicalNoteIcon className="w-5 h-5" /> : <DocumentIcon className="w-5 h-5" />}
                             <span className="font-medium capitalize">{msg.message_type} Attachment</span>
                           </div>
                           {msg.content && !msg.content.startsWith('[') && <p>{msg.content}</p>}
                         </div>
                       
                       ) : msg.message_type === 'send-location' || msg.message_type === 'location' ? (
                         <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-3 bg-black/10 p-3 rounded-xl">
                             <div className="p-2 bg-white/20 rounded-full text-white">
                               <MapPinIcon className="w-5 h-5" />
                             </div>
                             <div>
                               <p className="font-bold text-sm">
                                 {msg.content?.name || msg.message || 'Pinned Location'}
                               </p>
                               {msg.content?.address && (
                                 <p className="text-xs opacity-90 mt-0.5">{msg.content.address}</p>
                               )}
                             </div>
                           </div>
                           <a 
                             href={`https://maps.google.com/?q=${msg.content?.latitude || ''},${msg.content?.longitude || ''}`} 
                             target="_blank" 
                             rel="noreferrer"
                             className="text-xs font-bold hover:underline mt-1 opacity-90 inline-block"
                           >
                             View on Map →
                           </a>
                         </div>
                       ) : msg.message_type === 'interactive' || msg.message_type === 'reply-buttons' ? (
                          <div className="flex flex-col gap-1">
                             <span className="text-[10px] uppercase tracking-wider opacity-80 font-bold mb-1 flex items-center gap-1">
                               <CheckCircleIcon className="w-3 h-3"/> Interactive Message
                             </span>
                             <p className="text-base">{msg.message || msg.content}</p>
                          </div>
                      ) : msg.message_type === 'list' || msg.message_type === 'interactive-list' ? (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            {msg.content?.header && <p className="font-bold text-sm">{msg.content.header}</p>}
                            <p>{msg.content?.body || msg.message.replace('[Menu] ', '')}</p>
                            {msg.content?.footer && <p className="text-xs opacity-80">{msg.content.footer}</p>}
                            <div className={`mt-2 py-2 flex items-center justify-center gap-2 border-t font-bold text-sm rounded-b-lg ${isOutbound ? 'border-white/20 bg-black/10' : 'border-slate-200 bg-slate-50 text-[#25D366]'}`}>
                              <ListBulletIcon className="w-4 h-4" />
                              {msg.content?.button_text || 'Menu'}
                            </div>
                          </div>
                      ) : msg.message_type === 'carousel' || msg.message_type === 'interactive-carousel' ? (
                          <div className="flex flex-col gap-2 max-w-[320px] overflow-hidden">
                            <p className="text-sm px-1">
                              {msg.content?.body || msg.message.replace(/\[Carousel\].*/, '') || 'Carousel Message'}
                            </p>
                            <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar snap-x">
                              {(msg.content?.cards || msg.metadata?.request?.cards || []).map((card, idx) => (
                                <div key={idx} className={`min-w-[200px] flex-shrink-0 rounded-xl overflow-hidden snap-center flex flex-col ${isOutbound ? 'bg-black/10 border border-white/20' : 'bg-white border border-slate-200 shadow-sm'}`}>
                                  {card.header?.image?.link && (
                                    <img src={card.header.image.link} alt={`Card ${idx}`} className="w-full h-28 object-cover border-b border-black/10" />
                                  )}
                                  <div className="p-3 flex flex-col flex-1">
                                    <p className="text-sm font-medium flex-1 line-clamp-2">{card.body?.text}</p>
                                    <div className={`mt-3 text-center text-xs font-bold py-2 border-t ${isOutbound ? 'border-white/20' : 'border-slate-100 text-[#25D366]'}`}>
                                      {card.action?.parameters?.display_text || 'Link'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                      ) : msg.message_type === 'cta-url' || msg.message_type === 'cta_url' ? (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            {msg.content?.header_type === 'image' && msg.content?.header_link && (
                              <img src={msg.content.header_link} alt="Header" className="w-full h-32 object-cover rounded-lg mb-1" />
                            )}
                            {msg.content?.header_type === 'text' && msg.content?.header_text && (
                              <p className="font-bold text-sm">{msg.content.header_text}</p>
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content?.body || msg.message.replace('[Link] ', '')}</p>
                            {msg.content?.footer && <p className="text-xs opacity-80">{msg.content.footer}</p>}
                            <div className={`mt-2 py-2.5 flex items-center justify-center gap-2 border-t font-bold text-sm rounded-b-lg ${isOutbound ? 'border-white/20 bg-black/10 text-white' : 'border-slate-200 bg-slate-50 text-[#25D366]'}`}>
                              <LinkIcon className="w-4 h-4" />
                              {msg.content?.display_text || 'Open Link'}
                            </div>
                          </div>
                      ): msg.message_type === 'product-carousel' || msg.message_type === 'catalog_message' ? (
                          <div className="flex flex-col gap-2 min-w-[200px] max-w-[280px]">
                            <p className="text-sm px-1">
                              {msg.content?.body || msg.message.replace(/\[Product Catalog\].*/, '') || 'Product Catalog'}
                            </p>
                            <div className={`p-3 rounded-lg border ${isOutbound ? 'bg-black/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
                              <p className="text-xs font-bold mb-2 flex items-center gap-1 uppercase tracking-wider">
                                <ShoppingBagIcon className="w-4 h-4"/> 
                                Catalog: {msg.content?.catalog_id || msg.metadata?.request?.catalog_id || 'Attached'}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {(msg.content?.product_ids || msg.metadata?.request?.product_ids || []).map((id, i) => (
                                  <span key={i} className={`text-[10px] font-mono px-2 py-1 rounded shadow-sm border truncate max-w-[100px] ${isOutbound ? 'bg-white/20 border-white/10' : 'bg-white border-slate-200'}`}>
                                    {id}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                       ): msg.message_type === 'request-location' ? (
                          <div className="flex flex-col gap-1">
                             <span className="text-[10px] uppercase tracking-wider opacity-80 font-bold mb-1 flex items-center gap-1">
                               <MapPinIcon className="w-3 h-3"/> Location Request
                             </span>
                             <p>{msg.message || msg.content}</p>
                          </div>
                       ) : msg.message_type === 'send-contact' || msg.message_type === 'contacts' ? (
                          <div className="flex flex-col min-w-[200px] max-w-[280px]">
                            {(() => {
                              const rawContacts = msg.metadata?.request?.contacts || 
                                                  msg.metadata?.contacts || 
                                                  (Array.isArray(msg.content) ? msg.content : [msg.content]);
                              
                              const contactsList = Array.isArray(rawContacts) ? rawContacts.filter(Boolean) : [];
                              const count = contactsList.length;

                              if (count === 0) {
                                return ( 
                                  <div className={`p-3 rounded-lg text-sm ${isOutbound ? 'bg-black/10' : 'bg-slate-50'}`}>
                                    <UserIcon className="w-5 h-5 inline mr-2 opacity-80" />
                                    {msg.message || 'Contact Card'}
                                  </div>
                                );
                              }

                              return (
                                <div className={`rounded-lg overflow-hidden ${isOutbound ? 'bg-black/10' : 'bg-slate-50 border border-slate-200'}`}>
                                  {contactsList.slice(0, 3).map((c, i) => (
                                    <div key={i} className={`flex items-center gap-3 p-3 ${i > 0 ? (isOutbound ? 'border-t border-white/10' : 'border-t border-slate-200') : ''}`}>
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isOutbound ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>
                                        <UserIcon className="w-5 h-5" />
                                      </div>
                                      <div className="flex flex-col overflow-hidden">
                                        <span className="font-bold text-sm truncate">{c.name?.formatted_name || 'Unknown Contact'}</span>
                                        {c.phones?.[0]?.phone && <span className="text-xs opacity-80 truncate">{c.phones[0].phone}</span>}
                                      </div>
                                    </div>
                                  ))}
                                  {count > 3 && (
                                    <div className={`text-center text-xs font-bold py-2 border-t ${isOutbound ? 'border-white/10 text-white/70' : 'border-slate-200 text-slate-500'}`}>
                                      + {count - 3} more contacts
                                    </div>
                                  )}
                                  <div className={`text-center text-xs font-bold py-2.5 border-t cursor-pointer transition-colors ${isOutbound ? 'border-white/10 hover:bg-black/20' : 'border-slate-200 text-[#25D366] hover:bg-slate-100'}`}>
                                    View Contact{count > 1 ? 's' : ''}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                       ) : msg.message_type === 'request-address' || msg.message_type === 'address_message' ? (
                          <div className="flex flex-col gap-1">
                             <span className="text-[10px] uppercase tracking-wider opacity-80 font-bold mb-1 flex items-center gap-1">
                               <DocumentIcon className="w-3 h-3"/> Address Request
                             </span>
                             <p>{msg.message || msg.content?.body}</p>
                             <div className={`mt-2 text-[10px] uppercase tracking-wider font-bold pt-2 border-t ${isOutbound ? 'border-white/20' : 'border-slate-200'}`}>
                               Requested for: {msg.content?.country || msg.metadata?.country || 'IN'}
                             </div>
                          </div>   
                       ) : (
                         <p className="leading-relaxed">{msg.message || msg.content}</p>
                       )}
                       
                       {/* TIMESTAMP & TICKS */}
                       <div className={`text-[10px] font-medium mt-1.5 text-right flex justify-end items-center gap-1 tracking-wider ${isOutbound ? 'text-white/80' : 'text-slate-400'}`}>
                         <span>{formatRelativeTime(msg.time_stamp || msg.created_at)}</span>
                         {msg.status === 'sending' && <span>⏳</span>}
                         {msg.status === 'sent' && <span>✓</span>}
                         {msg.status === 'delivered' && <span>✓✓</span>}
                         {msg.status === 'read' && <span className={isOutbound ? "text-white drop-shadow-md" : "text-[#25D366]"}>✓✓</span>}
                         {msg.status === 'failed' && <span className="text-red-300">❌</span>}
                       </div>
                     </div>
                   </div>
                 );
               })}
               <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <div className={`p-4 border-t relative z-20 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              
              {/* UNIVERSAL ACTION MENU */}
              {showAttachments && (
                <div className={`absolute bottom-20 left-4 rounded-2xl p-5 z-50 w-80 grid grid-cols-2 gap-2 shadow-[0_0_40px_rgba(37,211,102,0.1)] border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                  
                  <div className={`col-span-2 text-[10px] font-bold mb-1 uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Media & Docs</div>
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<PhotoIcon className="text-blue-500" />} label="Image/Video" onClick={() => handleOpenBuilder('media')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<DocumentIcon className="text-purple-500" />} label="Document" onClick={() => handleOpenBuilder('document')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<MusicalNoteIcon className="text-yellow-500" />} label="Audio" onClick={() => handleOpenBuilder('audio')} />
                  
                  <div className={`col-span-2 text-[10px] font-bold mt-3 mb-1 uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Interactive</div>
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<CheckCircleIcon className="text-[#25D366]" />} label="Reply Buttons" onClick={() => handleOpenBuilder('reply-buttons')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<ListBulletIcon className="text-[#25D366]" />} label="List Menu" onClick={() => handleOpenBuilder('list')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<ViewColumnsIcon className="text-[#25D366]" />} label="Carousel" onClick={() => handleOpenBuilder('carousel')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<LinkIcon className="text-[#25D366]" />} label="CTA Link" onClick={() => handleOpenBuilder('cta-url')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<ShoppingBagIcon className="text-[#25D366]" />} label="Products" onClick={() => handleOpenBuilder('product-carousel')} />
                  
                  <div className={`col-span-2 text-[10px] font-bold mt-3 mb-1 uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Utilities</div>
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<MapPinIcon className="text-red-500" />} label="Send Location" onClick={() => handleOpenBuilder('send-location')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<MapPinIcon className="text-red-400 border-dashed" />} label="Request Location" onClick={() => handleOpenBuilder('request-location')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<UserIcon className="text-teal-500" />} label="Send Contact" onClick={() => handleOpenBuilder('contact')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<DocumentIcon className="text-slate-500" />} label="Request Address" onClick={() => handleOpenBuilder('request-address')} />
                </div>
              )}

              <form onSubmit={handleSendText} className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAttachments(!showAttachments)}
                  className={`p-2.5 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  {showAttachments ? <XMarkIcon className="w-6 h-6" /> : <PaperClipIcon className="w-6 h-6" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className={`flex-1 border rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] transition-all shadow-sm ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />

                <button 
                  type="submit" 
                  disabled={!inputText.trim()}
                  className={`p-3 rounded-full transition-all duration-200 ${
                    !inputText.trim() 
                      ? (isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400') 
                      : 'bg-[#25D366] text-white hover:bg-[#20bd5a] hover:scale-[1.02] shadow-md shadow-green-200/50'
                  }`}
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
             <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
               <ChatBubbleLeftRightIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
             </div>
             <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Select a conversation</p>
             <p className="text-sm mt-2">Choose a chat from the sidebar to start messaging.</p>
          </div>
        )}
      </div>

      {/* MODAL MANAGER OVERLAY */}
      {activeBuilder && (
        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-lg font-bold capitalize tracking-tight">{activeBuilder.replace('-', ' ')} Builder</h3>
              <button onClick={() => setActiveBuilder(null)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1">
              {activeBuilder === 'reply-buttons' ? (
                <ReplyButtonsBuilder isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)} />
              ) : activeBuilder === 'media' || activeBuilder === 'document' || activeBuilder === 'audio' ? (
                <MediaBuilder isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)} />
              ) : activeBuilder === 'send-location' ? (
                <LocationBuilder isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)} />
              ) : activeBuilder === 'request-location' ? (
                <RequestLocationBuilder isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)} />
              ) : activeBuilder === 'contact' ? (
                <ContactBuilder isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)} />
              ) : activeBuilder === 'request-address' ? (
                <RequestAddressBuilder isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)} />
              ) : activeBuilder === 'list' ? (
                <InteractiveListBuilder isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)} />
              ) : activeBuilder === 'carousel' ? (
                <InteractiveCarouselBuilder isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)} />
              ) : activeBuilder === 'cta-url' ? (
                <CtaUrlBuilder isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)} />
              ): activeBuilder === 'product-carousel' ? (
                <ProductCarouselBuilder isDarkMode={isDarkMode} onSubmit={handleSendComplexMessage} onClose={() => setActiveBuilder(null)} />
              ) : (
                <DummyBuilder name={activeBuilder.replace('-', ' ')} onClose={() => setActiveBuilder(null)} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- HELPER COMPONENTS ---

const ActionMenuButton = ({ icon, label, onClick, isDarkMode }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all hover:scale-[1.02] ${
      isDarkMode 
        ? 'text-slate-300 hover:bg-slate-700' 
        : 'text-slate-700 hover:bg-slate-50'
    }`}
  >
    <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-white dark:bg-slate-900 rounded shadow-sm border border-slate-100 dark:border-slate-800">{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);

export default LiveChat;