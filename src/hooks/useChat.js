import { useState, useEffect, useRef } from 'react';
import websocketService from '../services/websocketService';

export function useChat() {
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [isChatMinimized, setIsChatMinimized] = useState(false);
	const [chatInput, setChatInput] = useState('');
	const [chatHistory, setChatHistory] = useState([]); // { sender: 'user'|'bot', text: string, ts: number }
	const [isChatLoading, setIsChatLoading] = useState(false);
	const [showTyping, setShowTyping] = useState(false);
	const chatInputRef = useRef(null);
	const chatWindowRef = useRef(null);
	const dragOffset = useRef({ x: 0, y: 0 });
	const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);

	// Auto-focus input when chat opens
	useEffect(() => {
		if (isChatOpen && !isChatMinimized && chatInputRef.current) {
			chatInputRef.current.focus();
		}
	}, [isChatOpen, isChatMinimized]);

	// Welcome message
	useEffect(() => {
		if (isChatOpen && chatHistory.length === 0) {
			setTimeout(() => {
				setChatHistory([{ sender: 'bot', text: 'Hi! I am Nimble AI Assistant. How can I help you today?', ts: Date.now() }]);
			}, 300);
		}
	}, [isChatOpen, chatHistory.length]);

	// Drag handlers (desktop only)
	const handleDragStart = (e) => {
		if (e.type === 'mousedown') {
			e.preventDefault();
			const rect = e.currentTarget.getBoundingClientRect();
			dragOffset.current = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};
			setIsDragging(true);
			
			const handleMouseMove = (e) => {
				if (isDragging) {
					const newX = e.clientX - dragOffset.current.x;
					const newY = e.clientY - dragOffset.current.y;
					setChatPosition({ x: newX, y: newY });
				}
			};
			
			const handleMouseUp = () => {
				setIsDragging(false);
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
			
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		}
	};

	const handleChatSend = async (e) => {
		e.preventDefault();
		if (!chatInput.trim() || isChatLoading) return;

		const message = chatInput.trim();
		setChatInput('');
		setIsChatLoading(true);
		setShowTyping(true);

		// Add user message to chat history immediately for UI responsiveness
		const userMessage = {
			sender: 'user',
			text: message,
			ts: Date.now()
		};
		setChatHistory(prev => [...prev, userMessage]);

		try {
			// Send message to database via WebSocket
			const success = websocketService.sendMessageToDatabase(
				message,
				'User',
				'' // senderNumber - can be updated if needed
			);

			if (!success) {
				throw new Error('WebSocket not connected');
			}

			// The message will be stored in database and broadcast back via WebSocket
			// We don't need to manually add it here as it will come back from the database
		} catch (error) {
			console.error('Error sending message:', error);
			// Add error message to chat
			setChatHistory(prev => [...prev, {
				sender: 'bot',
				text: 'Sorry, I encountered an error. Please try again.',
				ts: Date.now()
			}]);
			setShowTyping(false);
		} finally {
			setIsChatLoading(false);
		}
	};

	const handleInputKeyDown = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleChatSend(e);
		}
	};

	// Quick reply suggestions
	const quickReplies = [
		"How does it work?",
		"What are the features?",
		"Tell me about pricing",
		"Contact support"
	];

	return {
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
	};
}
