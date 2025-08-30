import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import websocketService from '../services/websocketService';
import { useAuth } from '../hooks/useAuth';

const ChatWidget = ({ isDarkMode }) => {
	const {
		isChatOpen,
		setIsChatOpen,
		isChatMinimized,
		setIsChatMinimized,
		chatInput,
		setChatInput,
		chatHistory,
		setChatHistory,
		isChatLoading,
		setIsChatLoading,
		showTyping,
		setShowTyping,
		chatInputRef,
		chatWindowRef,
		chatPosition,
		isDragging,
		handleDragStart,
		handleChatSend,
		handleInputKeyDown,
		quickReplies,
	} = useChat();

	const { user } = useAuth();
	const [wsConnected, setWsConnected] = useState(false);

	// WebSocket connection and message handling
	useEffect(() => {
		if (!user?.uid) return;

		// Connect to WebSocket
		websocketService.connect(user.uid);

		// Handle connection status
		const connectionHandler = (status) => {
			setWsConnected(status === 'connected');
		};
		const connectionId = websocketService.onConnection(connectionHandler);

		// Handle database messages
		const handleDatabaseMessages = (data) => {
			if (data.messages && data.messages.length > 0) {
				const history = data.messages.map(msg => ({
					sender: msg.sender_name === 'AI Assistant' ? 'bot' : 'user',
					text: msg.message,
					ts: new Date(msg.created_at || msg.time_stamp * 1000).getTime()
				}));
				setChatHistory(history);
			}
		};

		// Handle new message stored in database
		const handleNewMessage = (data) => {
			if (data.message) {
				const newMessage = {
					sender: data.sender_name === 'AI Assistant' ? 'bot' : 'user',
					text: data.message,
					ts: new Date(data.created_at || data.time_stamp * 1000).getTime()
				};
				setChatHistory(prev => [...prev, newMessage]);
			}
		};

		const handleConnectionStatus = (data) => {
			console.log('WebSocket connection status:', data);
		};

		// Register message handlers
		websocketService.onMessage('database_messages', handleDatabaseMessages);
		websocketService.onMessage('new_message', handleNewMessage);
		websocketService.onMessage('connection_status', handleConnectionStatus);

		// Cleanup on unmount
		return () => {
			websocketService.offConnection(connectionId);
			websocketService.offMessage('database_messages', handleDatabaseMessages);
			websocketService.offMessage('new_message', handleNewMessage);
			websocketService.offMessage('connection_status', handleConnectionStatus);
		};
	}, [user?.uid]);

	// Animation for big icon to corner
	const [showIntroAnim, setShowIntroAnim] = useState(true);
	const [iconAnimDone, setIconAnimDone] = useState(false);
	const [iconStyle, setIconStyle] = useState({});
	const [blurOpacity, setBlurOpacity] = useState(1);
	const iconRef = useRef(null);
	const [showFloatingButton, setShowFloatingButton] = useState(false);

	useEffect(() => {
		// Wait for mount, then trigger animation
		const timer = setTimeout(() => {
			if (iconRef.current) {
				// Center of screen
				const iconRect = iconRef.current.getBoundingClientRect();
				const iconCenterX = iconRect.left + iconRect.width / 2;
				const iconCenterY = iconRect.top + iconRect.height / 2;
				// Target: bottom right (floating button)
				const targetX = window.innerWidth - 40 - iconRect.width / 2; // 40px = 1.25rem*4 (right-5)
				const targetY = window.innerHeight - 40 - iconRect.height / 2; // 40px = 1.25rem*4 (bottom-5)
				const translateX = targetX - iconCenterX;
				const translateY = targetY - iconCenterY;
				setIconStyle({
					transform: `translate(${translateX}px, ${translateY}px) scale(0.18)`,
					transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease-in',
					opacity: 0,
				});
				setBlurOpacity(0);
				setTimeout(() => {
					setIconAnimDone(true);
					setTimeout(() => {
						setShowIntroAnim(false);
						setTimeout(() => setShowFloatingButton(true), 100);
					}, 400);
				}, 800);
			}
		}, 900);
		return () => clearTimeout(timer);
	}, []);

	// Always scroll to bottom on new message or when chat opens
	useEffect(() => {
		if (chatWindowRef.current) {
			chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
		}
	}, [chatHistory, isChatOpen]);

	// WebSocket connection indicator
	const ConnectionIndicator = () => (
		<div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} 
			 title={wsConnected ? 'Connected' : 'Disconnected'} />
	);

	return (
		<>
			{/* Intro animation */}
			{showIntroAnim && (
				<div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
					<div
						ref={iconRef}
						style={iconStyle}
						className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} shadow-2xl`}
					>
						<span className={`text-4xl ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>◎</span>
					</div>
					<div
						className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500"
						style={{ opacity: blurOpacity }}
					></div>
				</div>
			)}

			{/* Floating button */}
			{showFloatingButton && (
				<button
					onClick={() => setIsChatOpen(true)}
					className={`fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
						isDarkMode ? 'bg-gray-800 text-gray-100 hover:bg-gray-700' : 'bg-white text-gray-900 hover:bg-gray-50'
					} border-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
					aria-label="Open chat"
				>
					<span className="text-2xl">◎</span>
				</button>
			)}

			{/* Chat window */}
			{isChatOpen && (
				<div
					className={`fixed bottom-5 right-5 z-50 w-80 h-96 rounded-xl shadow-2xl border-2 ${
						isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
					} flex flex-col`}
					style={{
						transform: `translate(${chatPosition.x}px, ${chatPosition.y}px)`,
						cursor: isDragging ? 'grabbing' : 'default',
					}}
				>
					{/* Header */}
					<div
						className={`flex items-center justify-between p-3 rounded-t-xl cursor-grab ${
							isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
						} ${isDragging ? 'cursor-grabbing' : ''}`}
						onMouseDown={handleDragStart}
					>
						<div className="flex items-center space-x-2">
							<span className={`text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>◎</span>
							<span className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Nimble AI</span>
						</div>
						<div className="flex items-center space-x-1">
							<ConnectionIndicator />
							<button
								onClick={() => setIsChatMinimized(!isChatMinimized)}
								className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
								aria-label={isChatMinimized ? 'Expand chat' : 'Minimize chat'}
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							<button
								onClick={() => setIsChatOpen(false)}
								className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
								aria-label="Close chat"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>

					{/* Chat body */}
					{!isChatMinimized && (
						<>
							<div
								ref={chatWindowRef}
								className={`flex-1 overflow-y-auto px-3 py-2 space-y-2 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} chat-scrollbar`}
								tabIndex={0}
								aria-live='polite'
							>
								{chatHistory.length === 0 && (
									<div className={`text-xs text-center mt-8 animate-fadeIn ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
										Start the conversation...
									</div>
								)}
								{chatHistory.map((msg, idx) => (
									<div
										key={idx}
										className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-chatMsgSlideIn`}
										style={{ animationDelay: `${idx * 0.08}s`, animationFillMode: 'both' }}
									>
										<div
											className={`p-2 sm:p-3 rounded-lg max-w-[80%] shadow-sm border ${
												msg.sender === 'user'
													? isDarkMode
														? 'bg-indigo-700 text-gray-100 border-indigo-600'
														: 'bg-blue-600 text-white border-blue-600'
													: isDarkMode
													? 'bg-gray-700 text-gray-100 border-gray-600'
													: 'bg-white text-gray-800 border-gray-200'
											}`}
										>
											<p className='text-xs sm:text-sm text-left w-full'>{msg.text}</p>
											<div className='w-full text-[10px] text-gray-400 mb-1 self-end text-right'>
												[{new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]
											</div>
										</div>
									</div>
								))}
								{showTyping && (
									<div className="flex justify-start animate-chatMsgSlideIn">
										<div className={`p-2 sm:p-3 rounded-lg shadow-sm border ${
											isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-800 border-gray-200'
										}`}>
											<div className="flex space-x-1">
												<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
												<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
												<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
											</div>
										</div>
									</div>
								)}
								{quickReplies.length > 0 && (
									<div className="flex flex-wrap gap-2 mt-2">
										{quickReplies.map((qr, i) => (
											<button
												key={i}
												onClick={() => {
													setChatInput(qr);
													handleChatSend({ preventDefault: () => {} });
												}}
												className={`px-3 py-1 text-xs rounded-full border transition-colors ${
													isDarkMode
														? 'border-gray-600 text-gray-300 hover:bg-gray-700'
														: 'border-gray-300 text-gray-600 hover:bg-gray-100'
												}`}
											>
												{qr}
											</button>
										))}
									</div>
								)}
							</div>
							<form
								onSubmit={handleChatSend}
								className={`flex items-center gap-2 px-3 py-2 border-t ${
									isDarkMode ? 'border-gray-700 bg-gray-800' : 'bg-white border-gray-200'
								} rounded-b-xl`}
							>
								<input
									type='text'
									ref={chatInputRef}
									className={`flex-1 rounded-full px-3 py-2 text-sm border ${
										isDarkMode ? 'border-gray-700 bg-gray-700 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'
									} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-indigo-600' : 'focus:ring-blue-400'}`}
									placeholder='Type your message...'
									value={chatInput}
									onChange={(e) => setChatInput(e.target.value)}
									disabled={isChatLoading}
									onKeyDown={handleInputKeyDown}
									aria-label='Type your message'
								/>
								<button
									type='submit'
									disabled={isChatLoading || !chatInput.trim()}
									className={`rounded-full p-2 flex items-center gap-1 transition-colors ${
										isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
									} disabled:opacity-50 focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-indigo-600' : 'focus:ring-blue-400'}`}
									aria-label='Send message'
								>
									{/* Paper plane icon for send */}
									<svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
										<path d='M17 10L3 3l4 7-4 7 14-7z' />
									</svg>
									<span className='hidden sm:inline'>Send</span>
								</button>
							</form>
						</>
					)}
				</div>
			)}
		</>
	);
};

export default ChatWidget;
