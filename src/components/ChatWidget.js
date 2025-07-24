import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';

const ChatWidget = ({ isDarkMode }) => {
	const {
		isChatOpen,
		setIsChatOpen,
		isChatMinimized,
		setIsChatMinimized,
		chatInput,
		setChatInput,
		chatHistory,
		isChatLoading,
		showTyping,
		chatInputRef,
		chatWindowRef,
		chatPosition,
		isDragging,
		handleDragStart,
		handleChatSend,
		handleInputKeyDown,
		quickReplies,
	} = useChat();

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

	return (
		<>
			{/* Custom styles for smooth chat window and icon animation */}
			<style>{`
        @keyframes chatWindowSlideIn {
          from { opacity: 0; transform: translateY(40px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-chatWindowSlideIn {
          animation: chatWindowSlideIn 0.5s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes chatIconFadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-chatIconFadeIn {
          animation: chatIconFadeIn 0.5s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        @keyframes chatMsgSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-chatMsgSlideIn {
          animation: chatMsgSlideIn 0.4s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        /* Custom scrollbar for chat window */
        .chat-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .chat-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 4px;
        }
        .dark .chat-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
        }
        .chat-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
			{/* Big center chat icon animation */}
			{showIntroAnim && (
				<div className='fixed inset-0 z-[999] flex items-center justify-center'>
					{/* Blur overlay */}
					<div className='absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-700' style={{ opacity: blurOpacity }} />
					<span ref={iconRef} className='will-change-transform' style={iconAnimDone ? { ...iconStyle } : { transition: 'opacity 0.5s', opacity: 1 }}>
						<button
							className={`rounded-full shadow-2xl p-12 sm:p-16 bg-opacity-90 transition-colors duration-300 focus:outline-none
                ${isDarkMode ? 'bg-indigo-600' : 'bg-blue-600'}`}
							style={{ pointerEvents: 'none' }}
							aria-label='Chatbot Intro Icon'
						>
							<svg
								className={`w-32 h-32 sm:w-40 sm:h-40 ${isDarkMode ? 'text-gray-100' : 'text-white'}`}
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								viewBox='0 0 24 24'
								xmlns='http://www.w3.org/2000/svg'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6A8.38 8.38 0 0112.5 3c4.7 0 8.5 3.8 8.5 8.5z'
								/>
							</svg>
						</button>
					</span>
				</div>
			)}

			{/* Floating Chatbot Icon */}
			{!isChatOpen && showFloatingButton && (
				<button
					className={`fixed bottom-5 right-5 z-50 rounded-full shadow-lg p-4 transition-colors duration-300 focus:outline-none animate-chatIconFadeIn
            ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}
          `}
					aria-label='Open Chatbot'
					onClick={() => {
						setIsChatOpen(true);
						setIsChatMinimized(false);
					}}
				>
					<svg
						className={`w-7 h-7 ${isDarkMode ? 'text-gray-100' : 'text-white'}`}
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						viewBox='0 0 24 24'
						xmlns='http://www.w3.org/2000/svg'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							d='M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6A8.38 8.38 0 0112.5 3c4.7 0 8.5 3.8 8.5 8.5z'
						/>
					</svg>
				</button>
			)}

			{/* Floating Chat Window */}
			{isChatOpen && (
				<div
					className={`fixed bottom-5 right-5 z-50 w-[95vw] max-w-xs sm:max-w-sm md:max-w-md ${
						isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
					} rounded-xl shadow-2xl flex flex-col animate-chatWindowSlideIn ${isChatMinimized ? 'h-16' : 'h-[420px]'}`}
					style={{
						transform: `translate(${chatPosition.x}px, ${chatPosition.y}px)`,
						transition: isDragging ? 'none' : 'transform 0.2s',
					}}
					role='dialog'
					aria-modal='true'
					aria-label='Nimble AI Chat'
				>
					{/* Header with branding, drag, minimize, close */}
					<div
						className={`flex items-center justify-between px-4 py-2 border-b ${
							isDarkMode ? 'border-gray-700 bg-gray-800' : 'bg-white border-gray-200'
						} cursor-move select-none rounded-t-xl`}
						onMouseDown={handleDragStart}
						onTouchStart={handleDragStart}
					>
						<div className='flex items-center gap-2'>
							<div className='flex flex-row justify-center'>
							<span className={`text-2xl sm:text-3xl ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>◎</span>
								<span className={`flex ml-2 items-center font-semibold text-base align-center ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}> Nimble AI Assistant</span>
								{/* <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>How can I help you?</span> */}
							</div>
						</div>
						<div className='flex items-center gap-1'>
							{/* <button
                onClick={() => setIsChatMinimized((v) => !v)}
                className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                aria-label={isChatMinimized ? 'Expand chat' : 'Minimize chat'}
              >
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  {isChatMinimized ? (
                    // Horizontal line for minimize
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M20 12H4' />
                  ) : (
                    // Cross for expand/close
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                  )}
                </svg>
              </button> */}
							<button
								onClick={() => {
									setIsChatOpen(false);
									setIsChatMinimized(false);
								}}
								className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
								aria-label='Close chat'
							>
								<svg
									className={`w-5 h-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
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
								abIndex={0}
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
									<div className='flex justify-start animate-fadeIn'>
										<div
											className={`px-3 py-2 rounded-lg max-w-[80%] text-sm shadow-sm flex items-center gap-2 ${
												isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-white text-gray-900 border border-gray-200'
											}`}
										>
											<span className='w-2 h-2 bg-current rounded-full animate-bounce'></span>
											<span className='w-2 h-2 bg-current rounded-full animate-bounce delay-100'></span>
											<span className='w-2 h-2 bg-current rounded-full animate-bounce delay-200'></span>
											<span className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Typing...</span>
										</div>
									</div>
								)}
								{/* Quick replies */}
								{chatHistory.length < 2 && quickReplies && quickReplies.length > 0 && (
									<div className='flex flex-wrap gap-2 mt-2 animate-chatMsgSlideIn'>
										{quickReplies.map((qr, i) => (
											<button
												key={i}
												className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
													isDarkMode
														? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
														: 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
												}`}
												onClick={() => setChatInput(qr)}
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
