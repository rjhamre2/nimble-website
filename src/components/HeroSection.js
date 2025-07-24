import React, { useState } from 'react';

const HeroSection = ({ isDarkMode }) => {
	const [email, setEmail] = useState('');
	const [status, setStatus] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [showInput, setShowInput] = useState(false);

	const handleContactUs = (e) => {
		e.preventDefault();
		if (!email) {
			setStatus('Please enter your email address.');
			return;
		}
		setIsLoading(true);
		const payload = { userEmail: email };
		fetch('https://a804judny2.execute-api.us-east-1.amazonaws.com/auto/sendEmail', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		})
			.then(async (response) => {
				if (response.ok) {
					setStatus('Message sent successfully!');
					setEmail('');
				} else {
					const errorData = await response.json();
					console.error('Failed to send email:', errorData);
					setStatus('Failed to send message. Please try again.');
				}
			})
			.catch((error) => {
				console.error('Error sending email:', error);
				setStatus('An error occurred. Please try again later.');
			})
			.finally(() => setIsLoading(false));
	};

	return (
		<section className={`py-10 md:py-14 overflow-hidden relative px-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-white to-gray-50'}`}>
			<div className='container mx-auto flex flex-col items-center justify-center text-center z-10'>
				<h1
					className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 sm:mb-6 ${
						isDarkMode ? 'text-gray-100' : 'text-gray-900'
					}`}
				>
					Instant Customer Resolutions <br className='hidden sm:inline' /> Through Intelligent Chat Service
				</h1>
				<p className={`text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
					Deliver real-time support with a human-like touch — our intelligent chat service understands, responds, and resolves just like your best
					agents.
				</p>
				<div className='flex items-center justify-center gap-4 mb-6'>
					<button
						onClick={() => document.getElementById('pricing-section').scrollIntoView({ behavior: 'smooth' })}
						className={`px-6 py-3 rounded-full font-semibold shadow-md transition-all duration-500 transform ${showInput ? '-translate-x-3' : ''} ${
							isDarkMode ? 'bg-green-400 text-gray-900 hover:bg-green-300' : 'bg-green-600 text-white hover:bg-green-700'
						}`}
					>
						Start for Free
					</button>
					<div
						className={`flex items-center justify-center rounded-full overflow-hidden transition-all duration-500 ${
							showInput ? 'w-[320px]' : 'w-[140px]'
						} h-[48px] shadow-md ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
					>
						<input
							type='email'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder='Your Email'
							className={`transition-all duration-500 ease-in-out text-sm py-2 outline-none border-none 
                ${showInput ? 'w-full px-4 opacity-100' : 'w-0 px-0 opacity-0'} 
                ${isDarkMode ? 'bg-gray-900 text-gray-100 placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-500'}`}
						/>
						<button
							onClick={(e) => {
								if (!showInput) {
									setShowInput(true);
								} else {
									handleContactUs(e);
								}
							}}
							type='button'
							className={`whitespace-nowrap h-full px-4 text-sm font-semibold transition-colors ${
								isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-800 hover:text-black'
							}`}
						>
							{isLoading ? 'Sending...' : 'Contact Us'}
						</button>
					</div>
				</div>
			</div>
		</section>
	);
};

export default HeroSection;
