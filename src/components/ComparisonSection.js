import React, { useState, useEffect, useRef, useCallback } from 'react';

const messages = [
	{ type: 'ai', text: 'Hello! How can I assist you today?' },
	{ type: 'customer', text: 'How do I create a Return Request?' },
	{
		type: 'ai',
		text: 'You can create a Return in three simple steps: 1) Tap on MyOrders 2) Choose the item to be Returned 3) Enter details requested and create a return request',
	},
	{ type: 'customer', text: 'Where should I self-ship the Returns?' },
	{
		type: 'ai',
		text: 'You can send the return to any one of the following returns processing facilities listed below. Please ensure that you specify the name of the seller you purchased the products from (You can find the seller name on your order invoice) and dispatch the package to the address listed below. Kindly do not send it to any other address as the return package would not be treated as accepted."',
	},
	{ type: 'customer', text: 'I have created a Return request. When will I get the refund' },
	{
		type: 'ai',
		text: "Refund will be initiated upon successful pickup as per the Returns Policy. The refund amount is expected to reflect in the customer account within the following timelines: NEFT - 1 to 3 business days post refund initiation, Cyntra Credit - Instant, Online Refund – 7 to 10 days post refund initiation, depending on your bank partner, 'PhonePe wallet' – Instant",
	},
];

export default function ComparisonSection({ isDarkMode }) {
	const [visibleMessages, setVisibleMessages] = useState([]);
	const [typingIndex, setTypingIndex] = useState(-1);
	const hasBeenVisibleRef = useRef(false);
	const chatContainerRef = useRef(null);

	const useIntersectionObserver = ({ threshold = 0.1 } = {}) => {
		const [entry, setEntry] = useState(null);
		const observer = useRef(null);

		const ref = useCallback(
			(node) => {
				if (observer.current) observer.current.disconnect();
				observer.current = new IntersectionObserver(([entry]) => setEntry(entry), {
					threshold,
				});
				if (node) observer.current.observe(node);
			},
			[threshold]
		);

		return [ref, entry?.isIntersecting || false];
	};

	const [intersectionRef, comparisonVisible] = useIntersectionObserver();

	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
		}
	}, [visibleMessages, typingIndex]);

	const startChatAnimation = () => {
		let index = 0;
		let isCancelled = false;

		const showNextMessage = () => {
			if (isCancelled || index >= messages.length) return;
			const msg = messages[index];

			if (msg.type === 'ai') {
				setTypingIndex(index);
				setTimeout(() => {
					if (isCancelled) return;
					setVisibleMessages((prev) => [...prev, msg]);
					setTypingIndex(-1);
					index++;
					setTimeout(showNextMessage, 700);
				}, 700);
			} else {
				setTimeout(() => {
					if (isCancelled) return;
					setVisibleMessages((prev) => [...prev, msg]);
					index++;
					setTimeout(showNextMessage, 700);
				}, 500);
			}
		};

		const initTimeout = setTimeout(showNextMessage, 300);

		return () => {
			isCancelled = true;
			clearTimeout(initTimeout);
		};
	};

	useEffect(() => {
		let timeout;
		if (comparisonVisible && !hasBeenVisibleRef.current) {
			hasBeenVisibleRef.current = true;
			timeout = setTimeout(() => {
				setVisibleMessages([]);
				setTypingIndex(-1);
				startChatAnimation();
			}, 1000);
		} else if (!comparisonVisible && hasBeenVisibleRef.current) {
			hasBeenVisibleRef.current = false;
		}
		return () => clearTimeout(timeout);
	}, [comparisonVisible]);

	return (
		<section
			ref={intersectionRef}
			className={`py-12 sm:py-20 transition-opacity duration-1000 ${comparisonVisible ? 'opacity-100' : 'opacity-0'} ${
				isDarkMode ? 'bg-gray-900' : 'bg-white'
			}`}
		>
			<div className='w-[450px] container mx-auto px-4 text-center'>
				<div className='flex flex-col lg:flex-row justify-center items-stretch gap-6 sm:gap-8'>
					<div
						className={`w-full rounded-xl shadow-lg p-4 sm:p-6 flex flex-col animate-fadeIn max-w-md mx-auto ${
							isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
						}`}
					>
						<h3
							className={`text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-center flex items-center justify-center gap-1.5 sm:gap-2 ${
								isDarkMode ? 'text-gray-100' : 'text-gray-900'
							}`}
						>
							<span className={`text-2xl sm:text-3xl ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>◎</span> Nimble AI Chat
						</h3>

						<div
							ref={chatContainerRef}
							className='space-y-3 h-[400px] w-full overflow-y-auto pr-1 scrollbar-none'
							style={{ scrollbarWidth: 'none' }}
						>
							{visibleMessages.map((msg, idx) =>
								msg.type === 'ai' ? (
									<AIMessage key={idx} text={msg.text} isDarkMode={isDarkMode} index={idx} />
								) : (
									<CustomerMessage key={idx} text={msg.text} isDarkMode={isDarkMode} index={idx} />
								)
							)}
							{typingIndex !== -1 && <TypingIndicator isDarkMode={isDarkMode} />}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

const CustomerMessage = ({ text, isDarkMode, index }) => {
	const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	return (
		<div className='flex justify-end animate-slideInDown' style={{ animationDelay: `${index * 0.3}s`, animationFillMode: 'both' }}>
			<div className={`p-2 sm:p-3 rounded-lg max-w-[80%]  shadow-sm ${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-900 text-white'}`}>
				<p className='text-xs sm:text-sm text-left w-full'>{text}</p>
				<div className='w-full text-[10px] text-gray-400 mb-1 self-end text-right'>[{timestamp}]</div>
			</div>
		</div>
	);
};

const AIMessage = ({ text, link, isDarkMode, index }) => {
	const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	return (
		<div className='flex justify-start animate-slideInDown' style={{ animationDelay: `${index * 0.3}s`, animationFillMode: 'both' }}>
			<div
				className={`p-2 sm:p-3 rounded-lg max-w-[80%] text-left shadow-sm border ${
					isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-200'
				}`}
			>
				<p className='text-xs sm:text-sm'>
					{text}
					{link && (
						<a href={link} className='text-blue-600 hover:underline ml-1 text-xs sm:text-sm' target='_blank' rel='noopener noreferrer'>
							refer to this article.
						</a>
					)}
				</p>
				<span className=' text-[10px] text-gray-400'>[{timestamp}]</span>
			</div>
		</div>
	);
};

const TypingIndicator = ({ isDarkMode }) => (
	<div className='flex justify-start animate-fadeIn'>
		<div
			className={`p-2 sm:p-3 rounded-lg max-w-[80%] shadow-sm border text-left ${
				isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-200'
			}`}
		>
			<div className='flex items-center space-x-1'>
				<span className='w-1.5 h-1.5 bg-current rounded-full animate-bounce' />
				<span className='w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-100' />
				<span className='w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-200' />
			</div>
		</div>
	</div>
);
