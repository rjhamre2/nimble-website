import { useState, useEffect, useRef } from 'react';

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

	// // Persist chat history in localStorage
	// useEffect(() => {
	// 	const saved = localStorage.getItem('nimble-chat-history');
	// 	if (saved) {
	// 		try {
	// 			setChatHistory(JSON.parse(saved));
	// 		} catch {}
	// 	}
	// }, []);
	// useEffect(() => {
	// 	localStorage.setItem('nimble-chat-history', JSON.stringify(chatHistory));
	// }, [chatHistory]);

	useEffect(() => {
		fetch('https://re40cbsv70.execute-api.ap-south-1.amazonaws.com/sendMessage', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				question: 'tet',
			}),
		});
	}, []);

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
	}, [isChatOpen]);

	// Drag handlers (desktop only)
	const handleDragStart = (e) => {
		if (window.innerWidth < 640) return; // Don't drag on mobile
		setIsDragging(true);
		const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
		const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
		dragOffset.current = {
			x: clientX - chatPosition.x,
			y: clientY - chatPosition.y,
		};
		document.body.style.userSelect = 'none';
	};
	const handleDrag = (e) => {
		if (!isDragging) return;
		const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
		const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
		setChatPosition({
			x: clientX - dragOffset.current.x,
			y: clientY - dragOffset.current.y,
		});
	};
	const handleDragEnd = () => {
		setIsDragging(false);
		document.body.style.userSelect = '';
	};
	useEffect(() => {
		if (!isDragging) return;
		window.addEventListener('mousemove', handleDrag);
		window.addEventListener('mouseup', handleDragEnd);
		window.addEventListener('touchmove', handleDrag);
		window.addEventListener('touchend', handleDragEnd);
		return () => {
			window.removeEventListener('mousemove', handleDrag);
			window.removeEventListener('mouseup', handleDragEnd);
			window.removeEventListener('touchmove', handleDrag);
			window.removeEventListener('touchend', handleDragEnd);
		};
	}, [isDragging]);

	const handleChatSend = async (e) => {
		e.preventDefault();
		if (!chatInput.trim()) return;
		const userMessage = chatInput.trim();
		setChatHistory((prev) => [...prev, { sender: 'user', text: userMessage, ts: Date.now() }]);
		setChatInput('');
		setShowTyping(true);
		setIsChatLoading(true);
		try {
			// Demo: send user message as 'userMessage' to the API
			const response = await fetch('https://re40cbsv70.execute-api.ap-south-1.amazonaws.com/sendMessage', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					question: userMessage,
				}),
			});
			if (response.ok) {
				const data = await response.json();
				setChatHistory((prev) => [...prev, { sender: 'bot', text: data.answer.metadata.answer || 'Message received!', ts: Date.now() }]);
			} else {
				setChatHistory((prev) => [...prev, { sender: 'bot', text: 'Sorry, there was an error.', ts: Date.now() }]);
			}
			setShowTyping(false);
			setIsChatLoading(false);
		} catch {
			setChatHistory((prev) => [...prev, { sender: 'bot', text: 'Sorry, there was an error.', ts: Date.now() }]);
			setShowTyping(false);
			setIsChatLoading(false);
		}
	};

	const handleInputKeyDown = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleChatSend(e);
		}
	};

	// Quick replies (example)
	const quickReplies = ['What can you do?', 'How do I get started?', 'Can I talk to a human?'];

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
		setChatPosition,
		isDragging,
		setIsDragging,
		handleDragStart,
		handleChatSend,
		handleInputKeyDown,
		quickReplies,
	};
}
