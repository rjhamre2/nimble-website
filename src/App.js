import React, { useState, useEffect, useRef } from 'react';

// Custom Hook for Intersection Observer to trigger animations on scroll
const useIntersectionObserver = (options) => {
	const [isVisible, setIsVisible] = useState(false);
	const targetRef = useRef(null); // The element to observe

	useEffect(() => {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					// Disconnect observer after the first intersection to play animation only once
					observer.disconnect();
				}
			});
		}, options);

		const currentTarget = targetRef.current;
		if (currentTarget) {
			observer.observe(currentTarget);
		}

		return () => {
			if (currentTarget) {
				observer.unobserve(currentTarget);
			}
		};
	}, [options]); // Re-run effect if options change

	return [targetRef, isVisible];
};

// Main App Component
function App() {
	// State for managing dark mode, initialized from localStorage
	const [isDarkMode, setIsDarkMode] = useState(() => {
		const savedMode = localStorage.getItem('theme');
		return savedMode === 'dark';
	});

	// Apply dark mode class to HTML body
	useEffect(() => {
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}, [isDarkMode]);

	// Function to toggle dark mode
	const toggleDarkMode = () => {
		setIsDarkMode((prevMode) => !prevMode);
	};

	return (
		// Conditional styling for the main container based on dark mode
		<div className={`min-h-screen font-sans ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
			{/* Define custom animations here for demonstration */}
			<style>
				{`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.8s ease-out forwards;
      }
      .animate-slideInUp {
        animation: slideInUp 0.8s ease-out forwards;
      }
      .animate-spin {
        animation: spin 1s linear infinite;
      }
      .animate-delay-100 { animation-delay: 0.1s; }
      .animate-delay-200 { animation-delay: 0.2s; }
      .animate-delay-300 { animation-delay: 0.3s; }
      .animate-delay-400 { animation-delay: 0.4s; }
      .animate-delay-500 { animation-delay: 0.5s; }
      .animate-delay-600 { animation-delay: 0.6s; }
      .animate-delay-700 { animation-delay: 0.7s; }
      .animate-delay-800 { animation-delay: 0.8s; }
      `}
			</style>

			{/* Navbar Component, passing toggle function and dark mode state */}
			<Navbar toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
			{/* Hero Section Component */}
			<HeroSection isDarkMode={isDarkMode} />
			{/* Features Section Component */}
			<FeaturesSection isDarkMode={isDarkMode} />
			{/* About Section Component */}
			<AboutSection isDarkMode={isDarkMode} />

			{/* Comparison Section Component */}
			<ComparisonSection isDarkMode={isDarkMode} />
			{/* <SeamlessIntegrations isDarkMode={isDarkMode} /> */}

			{/* FAQ Section Component */}
			<FAQSection isDarkMode={isDarkMode} />
			{/* Footer Component */}
			<Footer isDarkMode={isDarkMode} />
		</div>
	);
}

// Navbar Component - Updated for Black & White theme with centered logo and new name
function Navbar({ toggleDarkMode, isDarkMode }) {
	return (
		<nav className={`sticky top-0 z-50 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} animate-fadeIn`}>
			<div className='container mx-auto px-4 py-4 flex items-center'>
				{/* Empty div to push the center logo to the right and balance the button on the right */}
				<div className='flex-grow basis-1/3'></div>

				{/* Logo - Updated to Nimble AI and centered */}
				<a href='#' className='flex items-center space-x-2 flex-grow justify-center basis-1/3'>
					{/* Removed image import and replaced with text logo */}
					<img src={require('./logo.png')} alt='Nimble AI Logo' className={`h-12 w-auto object-contain ${isDarkMode ? 'logo-invert' : ''}`} />
				</a>
				{/* Dark Mode Toggle Button */}
				<div className='flex-grow flex justify-end basis-1/3'>
					<button
						onClick={toggleDarkMode}
						className={`p-2 rounded-full transition-colors duration-300 ${
							isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
						}`}
						aria-label='Toggle Dark Mode'
					>
						{isDarkMode ? (
							// Sun icon for light mode
							<svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth='2'
									d='M12 3v1m0 16v1m9-9h1M2 12h1m15.325-4.475l-.707-.707M6.382 17.618l-.707-.707M17.618 6.382l-.707-.707M6.382 6.382l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
								></path>
							</svg>
						) : (
							// Moon icon for dark mode
							<svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth='2'
									d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
								></path>
							</svg>
						)}
					</button>
				</div>
			</div>
		</nav>
	);
}

// Hero Section Component - Updated for Black & White theme with animations and centered content
function HeroSection({ isDarkMode }) {
	const [email, setEmail] = useState('');
	const [status, setStatus] = useState(''); // To display success/error messages
	const [isLoading, setIsLoading] = useState(false); // To show loading state

	const handleContactUs = async (e) => {
		e.preventDefault();
		if (!email) {
			setStatus('Please enter your email address.');
			return;
		}

		setIsLoading(true);
		// setStatus('Sending message...');

		const payload = {
			userEmail: email,
			// message field removed as per user request
		};

		try {
			const response = await fetch('https://a804judny2.execute-api.us-east-1.amazonaws.com/auto/sendEmail', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			if (response.ok) {
				setStatus('Message sent successfully!');
				setEmail('');
			} else {
				const errorData = await response.json();
				console.error('Failed to send email:', errorData);
				setStatus('Failed to send message. Please try again.');
			}
		} catch (error) {
			console.error('Error sending email:', error);
			setStatus('An error occurred. Please try again later.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<section className={`py-8 md:py-10 overflow-hidden relative px-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-white to-gray-50'}`}>
			<div className='container mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12'>
				{/* Content */}
				<div className='md:w-2/3 text-center z-10 animate-slideInUp'>
					<h1
						className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 sm:mb-6 ${
							isDarkMode ? 'text-gray-100' : 'text-gray-900'
						}`}
					>
						Empower Your Business <br className='hidden sm:inline' /> with Nimble AI
					</h1>
					<p className={`text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
						Nimble AI is here to revolutionize your business with our advanced AI-powered solutions. Contact us to explore the possibilities.
					</p>
					{/* Email Input with Integrated Button */}
					<form
						onSubmit={handleContactUs}
						className={`flex items-center justify-start md:w-[450px] mx-auto rounded-full overflow-hidden shadow-xl relative transition-all duration-300
    border focus-within:border
    ${isDarkMode ? 'bg-gray-900 border-transparent focus-within:border-gray-500' : 'bg-white border-transparent focus-within:border-gray-800'}
  `}
					>
						<input
							type='email'
							placeholder='Your Email'
							className={`w-full px-5 py-5  rounded-full border border-transparent focus:outline-none focus:ring-0 focus:border-transparent   ${
								isDarkMode ? 'bg-gray-700 text-gray-100  placeholder-gray-400' : 'bg-white text-gray-900  placeholder-gray-500'
							}`}
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
						<button
							type='submit'
							className={`w-40 absolute right-2 px-1 py-3 font-semibold text-base rounded-3xl shadow-md transition duration-300 flex items-center justify-center gap-2 ${
								isDarkMode
									? 'bg-gray-100 text-gray-900 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400'
									: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-700'
							}`}
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<svg className='animate-spin h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
										<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
										<path
											className='opacity-75'
											fill='currentColor'
											d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
										></path>
									</svg>
									Sending...
								</>
							) : (
								<>
									Contact Us
									<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M14 5l7 7m0 0l-7 7m7-7H3' />
									</svg>
								</>
							)}
						</button>
					</form>

					{status && (
						<div
							className={`md:w-[450px] mx-auto mt-4 px-4 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 animate-fadeIn ${
								status.includes('successfully')
									? isDarkMode
										? 'bg-gray-700 border-gray-600 text-gray-200'
										: 'bg-white border-gray-200 text-gray-800'
									: status.includes('try again')
									? 'bg-red-100 border-red-300 text-red-700'
									: ''
							}`}
						>
							{status.includes('successfully') ? (
								<>
									<svg
										className='h-5 w-5 text-green-500'
										fill='none'
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										viewBox='0 0 24 24'
										stroke='currentColor'
									>
										<path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'></path>
									</svg>
									Thanks for submitting, our team will get back to you.
								</>
							) : status.includes('try again') ? (
								<>
									<svg
										className='h-5 w-5 text-red-500'
										fill='none'
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										viewBox='0 0 24 24'
										stroke='currentColor'
									>
										<path d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2A9 9 0 1112 11c0 2.13 1.13 4.06 3 5.13l-1.5 1.5M21 12a9 9 0 01-18 0c0-2.13 1.13-4.06 3-5.13l-1.5-1.5'></path>
									</svg>
									An error occurred. Please try again later.
								</>
							) : null}
						</div>
					)}
				</div>
			</div>
			{/* Wavy background effect (simplified with a large, rotated div) - Grayscale */}
			<div
				className={`absolute bottom-0 left-0 w-full h-1/3 transform rotate-6 -translate-y-1/2 opacity-50 hidden md:block animate-fadeIn animate-delay-300 ${
					isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
				}`}
			></div>
			<div
				className={`absolute top-0 right-0 w-full h-1/2 transform -rotate-12 translate-y-1/2 opacity-30 hidden md:block animate-fadeIn animate-delay-400 ${
					isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
				}`}
			></div>
		</section>
	);
}

// Features Section Component - Updated for Black & White theme with NEW creative icons
function FeaturesSection({ isDarkMode }) {
	const [featuresRef, featuresVisible] = useIntersectionObserver({
		threshold: 0.1,
	});

	const features = [
		{
			icon: (
				<svg
					fill='currentColor'
					className={`w-10 h-10 sm:w-12 sm:h-12 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
					xmlns='http://www.w3.org/2000/svg'
					viewBox='0 0 512 512'
				>
					<path d='M256 48C141.1 48 48 141.1 48 256l0 40c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-40C0 114.6 114.6 0 256 0S512 114.6 512 256l0 144.1c0 48.6-39.4 88-88.1 88L313.6 488c-8.3 14.3-23.8 24-41.6 24l-32 0c-26.5 0-48-21.5-48-48s21.5-48 48-48l32 0c17.8 0 33.3 9.7 41.6 24l110.4 .1c22.1 0 40-17.9 40-40L464 256c0-114.9-93.1-208-208-208zM144 208l16 0c17.7 0 32 14.3 32 32l0 112c0 17.7-14.3 32-32 32l-16 0c-35.3 0-64-28.7-64-64l0-48c0-35.3 28.7-64 64-64zm224 0c35.3 0 64 28.7 64 64l0 48c0 35.3-28.7 64-64 64l-16 0c-17.7 0-32-14.3-32-32l0-112c0-17.7 14.3-32 32-32l16 0z' />
				</svg>
			),
			title: 'AI Customer Support Service',
			description: [
				{
					text: (
						<>
							<span className='font-bold'>Instant Support:</span> Resolve up to 80% of queries instantly while cutting response times by 60%
						</>
					),
					icon: (
						<svg
							className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 13l4 4L19 7' />
						</svg>
					),
				},
				{
					text: (
						<>
							<span className='font-bold'>Cost Efficiency:</span> Reduce support costs by 70% through automation and 24/7 availability
						</>
					),
					icon: (
						<svg
							className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 10V3L4 14h7v7l9-11h-7z' />
						</svg>
					),
				},
				{
					text: (
						<>
							<span className='font-bold'>Customer Satisfaction:</span> Boost engagement by 50% and achieve over 90% satisfaction rates
						</>
					),
					icon: (
						<svg
							className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
							fill='currentColor'
							viewBox='0 0 24 24'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14h-2V8h2v8zm3 0h-2V8h2v8zm3 0h-2V8h2v8z' />
						</svg>
					),
				},
			],
		},
		{
			icon: (
				<svg
					fill='currentColor'
					className={`w-10 h-10 sm:w-12 sm:h-12 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
					xmlns='http://www.w3.org/2000/svg'
					viewBox='0 0 640 512'
				>
					<path d='M144 160A80 80 0 1 0 144 0a80 80 0 1 0 0 160zm368 0A80 80 0 1 0 512 0a80 80 0 1 0 0 160zM0 298.7C0 310.4 9.6 320 21.3 320l213.3 0c.2 0 .4 0 .7 0c-26.6-23.5-43.3-57.8-43.3-96c0-7.6 .7-15 1.9-22.3c-13.6-6.3-28.7-9.7-44.6-9.7l-42.7 0C47.8 192 0 239.8 0 298.7zM320 320c24 0 45.9-8.8 62.7-23.3c2.5-3.7 5.2-7.3 8-10.7c2.7-3.3 5.7-6.1 9-8.3C410 262.3 416 243.9 416 224c0-53-43-96-96-96s-96 43-96 96s43 96 96 96zm65.4 60.2c-10.3-5.9-18.1-16.2-20.8-28.2l-103.2 0C187.7 352 128 411.7 128 485.3c0 14.7 11.9 26.7 26.7 26.7l300.6 0c-2.1-5.2-3.2-10.9-3.2-16.4l0-3c-1.3-.7-2.7-1.5-4-2.3l-2.6 1.5c-16.8 9.7-40.5 8-54.7-9.7c-4.5-5.6-8.6-11.5-12.4-17.6l-.1-.2-.1-.2-2.4-4.1-.1-.2-.1-.2c-3.4-6.2-6.4-12.6-9-19.3c-8.2-21.2 2.2-42.6 19-52.3l2.7-1.5c0-.8 0-1.5 0-2.3s0-1.5 0-2.3l-2.7-1.5zM533.3 192l-42.7 0c-15.9 0-31 3.5-44.6 9.7c1.3 7.2 1.9 14.7 1.9 22.3c0 17.4-3.5 33.9-9.7 49c2.5 .9 4.9 2 7.1 3.3l2.6 1.5c1.3-.8 2.6-1.6 4-2.3l0-3c0-19.4 13.3-39.1 35.8-42.6c7.9-1.2 16-1.9 24.2-1.9s16.3 .6 24.2 1.9c22.5 3.5 35.8 23.2 35.8 42.6l0 3c1.3 .7 2.7 1.5 4 2.3l2.6-1.5c16.8-9.7 40.5-8 54.7 9.7c2.3 2.8 4.5 5.8 6.6 8.7c-2.1-57.1-49-102.7-106.6-102.7zm91.3 163.9c6.3-3.6 9.5-11.1 6.8-18c-2.1-5.5-4.6-10.8-7.4-15.9l-2.3-4c-3.1-5.1-6.5-9.9-10.2-14.5c-4.6-5.7-12.7-6.7-19-3l-2.9 1.7c-9.2 5.3-20.4 4-29.6-1.3s-16.1-14.5-16.1-25.1l0-3.4c0-7.3-4.9-13.8-12.1-14.9c-6.5-1-13.1-1.5-19.9-1.5s-13.4 .5-19.9 1.5c-7.2 1.1-12.1 7.6-12.1 14.9l0 3.4c0 10.6-6.9 19.8-16.1 25.1s-20.4 6.6-29.6 1.3l-2.9-1.7c-6.3-3.6-14.4-2.6-19 3c-3.7 4.6-7.1 9.5-10.2 14.6l-2.3 3.9c-2.8 5.1-5.3 10.4-7.4 15.9c-2.6 6.8 .5 14.3 6.8 17.9l2.9 1.7c9.2 5.3 13.7 15.8 13.7 26.4s-4.5 21.1-13.7 26.4l-3 1.7c-6.3 3.6-9.5 11.1-6.8 17.9c2.1 5.5 4.6 10.7 7.4 15.8l2.4 4.1c3 5.1 6.4 9.9 10.1 14.5c4.6 5.7 12.7 6.7 19 3l2.9-1.7c9.2-5.3 20.4-4 29.6 1.3s16.1 14.5 16.1 25.1l0 3.4c0 7.3 4.9 13.8 12.1 14.9c6.5 1 13.1 1.5 19.9 1.5s13.4-.5 19.9-1.5c-7.2-1.1-12.1-7.6-12.1-14.9l0-3.4c0-10.6 6.9-19.8 16.1-25.1s20.4-6.6 29.6-1.3l2.9 1.7c6.3 3.6 14.4 2.6 19-3c3.7-4.6 7.1-9.4 10.1-14.5l2.4-4.2c2.8-5.1 5.3-10.3 7.4-15.8c2.6-6.8-.5-14.3-6.8-17.9l-3-1.7c-9.2-5.3-13.7-15.8-13.7-26.4s4.5-21.1 13.7-26.4l3-1.7zM472 384a40 40 0 1 1 80 0 40 40 0 1 1 -80 0z' />
				</svg>
			),
			title: 'Agentic workflows',
			description: [
				{
					text: (
						<>
							<span className='font-bold'>Boost Efficiency:</span> Streamline operations by 75% and accelerate task completion by 50%
						</>
					),
					icon: (
						<svg
							className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'></path>
						</svg>
					),
				},
				{
					text: (
						<>
							<span className='font-bold'>Enhance Accuracy & Insight:</span> Reduce manual errors by 90% and make smarter decisions with real-time
							insights
						</>
					),
					icon: (
						<svg
							className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 7l5 5m0 0l-5 5m5-5H6'></path>
						</svg>
					),
				},
				{
					text: (
						<>
							<span className='font-bold'>Adapt & Optimize:</span> Dynamically respond to business changes while improving resource allocations
						</>
					),
					icon: (
						<svg
							className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
							fill='currentColor'
							viewBox='0 0 24 24'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z' />
						</svg>
					),
				},
			],
		},
		{
			icon: (
				<svg
					className={`w-10 h-10 sm:w-12 sm:h-12 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
					viewBox='0 0 512 512'
					fill='currentColor'
					xmlns='http://www.w3.org/2000/svg'
				>
					<path d='M176 24c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c-35.3 0-64 28.7-64 64l-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0 0 56-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0 0 56-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0c0 35.3 28.7 64 64 64l0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40 56 0 0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40 56 0 0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40c35.3 0 64-28.7 64-64l40 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-40 0 0-56 40 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-40 0 0-56 40 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-40 0c0-35.3-28.7-64-64-64l0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40-56 0 0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40-56 0 0-40zM160 128l192 0c17.7 0 32 14.3 32 32l0 192c0 17.7-14.3 32-32 32l-192 0c-17.7 0-32-14.3-32-32l0-192c0-17.7 14.3-32 32-32zm192 32l-192 0 0 192 192 0 0-192z' />
				</svg>
			),
			title: 'Intelligent Business Logic',
			description: [
				{
					text: (
						<>
							<span className='font-bold'>Smarter Decisions:</span> Automate decision-making by 60% and improve data accuracy by 95%
						</>
					),
					icon: (
						<svg
							className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'></path>
						</svg>
					),
				},
				{
					text: (
						<>
							<span className='font-bold'>Cost & Resource Optimization:</span> Cut operational costs by 30% and enhance resource allocation by 25%
						</>
					),
					icon: (
						<svg
							className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
							fill='currentColor'
							viewBox='0 0 24 24'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14H8V8h2v8zm3 0h-2V8h2v8zm3 0h-2V8h2v8z' />
						</svg>
					),
				},
				{
					text: (
						<>
							<span className='font-bold'>Future-Ready Intelligence:</span> Continuously adapt to market changes and boost predictive capabilities
							for better forecasting
						</>
					),
					icon: (
						<svg
							className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
							fill='currentColor'
							viewBox='0 0 24 24'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z' />
						</svg>
					),
				},
			],
		},
	];

	return (
		<section
			ref={featuresRef}
			className={`py-12 pb-20 transition-opacity duration-1000 ${featuresVisible ? 'opacity-100' : 'opacity-0'} ${
				isDarkMode ? 'bg-gray-900' : 'bg-white'
			}`}
		>
			<div className='container mx-auto px-4 text-center'>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8'>
					{features.map((feature, index) => (
						<FeatureCard
							key={index}
							icon={feature.icon}
							title={feature.title}
							description={feature.description}
							delay={index * 100}
							isDarkMode={isDarkMode}
						/>
					))}
				</div>
			</div>
		</section>
	);
}

// Feature Card Component - Adjusted for Black & White theme with animation
const FeatureCard = ({ icon, title, description, delay, isDarkMode }) => (
	<div
		className={`p-6 sm:p-8 rounded-xl border flex flex-col items-center justify-center text-center animate-slideInUp transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 ${
			isDarkMode
				? 'bg-gray-800 border-gray-700 shadow-[0_4px_12px_rgba(255,255,255,0.05)] hover:shadow-[0_10px_25px_rgba(255,255,255,0.1)]'
				: 'bg-white border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.1)]'
		}`}
		style={{ animationDelay: `${delay}ms` }}
	>
		<div className='mb-3 sm:mb-4 flex justify-center'>{icon}</div>
		<h3 className={`text-lg sm:text-xl font-semibold mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h3>
		{Array.isArray(description) ? (
			<ul className={`list-none p-0 m-0 space-y-1 sm:space-y-2 text-left ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
				{description.map((item, i) => (
					<li key={i} className='flex items-center gap-1.5 sm:gap-2'>
						{item.icon}
						<span className='text-xs sm:text-sm'>{item.text}</span>
					</li>
				))}
			</ul>
		) : (
			<p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{description}</p>
		)}
	</div>
);

const SeamlessIntegrations = ({ isDarkMode }) => {
	const integrations = [
		{
			label: 'WhatsApp',
			icon: (
				<svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
					<path
						fill='#25D366'
						d='M16 2.933C8.64 2.933 2.667 8.906 2.667 16.267c0 2.84.906 5.47 2.44 7.627L2.667 29.067l5.347-2.387a13.226 13.226 0 006.64 1.787c7.36 0 13.333-5.973 13.333-13.333S23.36 2.933 16 2.933z'
					/>
					<path
						fill='#fff'
						d='M23.36 19.373c-.333-.173-1.973-.96-2.28-1.067-.307-.107-.533-.173-.76.173-.227.347-.867 1.067-1.067 1.28-.2.213-.387.24-.72.08-.333-.16-1.413-.52-2.693-1.653-.993-.893-1.667-1.987-1.867-2.32-.2-.333-.02-.513.147-.68.147-.147.333-.387.493-.573.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.573-.08-.173-.76-1.813-1.04-2.48-.28-.667-.56-.56-.76-.573h-.653c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667 0 1.573 1.147 3.093 1.307 3.307.16.213 2.24 3.413 5.44 4.72 3.2 1.307 3.2.867 3.76.813.56-.053 1.827-.747 2.08-1.48.253-.733.253-1.36.173-1.48-.08-.12-.293-.2-.627-.373z'
					/>
				</svg>
			),
		},
		{
			label: 'Website',
			icon: (
				<svg
					width='32'
					height='32'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth='1.8'
					strokeLinecap='round'
					strokeLinejoin='round'
				>
					<circle cx='12' cy='12' r='10' />
					<line x1='2' y1='12' x2='22' y2='12' />
					<path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' />
				</svg>
			),
		},
		{
			label: 'Mobile App',
			icon: (
				<svg
					width='32'
					height='32'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth='1.8'
					strokeLinecap='round'
					strokeLinejoin='round'
				>
					<rect x='7' y='2' width='10' height='20' rx='2' ry='2' />
					<line x1='12' y1='18' x2='12.01' y2='18' />
				</svg>
			),
		},
	];

	return (
		<div className='relative w-full max-w-5xl mx-auto px-4 py-10'>
			<div
				className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full shadow text-sm font-medium border ${
					isDarkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-600 border-gray-200'
				}`}
			>
				Seamless Integrations with:
			</div>

			<div
				className={`rounded-2xl px-6 py-8 flex flex-wrap justify-center items-center gap-8 sm:gap-12  transition-all duration-300 ${
					isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
				}`}
			>
				{integrations.map((integration, idx) => (
					<IntegrationCard key={idx} icon={integration.icon} label={integration.label} isDarkMode={isDarkMode} />
				))}
			</div>
		</div>
	);
};

const IntegrationCard = ({ icon, label, isDarkMode }) => (
	<div
		className={`flex flex-col items-center justify-center text-center gap-2 rounded-xl border backdrop-blur-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-[1.02] px-4 py-5 min-w-[100px] ${
			isDarkMode
				? 'bg-white/5 border-white/10 text-gray-100 shadow-[0_4px_12px_rgba(255,255,255,0.05)] hover:shadow-[0_10px_25px_rgba(255,255,255,0.1)]'
				: 'bg-white/50 border-gray-200 text-gray-800 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.1)]'
		}`}
	>
		<div className='mb-1'>{icon}</div>
		<span className='text-xs font-medium tracking-wide opacity-80'>{label}</span>
	</div>
);

// About Section Component (existing) with animations and centered content
function AboutSection({ isDarkMode }) {
	const [aboutRef, aboutVisible] = useIntersectionObserver({ threshold: 0.1 });

	return (
		<section
			ref={aboutRef}
			className={`py-12 sm:py-20 transition-opacity duration-1000 ${aboutVisible ? 'opacity-100' : 'opacity-0'} ${
				isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
			}`}
		>
			<div className='container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12'>
				<div className='md:w-1/2 text-center animate-slideInUp'>
					<span
						className={`inline-block text-xs sm:text-sm font-medium px-2 py-0.5 sm:px-3 sm:py-1 rounded-full mb-4 sm:mb-6 ${
							isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
						}`}
					>
						About Nimble AI
					</span>
					<h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4 sm:mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
						Nimble AI empowers your business with cutting-edge AI solutions, driving unparalleled efficiency and strategic advantage.
					</h2>
					<p className={`text-sm sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
						At Nimble AI, we harness the power of advanced artificial intelligence to drive business transformation. Our cutting-edge solutions:
						Elevate customer support with intelligent, responsive systems Automate complex workflows to boost efficiency and reduce manual effort
						Implement intelligent business logic for smarter, faster decision-making Founded by IIT Bombay alumni with over 8 years of deep
						expertise in AI, machine learning, and related domains, our team combines technical excellence with real-world insights. This ensures
						Nimble AI consistently delivers forward-thinking, impactful innovations that keep our clients ahead of the curve.
					</p>
				</div>
				<div className='md:w-1/2 grid grid-cols-1 gap-4 sm:gap-6 animate-fadeIn animate-delay-200 max-w-xs sm:max-w-sm mx-auto'>
					<InfoCard title='Beta Access:' value='Q2, 2025' isDarkMode={isDarkMode} />
					<InfoCard title='Implementation:' value='Founder-led Onboarding' isDarkMode={isDarkMode} />
					<InfoCard
						title='Your First Demo Is on Us – Try It Free!'
						// value='Your First Demo Is on Us – Try It Free!'
						// icon={
						// 	<svg
						// 		className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
						// 		fill='none'
						// 		stroke='currentColor'
						// 		viewBox='0 0 24 24'
						// 		xmlns='http://www.w3.org/2000/svg'
						// 	>
						// 		<path
						// 			strokeLinecap='round'
						// 			strokeLinejoin='round'
						// 			strokeWidth='2'
						// 			d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V4m0 12v4m-6-2h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
						// 		></path>
						// 	</svg>
						// }
						isDarkMode={isDarkMode}
					/>
				</div>
			</div>
		</section>
	);
}

// Reusable Info Card Component for About Section (existing)
const InfoCard = ({ title, value, icon, isDarkMode }) => (
	<div
		className={`p-4 sm:p-6 rounded-xl shadow-md border flex items-center justify-between animate-slideInUp ${
			isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
		}`}
	>
		<div className='flex items-center gap-1.5 sm:gap-2'>
			{icon}
			<span className={`text-sm sm:text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{title}</span>
		</div>
		<span className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{value}</span>
	</div>
);

// Comparison Section Component (existing) with animations
function ComparisonSection({ isDarkMode }) {
	const [comparisonRef, comparisonVisible] = useIntersectionObserver({
		threshold: 0.1,
	});

	return (
		<section
			ref={comparisonRef}
			className={`py-12 sm:py-20 transition-opacity duration-1000 ${comparisonVisible ? 'opacity-100' : 'opacity-0'} ${
				isDarkMode ? 'bg-gray-900' : 'bg-white'
			}`}
		>
			<div className='container mx-auto px-4 text-center'>
				<h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12 animate-slideInUp ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
					Nimble AI in Action
				</h2>
				<div className='flex flex-col lg:flex-row justify-center items-stretch gap-6 sm:gap-8'>
					{/* Nimble AI Chat Demo */}
					<div
						className={`lg:w-1/2 rounded-xl shadow-lg p-4 sm:p-6 flex flex-col animate-fadeIn animate-delay-200 max-w-md mx-auto ${
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
						{/* Chat Messages */}
						<div className='space-y-3 flex-grow'>
							<AIMessage text='Hello! How can I assist you today?' isDarkMode={isDarkMode} />
							<CustomerMessage text='I need to know my order status.' isDarkMode={isDarkMode} />
							<AIMessage text='Could you please provide your order number or the email address used for the purchase?' isDarkMode={isDarkMode} />
							<CustomerMessage text='My order number is #12345.' isDarkMode={isDarkMode} />
							<AIMessage text='Thank you. Please wait a moment while I retrieve your order details.' isDarkMode={isDarkMode} />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

// Reusable User Message Component for Comparison Section (now CustomerMessage)
const CustomerMessage = ({ text, isDarkMode }) => (
	<div className='flex justify-end animate-fadeIn'>
		<div className={`p-2 sm:p-3 rounded-lg max-w-[80%] text-right shadow-sm ${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-900 text-white'}`}>
			<p className='text-xs sm:text-sm'>{text}</p>
		</div>
	</div>
);

// Reusable AI Message Component for Comparison Section
const AIMessage = ({ text, link, isDarkMode }) => (
	<div className='flex justify-start animate-fadeIn'>
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
		</div>
	</div>
);

// FAQ Section Component (existing) with animations
function FAQSection({ isDarkMode }) {
	const [faqRef, faqVisible] = useIntersectionObserver({ threshold: 0.1 });

	const faqs = [
		{
			question: 'What is Nimble AI?',
			answer: 'Nimble AI is an intelligent AI agent designed to automate customer interactions, enhance response accuracy, and dynamically update knowledge graphs for seamless workflow integration.',
		},
		{
			question: 'What platforms does it support?',
			answer: 'Nimble AI is designed to integrate seamlessly with various popular customer support and CRM platforms. Specific integrations will be announced closer to launch.',
		},
		// {
		// 	question: 'Who can use Nimble AI?',
		// 	answer: 'Nimble AI is built for businesses of all sizes looking to enhance their customer support, streamline operations, and leverage AI for better customer interactions.',
		// },
		{
			question: 'What kind of data does Nimble AI use for training?',
			answer: 'Nimble AI is trained on a diverse range of anonymized and aggregated customer interaction data to ensure broad applicability and high accuracy, while strictly adhering to privacy protocols.',
		},
		{
			question: 'How does Nimble AI handle sensitive customer information?',
			answer: 'We prioritize data security and privacy. Nimble AI employs robust encryption and anonymization techniques, and all sensitive information is handled in compliance with industry-leading security standards.',
		},
		{
			question: 'Can Nimble AI integrate with my existing CRM system?',
			answer: 'Yes, Nimble AI is built with flexible APIs and connectors to seamlessly integrate with most popular CRM platforms, ensuring a smooth transition and enhanced functionality.',
		},
		{
			question: 'What support is available after implementation?',
			answer: 'We offer comprehensive support packages, including dedicated account management, technical assistance, and regular updates to ensure optimal performance and continuous improvement of your AI solutions.',
		},
		// {
		// 	question: 'How long does it take to implement Nimble AI?',
		// 	answer: 'Implementation time varies depending on your specific needs and existing infrastructure, but our team works closely with you to ensure a swift and efficient setup, typically ranging from a few weeks to a couple of months.',
		// },
	];

	return (
		<section
			ref={faqRef}
			className={`py-12 sm:py-20 transition-opacity duration-1000 ${faqVisible ? 'opacity-100' : 'opacity-0'} ${
				isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
			}`}
		>
			<div className='container mx-auto px-4 text-center'>
				<span
					className={`inline-block text-xs sm:text-sm font-medium px-2 py-0.5 sm:px-3 sm:py-1 rounded-full mb-4 sm:mb-6 animate-fadeIn ${
						isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
					}`}
				>
					FAQ
				</span>
				<h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12 animate-slideInUp ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
					Frequently Asked Questions
				</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start max-w-lg sm:max-w-4xl mx-auto'>
					{faqs.map((faq, index) => (
						<FAQItem key={index} question={faq.question} answer={faq.answer} delay={index * 100} isDarkMode={isDarkMode} />
					))}
				</div>
			</div>
		</section>
	);
}

// Reusable FAQ Item Component with animation
function FAQItem({ question, answer, delay, isDarkMode }) {
	const [isOpen, setIsOpen] = React.useState(false);

	return (
		<div
			className={`p-4 sm:p-6 rounded-xl shadow-md border text-left cursor-pointer transition-all duration-300 hover:shadow-lg animate-slideInUp ${
				isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
			}`}
			style={{ animationDelay: `${delay}ms` }}
		>
			<div className='flex justify-between items-center' onClick={() => setIsOpen(!isOpen)}>
				<h3 className={`text-base sm:text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{question}</h3>
				<svg
					className={`w-5 h-5 sm:w-6 sm:h-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${
						isDarkMode ? 'text-gray-200' : 'text-gray-700'
					}`}
					fill='none'
					stroke='currentColor'
					viewBox='0 0 24 24'
					xmlns='http://www.w3.org/2000/svg'
				>
					<path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7' />
				</svg>
			</div>
			{isOpen && (
				<p className={`mt-3 text-sm sm:text-base transition-all duration-300 ease-in-out ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
					{answer}
				</p>
			)}
		</div>
	);
}

// Footer Component - Updated for Black & White theme to match the screenshot
function Footer({ isDarkMode }) {
	const [footerRef, footerVisible] = useIntersectionObserver({
		threshold: 0.1,
	});

	return (
		<footer
			ref={footerRef}
			className={`py-8 sm:py-10 border-t transition-opacity duration-1000 ${footerVisible ? 'opacity-100' : 'opacity-0'} ${
				isDarkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-900 border-gray-200'
			}`}
		>
			<div className='container mx-auto px-4 text-center'>
				<div className='flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4 justify-center items-center'>
					{/* "Write Us" button updated to mailto link */}
					<a
						href='mailto:enquire@nimble.ai'
						className={`px-4 py-1.5 sm:px-6 sm:py-2 font-semibold rounded-full shadow-lg transition duration-300 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
							isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-900 text-white hover:bg-gray-700'
						}`}
					>
						<svg className='w-4 h-4 sm:w-5 sm:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth='2'
								d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
							/>
						</svg>
						Write Us
					</a>
				</div>

				{/* Follow Us */}
				<div className='flex flex-col items-center space-y-1.5 sm:space-y-2 mb-3 sm:mb-4'>
					<span className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Follow Us</span>
					<a
						href='https://www.linkedin.com/company/nimbleai-in/'
						target='_blank'
						rel='noopener noreferrer'
						className={`${isDarkMode ? 'text-gray-200 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'} transition-colors duration-300`}
					>
						<svg className='w-6 h-6 sm:w-8 sm:h-8' fill='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
							<path d='M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' />
						</svg>
					</a>
				</div>

				{/* Copyright and Slogan */}
				<div
					className={`flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm border-t pt-4 sm:pt-6 mt-4 sm:mt-6 ${
						isDarkMode ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-200'
					}`}
				>
					<p className='mb-1.5 sm:mb-0'>&copy; 2025, Nimble AI, Inc</p>
					<p>100x your productivity while supporting customers!</p>
				</div>
			</div>
		</footer>
	);
}

export default App;
