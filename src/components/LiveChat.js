import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import websocketService from '../services/websocketService';
import { fetchRecentChats, chatService, formatRelativeTime } from '../services/chatService';
import { ReplyButtonsBuilder, MediaBuilder, LocationBuilder, RequestLocationBuilder, ContactBuilder, RequestAddressBuilder, DummyBuilder } from './LiveChatModals';

import { 
  MagnifyingGlassIcon, 
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

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  useEffect(() => scrollToBottom(), [activeMessages]);

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
    scrollToBottom();

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
        // Placeholder for direct API call
        console.log("Requesting Location from:", selectedSenderNumber);
        // await chatService.sendLocationRequest(selectedSenderNumber, "Please share your location to proceed.");
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
    if (type === 'send-contact') displayMessage = `Contact: ${payload.name.formatted_name}`; // <--- ADD THIS
    if (type === 'request-address') displayMessage = payload.body; // <--- ADD THIS

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
        // 👇 This is the API call that needs to fire! 👇
        await chatService.sendLocationRequest(selectedSenderNumber, payload.body);
      }
      else if (type === 'send-contact') {
        // <--- ADD THIS BLOCK --->
        await chatService.sendContact(selectedSenderNumber, payload);
      }
      else if (type === 'request-address') {
        // <--- ADD THIS BLOCK --->
        await chatService.sendAddressRequest(selectedSenderNumber, payload);
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
    
    // 1. If Outbound (Agent sent it), grab ID from our saved request
    if (msg.direction === 'outbound' && msg.metadata.request?.id) {
      mediaId = msg.metadata.request.id;
    } 
    // 2. If Inbound (Customer sent it), grab ID from Meta's webhook payload
    else if (msg.direction === 'inbound') {
      if (msg.message_type === 'image') mediaId = msg.metadata.image?.id;
      if (msg.message_type === 'video') mediaId = msg.metadata.video?.id;
    }

    // Point this to your WA_Server that will serve the media
    const WA_SERVER_URL = 'https://api.nimbleai.in/api/wa-server'; 
    
    return mediaId ? `${WA_SERVER_URL}/media/download/${mediaId}` : null;
  };
  // 👆 END OF HELPER 👆
  const selectedName = conversations.find(c => c.sender_number === selectedSenderNumber)?.sender_name || selectedSenderNumber;

  return (
    <div className={`h-[calc(100vh-64px)] flex relative ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      
      {/* SIDEBAR */}
      <div className={`w-1/4 min-w-[300px] border-r flex flex-col z-10 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Messages</h2>
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
              }`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
             <div className="p-4 text-center text-gray-500">Loading chats...</div>
          ) : conversations.map((chat) => (
            <div
              key={chat.sender_number}
              onClick={() => setSelectedSenderNumber(chat.sender_number)}
              className={`p-4 border-b cursor-pointer transition-colors hover:bg-opacity-50 ${
                isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
              } ${selectedSenderNumber === chat.sender_number ? (isDarkMode ? 'bg-gray-700' : 'bg-blue-50') : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className={`font-semibold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {chat.sender_name}
                </h3>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {formatRelativeTime(chat.time_stamp)}
                </span>
              </div>
              <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {chat.last_message}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-white/50 relative z-0">
        {selectedSenderNumber ? (
          <>
            <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div>
                <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedName}</h3>
                <p className="text-sm text-gray-500">{selectedSenderNumber}</p>
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
{activeMessages.map((msg, idx) => {
                 // Using the new 'direction' schema we built!
                 const isOutbound = msg.direction === 'outbound' || msg.sender === 'agent';

                 return (
                   <div key={idx} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[70%] p-3 rounded-lg text-sm shadow-sm ${
                       isOutbound 
                         ? 'bg-blue-600 text-white rounded-br-none' 
                         : (isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-800') + ' rounded-bl-none'
                     }`}>
                       
                      {/* --- RICH MEDIA RENDERER --- */}
                       {msg.message_type === 'image' || msg.message_type === 'video' ? (
                         <div className="flex flex-col gap-2">
                           
                           {/* 1. Show local preview instantly while sending */}
                           {msg.localPreview ? (
                             msg.message_type === 'image' 
                               ? <img src={msg.localPreview} alt="uploading" className="rounded-md max-h-64 object-cover" />
                               : <video src={msg.localPreview} className="rounded-md max-h-64" controls />
                           ) : 
                           /* 2. Show permanent image from Database */
                           getMediaUrl(msg) ? (
                             msg.message_type === 'image' 
                               ? <img src={getMediaUrl(msg)} alt="attachment" className="rounded-md max-h-64 object-cover" />
                               : <video src={getMediaUrl(msg)} className="rounded-md max-h-64" controls />
                           ) : (
                             /* 3. Fallback if URL extraction fails */
                             <div className="flex items-center gap-2 p-2 bg-black/20 rounded-md">
                               <PhotoIcon className="w-5 h-5" /> 
                               <span className="italic font-medium">
                                 {msg.message_type === 'image' ? 'Image' : 'Video'} Attachment
                               </span>
                             </div>
                           )}
                           
                           {/* Show the caption if they typed one */}
                           {msg.content && !msg.content.startsWith('[') && (
                             <p className="mt-1">{msg.content}</p>
                           )}
                         </div>
                         
                       ) : msg.message_type === 'document' || msg.message_type === 'audio' ? (
                         <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-2 bg-black/20 p-2 rounded-md">
                             {msg.message_type === 'audio' ? <MusicalNoteIcon className="w-5 h-5" /> : <DocumentIcon className="w-5 h-5" />}
                             <span className="italic font-medium capitalize">{msg.message_type} Attachment</span>
                           </div>
                           {msg.content && !msg.content.startsWith('[') && <p>{msg.content}</p>}
                         </div>
                       
                       ) : msg.message_type === 'send-location' || msg.message_type === 'location' ? (
                         <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-2 bg-red-500/10 p-2 rounded-md border border-red-500/20">
                             <div className="p-2 bg-red-500 rounded-full text-white">
                               <MapPinIcon className="w-5 h-5" />
                             </div>
                             <div>
                               <p className="font-bold text-sm">
                                 {/* Handle both temporary payload object and DB saved string */}
                                 {msg.content?.name || msg.message || 'Pinned Location'}
                               </p>
                               {msg.content?.address && (
                                 <p className="text-xs opacity-75">{msg.content.address}</p>
                               )}
                             </div>
                           </div>
                           <a 
                             href={`https://maps.google.com/?q=${msg.content?.latitude || ''},${msg.content?.longitude || ''}`} 
                             target="_blank" 
                             rel="noreferrer"
                             className="text-xs text-blue-500 hover:underline mt-1"
                           >
                             View on Map
                           </a>
                         </div>
                       ) : msg.message_type === 'interactive' || msg.message_type === 'reply-buttons' ? (
                          <div className="flex flex-col gap-1">
                             <span className="text-xs uppercase opacity-75 font-bold mb-1 flex items-center gap-1">
                               <CheckCircleIcon className="w-3 h-3"/> Interactive Message
                             </span>
                             <p>{msg.message || msg.content}</p>
                          </div>
                       ) : msg.message_type === 'request-location' ? (
                          <div className="flex flex-col gap-1">
                             <span className="text-xs uppercase opacity-75 font-bold mb-1 flex items-center gap-1">
                               <MapPinIcon className="w-3 h-3"/> Location Request
                             </span>
                             <p>{msg.message || msg.content}</p>
                          </div>
                       ) : msg.message_type === 'send-contact' || msg.message_type === 'contacts' ? (
                          <div className="flex flex-col min-w-[200px] max-w-[280px]">
                            {(() => {
                              // Safely extract the contacts array from DB or Optimistic UI
                              const rawContacts = msg.metadata?.request?.contacts || 
                                                  msg.metadata?.contacts || 
                                                  (Array.isArray(msg.content) ? msg.content : [msg.content]);
                              
                              const contactsList = Array.isArray(rawContacts) ? rawContacts.filter(Boolean) : [];
                              const count = contactsList.length;

                              // Fallback if data is missing
                              if (count === 0) {
                                return ( 
                                  <div className="bg-black/5 dark:bg-white/10 p-3 rounded-md text-sm">
                                    <UserIcon className="w-5 h-5 inline mr-2 text-teal-500" />
                                    {msg.message || 'Contact Card'}
                                  </div>
                                );
                              }

                              return (
                                <div className="bg-black/5 dark:bg-white/10 rounded-md overflow-hidden">
                                  {/* Draw up to 3 contacts in the bubble to save space */}
                                  {contactsList.slice(0, 3).map((c, i) => (
                                    <div key={i} className={`flex items-center gap-3 p-3 ${i > 0 ? 'border-t border-black/10 dark:border-white/10' : ''}`}>
                                      <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white shrink-0">
                                        <UserIcon className="w-6 h-6" />
                                      </div>
                                      <div className="flex flex-col overflow-hidden">
                                        <span className="font-bold text-sm truncate">{c.name?.formatted_name || 'Unknown Contact'}</span>
                                        {c.phones?.[0]?.phone && <span className="text-xs opacity-75 truncate">{c.phones[0].phone}</span>}
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {/* If there are more than 3, show a summary footer */}
                                  {count > 3 && (
                                    <div className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-2 border-t border-black/10 dark:border-white/10">
                                      + {count - 3} more contacts
                                    </div>
                                  )}
                                  
                                  {/* Standard bottom action */}
                                  <div className="text-center text-xs font-bold text-teal-600 dark:text-teal-400 py-2 border-t border-black/10 dark:border-white/10 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    View Contact{count > 1 ? 's' : ''}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                       ) : msg.message_type === 'request-address' || msg.message_type === 'address_message' ? (
                          <div className="flex flex-col gap-1">
                             <span className="text-xs uppercase opacity-75 font-bold mb-1 flex items-center gap-1">
                               <DocumentIcon className="w-3 h-3"/> Address Request
                             </span>
                             <p>{msg.message || msg.content?.body}</p>
                             <div className="mt-2 text-xs opacity-75 italic border-t border-black/10 dark:border-white/10 pt-1">
                               Requested for Country: {msg.content?.country || msg.metadata?.country || 'IN'}
                             </div>
                          </div>   
                       ) : (
                         // Fallback for regular text messages
                         <p>{msg.message || msg.content}</p>
                       )}
                       {/* --------------------------- */}

                       <div className={`text-[10px] mt-1 text-right flex justify-end items-center gap-1 ${isOutbound ? 'text-blue-100' : 'text-gray-400'}`}>
                         <span>{formatRelativeTime(msg.time_stamp || msg.created_at)}</span>
                         {msg.status === 'sending' && <span>⏳</span>}
                         {msg.status === 'sent' && <span>✓</span>}
                         {msg.status === 'delivered' && <span>✓✓</span>}
                         {msg.status === 'read' && <span className="text-blue-300 font-bold">✓✓</span>}
                         {msg.status === 'failed' && <span className="text-red-300">❌</span>}
                       </div>
                     </div>
                   </div>
                 );
               })}
               <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <div className={`p-4 border-t relative ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              
              {/* UNIVERSAL ACTION MENU */}
              {showAttachments && (
                <div className={`absolute bottom-20 left-6 shadow-2xl border rounded-xl p-4 z-50 w-80 grid grid-cols-2 gap-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  
                  <div className={`col-span-2 text-[10px] font-bold mb-1 uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Media & Docs</div>
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<PhotoIcon className="text-blue-500" />} label="Image/Video" onClick={() => handleOpenBuilder('media')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<DocumentIcon className="text-purple-500" />} label="Document" onClick={() => handleOpenBuilder('document')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<MusicalNoteIcon className="text-yellow-500" />} label="Audio" onClick={() => handleOpenBuilder('audio')} />
                  
                  <div className={`col-span-2 text-[10px] font-bold mt-2 mb-1 uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Interactive</div>
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<CheckCircleIcon className="text-green-500" />} label="Reply Buttons" onClick={() => handleOpenBuilder('reply-buttons')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<ListBulletIcon className="text-indigo-500" />} label="List Menu" onClick={() => handleOpenBuilder('list')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<ViewColumnsIcon className="text-pink-500" />} label="Carousel" onClick={() => handleOpenBuilder('carousel')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<LinkIcon className="text-cyan-500" />} label="CTA Link" onClick={() => handleOpenBuilder('cta-url')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<ShoppingBagIcon className="text-orange-500" />} label="Products" onClick={() => handleOpenBuilder('product-carousel')} />
                  
                  <div className={`col-span-2 text-[10px] font-bold mt-2 mb-1 uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Utilities</div>
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<MapPinIcon className="text-red-500" />} label="Send Location" onClick={() => handleOpenBuilder('send-location')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<MapPinIcon className="text-red-400 border-dashed" />} label="Request Location" onClick={() => handleOpenBuilder('request-location')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<UserIcon className="text-teal-500" />} label="Send Contact" onClick={() => handleOpenBuilder('contact')} />
                  <ActionMenuButton isDarkMode={isDarkMode} icon={<DocumentIcon className="text-gray-500" />} label="Request Address" onClick={() => handleOpenBuilder('request-address')} />
                </div>
              )}

              <form onSubmit={handleSendText} className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAttachments(!showAttachments)}
                  className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {showAttachments ? <XMarkIcon className="w-6 h-6" /> : <PaperClipIcon className="w-6 h-6" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className={`flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />

                <button 
                  type="submit" 
                  disabled={!inputText.trim()}
                  className={`p-2 rounded-full ${
                    !inputText.trim() 
                      ? (isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400') 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
             <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
               <span className="text-2xl">💬</span>
             </div>
             <p className="text-lg">Select a conversation</p>
          </div>
        )}
      </div>

{/* MODAL MANAGER OVERLAY */}
      {activeBuilder && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh] ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold capitalize">{activeBuilder.replace('-', ' ')} Builder</h3>
              <button onClick={() => setActiveBuilder(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 overflow-y-auto flex-1">
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
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
      isDarkMode 
        ? 'text-gray-200 hover:bg-gray-700' 
        : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    <span className="w-5 h-5 flex-shrink-0">{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);


export default LiveChat;