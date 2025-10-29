import React, { useState, useEffect, useRef } from 'react';
// import ChatWidget from './components/ChatWidget';
import FeaturesSection from './components/FeaturesSection';
import HeroSection from './components/HeroSection';
import WhatsAppEmbeddedSignup from './components/WhatsAppEmbeddedSignup';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import SignInButton from './components/SignInButton';
import Dashboard from './components/Dashboard/Dashboard';
import LiveChat from './components/LiveChat';
import { useAuth } from './hooks/useAuth';
import WhatsAppAIAgentSection from './components/WhatsAppAIAgentSection';

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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
	const { user, loading } = useAuth();
	
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}
	
	if (!user) {
		return <Navigate to="/" replace />;
	}
	
	return children;
};

// Public Route Component (redirects to dashboard if already signed in)
const PublicRoute = ({ children }) => {
	const { user, loading } = useAuth();
	
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}
	
	if (user) {
		return <Navigate to="/dashboard" replace />;
	}
	
	return children;
};

// Main App Component
function App() {
	// State for managing dark mode, initialized from localStorage
	const [isDarkMode, setIsDarkMode] = useState(() => {
		const savedMode = localStorage.getItem('theme');
		return savedMode === 'dark';
	});
	
	// Get user authentication state
	const { user } = useAuth();

	// State for modal and form
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState(null);
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		mobile: '',
		plan: '',
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitSuccess, setSubmitSuccess] = useState('');

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

	// Function to handle plan selection
	const handlePlanSelect = (plan) => {
		setSelectedPlan(plan);
		setFormData((prev) => ({ ...prev, plan: plan.name }));
		setIsModalOpen(true);
		setSubmitSuccess('');
	};

	// Function to handle form submission
	const handleFormSubmit = (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		setSubmitSuccess('');
		fetch('https://a804judny2.execute-api.us-east-1.amazonaws.com/auto/sendEmail', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userEmail: formData.email,
				name: formData.name,
				mobile: formData.mobile,
				plan: formData.plan,
			}),
		})
			.then((response) => {
				if (response.ok) {
					setSubmitSuccess('Thank you! Your request has been submitted.');
					setFormData({ name: '', email: '', mobile: '', plan: '' });
					setSelectedPlan(null);
				} else {
					setSubmitSuccess('Failed to submit. Please try again.');
				}
			})
			.catch(() => {
				setSubmitSuccess('An error occurred. Please try again later.');
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	};

	return (
		<Router>
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
				<Routes>
					<Route path="/" element={
						<PublicRoute>
							<>
								{/* Hero Section Component */}
								<HeroSection isDarkMode={isDarkMode} />
								
								{/* Features Section Component */}
								<FeaturesSection isDarkMode={isDarkMode} />

								{/* Comparison Section Component */}
								{/* <ComparisonSection isDarkMode={isDarkMode} /> */}
								<SeamlessIntegrations isDarkMode={isDarkMode} user={user} />

								{/* FAQ Section Component */}
								<FAQSection isDarkMode={isDarkMode} />
								<WhatsAppAIAgentSection isDarkMode={isDarkMode} />

																{/* About Section Component */}
								<AboutSection isDarkMode={isDarkMode} />
								
							</>
						</PublicRoute>
					} />
					<Route path="/dashboard" element={
						<ProtectedRoute>
							<Dashboard />
						</ProtectedRoute>
					} />
					<Route path="/livechat" element={
						<ProtectedRoute>
							<LiveChat isDarkMode={isDarkMode} />
						</ProtectedRoute>
					} />
					<Route path="/privacy-policy" element={<PrivacyPolicy isDarkMode={isDarkMode} />} />
					<Route path="/terms-of-service" element={<TermsOfService isDarkMode={isDarkMode} />} />
					<Route path="/delete-user-data" element={<UserDataDeletion isDarkMode={isDarkMode} />} />
					<Route path="/pricing-policy" element={<PricingPolicy isDarkMode={isDarkMode} />} />
					<Route path="/shipping-policy" element={<ShippingPolicy isDarkMode={isDarkMode} />} />
					<Route path="/cancellation-refund-policy" element={<CancellationRefundPolicy isDarkMode={isDarkMode} />} />
				</Routes>
				{/* Footer Component */}
				<Footer isDarkMode={isDarkMode} />

				{/* Plan Selection Modal */}
				{isModalOpen && (
					<PlanSelectionModal
						isOpen={isModalOpen}
						onClose={() => setIsModalOpen(false)}
						selectedPlan={selectedPlan}
						formData={formData}
						setFormData={setFormData}
						onSubmit={handleFormSubmit}
						isDarkMode={isDarkMode}
						isSubmitting={isSubmitting}
						submitSuccess={submitSuccess}
					/>
				)}

				{/* Floating Chat Widget */}
				{/* <ChatWidget isDarkMode={isDarkMode} /> */}
			</div>
		</Router>
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
				<Link to="/" className='flex items-center space-x-2 flex-grow justify-center basis-1/3'>
					<img src={require('./logo.png')} alt='Nimble AI Logo' className={`h-12 w-auto object-contain ${isDarkMode ? 'logo-invert' : ''}`} />
				</Link>
				{/* Dark Mode Toggle Button */}
				<div className='flex-grow flex justify-end items-center gap-4 basis-1/3'>
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
					<SignInButton />
				</div>
			</div>
		</nav>
	);
}

const pricingPlans = [
	{
		name: 'Starter',
		price: '₹0',
		duration: '/mo.',
		description: 'Ideal for solo entrepreneurs and small businesses.',
		includes: 'Includes 1 agent',
		features: ['20 conversations', '1 integration', 'Live visitors list', 'Operating hours'],
		buttonText: 'Select plan',
	},
	{
		name: 'Growth',
		price: '₹3,900',
		duration: '/mo.',
		// tag: 'POPULAR',
		description: 'Ideal for teams of all sizes prioritizing customer service as their competitive advantage.',
		includes: 'Includes 1 agent',
		features: ['Up to 2,000 Billable conversations', '2 integrations', 'Advanced analytics', 'No Nimble AI branding (add-on)', 'Permissions'],
		buttonText: 'Select plan',
	},
	{
		name: 'Plus',
		price: '₹30,000',
		duration: '/mo.',
		description: 'For businesses requiring better limits, additional integrations, advanced features, and premium support.',
		includes: 'Includes up to 5 agents',
		features: ['Up to 20,000 Billable conversations', '2 integrations', 'Dedicated Success Manager', 'Custom branding', 'Departments'],
		buttonText: 'Select plan',
	},
	{
		name: 'Premium',
		price: '₹2,48,000',
		duration: '/mo.',
		description: 'For more complex businesses',
		includes: 'Unlimited agents',
		features: [
			'Guaranteed 50% Nimble AI resolution rate',
			'Priority Service + Premium Support',
			'Analysis & monitoring',
			'Dedicated Success Manager',
			'Custom branding',
			'Departments',
		],
		buttonText: 'Select plan',
	},
];


const SeamlessIntegrations = ({ isDarkMode, user }) => {
	const integrations = [
		{ src: require('./integrations/mailchimp.png'), bg: 'bg-yellow-200', alt: 'Mailchimp' },
		{ src: require('./integrations/hubspot.png'), bg: 'bg-rose-100', alt: 'HubSpot' },
		{ src: require('./integrations/wordpress.png'), bg: 'bg-blue-100', alt: 'WordPress' },
		{ src: require('./integrations/shopify.png'), bg: 'bg-green-100', alt: 'Shopify' },
		{ src: require('./integrations/squarespace.png'), bg: 'bg-violet-100', alt: 'Squarespace' },
		{ src: require('./integrations/zendesk.png'), bg: 'bg-gray-100', alt: 'Zendesk' },
		// { src: require('./integrations/other.png'), bg: 'bg-orange-100', alt: 'Other' },
	];

	return (
		<section className={`py-16 px-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
			<div className='max-w-5xl mx-auto text-center'>
				<h2 className='text-3xl sm:text-4xl font-extrabold mb-6'>Seamless integration with your workflow and processes.</h2>

				{/* Icons */}
				<div className='flex flex-wrap justify-center items-center gap-4 sm:gap-6 mb-6 md:p-6'>
					{integrations.map((item, idx) => (
						<div key={idx} className={`${item.bg} rounded-full w-20 h-20 flex items-center justify-center border-4 border-white`}>
							<img src={item.src} alt={item.alt} className='w-10 h-10 object-contain' />
						</div>
					))}
					
					{/* WhatsApp Setup Button - Show when authenticated */}
					{user && (
						<div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center border-4 border-white cursor-pointer hover:bg-green-200 transition-colors">
							<svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 24 24">
								<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
							</svg>
						</div>
					)}
				</div>

				{/* WhatsApp Setup Section - Show when authenticated */}
				{user && (
					<div className="max-w-md mx-auto mt-8">
						<WhatsAppEmbeddedSignup isDarkMode={isDarkMode} />
					</div>
				)}

				{/* <p className='text-sm text-gray-500 dark:text-gray-400'>and more than 120+ tools to integrate</p> */}
			</div>
		</section>
	);
};

// About Section Component (existing) with animations and centered content
function AboutSection({ isDarkMode }) {
	const [aboutRef, aboutVisible] = useIntersectionObserver({ threshold: 0.1 });
	const [open, setOpen] = React.useState(false);

	return (
		<section
			ref={aboutRef}
			className={`py-12 sm:py-20 transition-opacity duration-1000 ${aboutVisible ? 'opacity-100' : 'opacity-0'} ${
				isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
			}`}
		>
			<div className='container mx-auto px-4 flex flex-col items-center justify-center gap-8 md:gap-12'>
				<div className='w-full flex flex-col items-center'>
					<button
						onClick={() => setOpen((v) => !v)}
						className={`inline-block text-xs sm:text-sm font-medium px-2 py-0.5 sm:px-3 sm:py-1 rounded-full mb-4 sm:mb-6 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors duration-300 ${
							isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
						}`}
						aria-expanded={open}
						aria-controls='about-nimble-content'
					>
						About Nimble AI
						<svg
							className={`w-4 h-4 ml-2 inline-block transform transition-transform duration-300 ${open ? 'rotate-180' : ''} ${
								isDarkMode ? 'text-gray-200' : 'text-gray-700'
							}`}
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
							xmlns='http://www.w3.org/2000/svg'
						>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7' />
						</svg>
					</button>
				</div>
				{open && (
					<div id='about-nimble-content' className='w-full flex flex-col items-center justify-center gap-8 md:gap-12'>
						<div className='w-full max-w-2xl text-center animate-slideInUp'>
							<h2
								className={`text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4 sm:mb-6 ${
									isDarkMode ? 'text-gray-100' : 'text-gray-900'
								}`}
							>
								Nimble AI empowers your business with cutting-edge AI solutions, driving unparalleled efficiency and strategic advantage.
							</h2>
							<div className={`text-sm sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
								<p className='mb-2'>
									At Nimble AI, we harness the power of advanced artificial intelligence to enable true business transformation. Our
									innovative solutions are designed to:
								</p>
								<ul className='list-disc pl-5 mb-4 space-y-2 mt-0 text-left'>
									<li className='text-left'>Elevate customer support with intelligent, always-on systems</li>
									<li className='text-left'>Automate complex workflows to boost operational efficiency and minimize manual effort</li>
									<li className='text-left'>Enable smarter, faster decisions through intelligent business logic</li>
								</ul>
								<p>
									Founded by IIT Bombay alumni with over 8 years of hands-on experience in AI, machine learning, and automation, our team
									blends deep technical expertise with practical, real-world insight. This unique combination allows Nimble AI to consistently
									deliver future-ready, impactful innovations that help our clients stay ahead in an ever-evolving digital landscape.
								</p>
							</div>
						</div>
					</div>
				)}
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
					{/* "Write to Us" button updated to mailto link */}
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
						Write to Us
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

				{/* Legal Links */}
				<div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
					<a
						href="/privacy-policy"
						className={`text-xs sm:text-sm underline hover:no-underline transition-colors duration-200 ${isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						Privacy Policy
					</a>
					<span className={`hidden sm:inline text-gray-400`}>|</span>
					<a
						href="/terms-of-service"
						className={`text-xs sm:text-sm underline hover:no-underline transition-colors duration-200 ${isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						Terms of Service
					</a>
					<span className={`hidden sm:inline text-gray-400`}>|</span>
					<a
						href="/pricing-policy"
						className={`text-xs sm:text-sm underline hover:no-underline transition-colors duration-200 ${isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						Pricing Policy
					</a>
					<span className={`hidden sm:inline text-gray-400`}>|</span>
					<a
						href="/shipping-policy"
						className={`text-xs sm:text-sm underline hover:no-underline transition-colors duration-200 ${isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						Shipping Policy
					</a>
					<span className={`hidden sm:inline text-gray-400`}>|</span>
					<a
						href="/cancellation-refund-policy"
						className={`text-xs sm:text-sm underline hover:no-underline transition-colors duration-200 ${isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						Cancellation/Refund Policy
					</a>
					<span className={`hidden sm:inline text-gray-400`}>|</span>
					<a
						href="/delete-user-data"
						className={`text-xs sm:text-sm underline hover:no-underline transition-colors duration-200 ${isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						User Data Deletion
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

// Plan Selection Modal Component
const PlanSelectionModal = ({ isOpen, onClose, selectedPlan, formData, setFormData, onSubmit, isDarkMode, isSubmitting, submitSuccess }) => {
	if (!isOpen) return null;

	// Handler for backdrop click
	const handleBackdropClick = (e) => {
		if (e.target === e.currentTarget && !isSubmitting) {
			onClose();
		}
	};

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4' onClick={handleBackdropClick}>
			<div
				className={`w-full max-w-md sm:max-w-md rounded-lg shadow-xl ${
					isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
				} mx-2 sm:mx-0`}
			>
				<div className='p-4 sm:p-6'>
					{/* Only show header and cross if not showing success message */}
					<div className='flex justify-between items-center mb-4'>
						<h3 className='text-base sm:text-lg font-semibold'>{submitSuccess ? 'Success' : `Select ${selectedPlan?.name} Plan`} </h3>
						<button onClick={onClose} className={`p-1 rounded-full hover:bg-opacity-20 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}>
							<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
							</svg>
						</button>
					</div>

					{submitSuccess ? (
						<div
							className={`mb-4 p-3 rounded text-center font-medium text-sm sm:text-base ${
								submitSuccess.startsWith('Thank') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
							}`}
						>
							{submitSuccess}
						</div>
					) : (
						<form onSubmit={onSubmit} className='space-y-3 sm:space-y-4'>
							<div>
								<label className='block text-xs sm:text-sm font-medium mb-1'>Name *</label>
								<input
									type='text'
									required
									value={formData.name}
									onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
									className={`w-full px-2 py-2 sm:px-3 sm:py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
										isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
									}`}
									placeholder='Enter your full name'
								/>
							</div>

							<div>
								<label className='block text-xs sm:text-sm font-medium mb-1'>Work Email *</label>
								<input
									type='email'
									required
									value={formData.email}
									onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
									className={`w-full px-2 py-2 sm:px-3 sm:py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
										isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
									}`}
									placeholder='Enter your work email'
								/>
							</div>

							<div>
								<label className='block text-xs sm:text-sm font-medium mb-1'>Mobile Number *</label>
								<input
									type='tel'
									required
									value={formData.mobile}
									onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
									className={`w-full px-2 py-2 sm:px-3 sm:py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
										isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
									}`}
									placeholder='Enter your mobile number'
								/>
							</div>

							<div>
								<label className='block text-xs sm:text-sm font-medium mb-1'>Selected Plan</label>
								<input
									type='text'
									value={formData.plan}
									readOnly
									className={`w-full px-2 py-2 sm:px-3 sm:py-2 border rounded-md bg-gray-100 text-gray-600 ${
										isDarkMode ? 'bg-gray-600 border-gray-500 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'
									}`}
								/>
							</div>

							<div className='flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4'>
								<button
									type='button'
									onClick={onClose}
									className={`w-full sm:w-auto py-2 px-4 border rounded-md font-medium transition-colors ${
										isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
									}`}
								>
									Cancel
								</button>
								<button
									type='submit'
									disabled={isSubmitting}
									className={`w-full sm:w-auto py-2 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center ${
										isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
									}`}
								>
									{isSubmitting ? (
										<svg
											className='animate-spin h-5 w-5 mr-2 text-white'
											xmlns='http://www.w3.org/2000/svg'
											fill='none'
											viewBox='0 0 24 24'
										>
											<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
											<path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'></path>
										</svg>
									) : null}
									{isSubmitting ? 'Submitting...' : 'Submit'}
								</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
};

// Privacy Policy Page Component
function PrivacyPolicy({ isDarkMode }) {
	return (
		<div className={`min-h-screen py-12 px-4 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

				<p className="mb-4">Effective Date: <strong>21 July 2025</strong></p>
				<p className="mb-6">NimbleAI is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website <a href="https://nimbleai.in" target="_blank" rel="noopener noreferrer" className="underline">nimbleai.in</a>, use our AI chat services, or interact with us through third-party platforms like WhatsApp and Instagram.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">1. Information We Collect</h2>
				<h3 className="text-lg font-semibold mt-4 mb-2">a. Personal Information</h3>
				<p>We may collect the following types of personal data:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>Name, email address, phone number</li>
					<li>Business information (e.g., company name, industry, website)</li>
					<li>Customer messages or inquiries sent via WhatsApp, Instagram, or web chat</li>
					<li>Account details for integration (e.g., Meta or WhatsApp Business API)</li>
				</ul>

				<h3 className="text-lg font-semibold mt-4 mb-2">b. Usage Data</h3>
				<p>We may automatically collect information about:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>How you interact with our services</li>
					<li>IP address, browser type, device identifiers</li>
					<li>Log data such as chat timestamps and message flow</li>
				</ul>

				<h3 className="text-lg font-semibold mt-4 mb-2">c. Customer Chat Data</h3>
				<p>For businesses using NimbleAI, we may process chat content for the purpose of improving service quality, training AI agents, and providing analytics.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">2. How We Use Your Information</h2>
				<p>We use the collected information to:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>Deliver and maintain our services</li>
					<li>Respond to inquiries and provide customer support</li>
					<li>Improve our AI performance and service capabilities</li>
					<li>Personalize experiences and communications</li>
					<li>Comply with legal obligations</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">3. Data Sharing and Disclosure</h2>
				<p>We <strong>do not sell your personal information</strong>. We may share your data with:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>Authorized service providers (e.g., cloud hosting, analytics)</li>
					<li>Platform APIs such as Meta (for WhatsApp/Instagram integration)</li>
					<li>Legal authorities if required by law or to protect our rights</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">4. Data Security</h2>
				<p>We implement industry-standard safeguards to protect your personal data, including:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>Secure hosting and encryption</li>
					<li>Access controls and regular audits</li>
					<li>API usage monitoring</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">5. Your Rights</h2>
				<p>Depending on your jurisdiction, you may have the right to:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>Access or correct your personal data</li>
					<li>Request deletion of your data</li>
					<li>Opt out of non-essential communication</li>
				</ul>
				<p>To exercise your rights, contact us at: <a href="mailto:contact@nimbleai.in" className="underline">contact@nimbleai.in</a></p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">6. Third-Party Services</h2>
				<p>Our website and chat services may link to third-party tools (e.g., Meta, WhatsApp). We are not responsible for the privacy practices of those platforms. Please refer to their privacy policies for more information.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">7. Children's Privacy</h2>
				<p>NimbleAI is not intended for use by individuals under the age of 13. We do not knowingly collect personal data from children.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">8. Changes to This Policy</h2>
				<p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with a revised "Effective Date."</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">9. Contact Us</h2>
				<p>If you have questions or concerns about this policy, please contact:</p>
				<div className="mb-8">
					<strong>NimbleAI</strong><br />
					📩 <a href="mailto:contact@nimbleai.in" className="underline">contact@nimbleai.in</a><br />
					🌐 <a href="https://nimbleai.in" target="_blank" rel="noopener noreferrer" className="underline">https://nimbleai.in</a>
				</div>
			</div>
		</div>
	);
}

// Add TermsOfService and UserDataDeletion page components
function TermsOfService({ isDarkMode }) {
	return (
		<div className={`min-h-screen py-12 px-4 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
				<p className="mb-4"><strong>Effective Date:</strong> 21 July 2025 </p>

				<p className="mb-4">Welcome to NimbleAI! These Terms of Service ("Terms") govern your access to and use of the NimbleAI website, platform, and services ("Service"). By using our Service, you agree to these Terms. If you do not agree, please do not use the Service.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">1. About NimbleAI</h2>
				<p className="mb-4">NimbleAI provides AI-powered customer support agents that integrate with messaging platforms like WhatsApp, Instagram, and websites to automate and accelerate customer interactions.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">2. Eligibility</h2>
				<p className="mb-4">You must be at least 18 years old and capable of entering into a binding agreement to use NimbleAI. By using our Service, you represent and warrant that you meet these requirements.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">3. Account Registration</h2>
				<p className="mb-4">You may need to create an account to use some features. You agree to provide accurate and complete information and to keep your account credentials secure. You are responsible for any activity that occurs under your account.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">4. Use of Service</h2>
				<p className="mb-2">You agree to use NimbleAI only for lawful purposes and in accordance with these Terms. You must not use our Service to:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>Violate any laws or regulations</li>
					<li>Infringe on any intellectual property rights</li>
					<li>Send spam, offensive, or unauthorized messages</li>
					<li>Interfere with or disrupt our systems</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">5. Data & Privacy</h2>
				<p className="mb-4">Your use of the Service is subject to our <a href="/privacy-policy" className="underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>. We collect and process your data to provide and improve the Service. You retain ownership of your data; we will not sell or misuse it.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">6. Intellectual Property</h2>
				<p className="mb-4">All content, code, and design elements of NimbleAI are the property of NimbleAI or its licensors. You may not copy, reproduce, or reverse-engineer any part of our platform without permission.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">7. Fees & Payments</h2>
				<p className="mb-4">Certain features of NimbleAI may require payment. By subscribing, you agree to the applicable fees, billing cycle, and payment terms. We reserve the right to change pricing with prior notice.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">8. Free Trial & Termination</h2>
				<p className="mb-4">We may offer a limited free trial. You or NimbleAI may terminate the service at any time. Upon termination, your access will be revoked, but your data will be handled according to our Privacy Policy.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">9. Third-Party Services</h2>
				<p className="mb-4">NimbleAI may integrate with platforms like Meta, OpenAI, or WhatsApp. We are not responsible for third-party services' performance or policies.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">10. Disclaimers</h2>
				<p className="mb-4">The Service is provided "as is" without warranties of any kind. We do not guarantee that it will always be secure, error-free, or available.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">11. Limitation of Liability</h2>
				<p className="mb-4">To the fullest extent permitted by law, NimbleAI is not liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">12. Changes to These Terms</h2>
				<p className="mb-4">We may update these Terms from time to time. We'll notify you of significant changes. Continued use of the Service after changes means you accept the new Terms.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">13. Governing Law</h2>
				<p className="mb-4">These Terms are governed by the laws of India. Any disputes shall be resolved in the courts of Indore, India.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">14. Contact Us</h2>
				<p className="mb-2">If you have questions, reach out to us at:</p>
				<ul className="list-disc list-inside mb-8 ml-4">
					<li>📩 <a href="mailto:contact@nimbleai.in" className="underline">contact@nimbleai.in</a></li>
					<li>🌐 <a href="https://nimbleai.in" target="_blank" rel="noopener noreferrer" className="underline">https://nimbleai.in</a></li>
				</ul>
			</div>
		</div>
	);
}

function UserDataDeletion({ isDarkMode }) {
	return (
		<div className={`min-h-screen py-12 px-4 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold mb-6">User Data Deletion Policy – NimbleAI</h1>

				<p className="mb-4">At NimbleAI, we take your privacy seriously and provide clear and simple ways for users and businesses to request deletion of their data.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">What Data Can Be Deleted?</h2>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>Personal contact details (name, email, phone)</li>
					<li>Chat logs or conversations collected by our AI agents</li>
					<li>Business-specific data uploaded to train agents (FAQs, product info, etc.)</li>
					<li>Account information, if you created a dashboard or admin account with us</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">How to Request Data Deletion</h2>
				<p className="mb-2">To delete your data from NimbleAI systems, simply email us with your request:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li><strong>Email:</strong> <a href="mailto:contact@nimbleai.in" className="underline">contact@nimbleai.in</a></li>
					<li><strong>Subject Line:</strong> Data Deletion Request</li>
					<li><strong>Required Info:</strong>
						<ul className="list-disc list-inside ml-4">
							<li>Your full name or business name</li>
							<li>The email or phone number associated with the data</li>
							<li>A brief description of what you'd like deleted</li>
						</ul>
					</li>
				</ul>
				<p className="mb-4">We aim to process all deletion requests within <strong>7 business days</strong>.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Important Notes</h2>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>Data deletion is <strong>permanent and cannot be undone</strong>.</li>
					<li>We may retain anonymized, non-personal usage data for analytics.</li>
					<li>If you're a business customer, deleting data may affect your chat agent's performance or training.</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Compliance</h2>
				<p className="mb-2">This policy is in line with:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>GDPR (General Data Protection Regulation – EU)</li>
					<li>CCPA (California Consumer Privacy Act – US)</li>
					<li>India's Draft DPDP Bill (Digital Personal Data Protection Bill)</li>
				</ul>

				<p className="mb-8">For further information, you can contact us at <a href="mailto:contact@nimbleai.in" className="underline">contact@nimbleai.in</a>.</p>
			</div>
		</div>
	);
}

function PricingPolicy({ isDarkMode }) {
	return (
		<div className={`min-h-screen py-12 px-4 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold mb-6">Pricing Policy – NimbleAI</h1>

				<p className="mb-4">This pricing policy outlines our commitment to transparent and fair pricing for all NimbleAI services.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Pricing Structure</h2>
				<p className="mb-4">Our pricing is based on usage and features. We offer flexible plans to accommodate businesses of all sizes:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li><strong>Free Tier:</strong> Basic features with limited usage</li>
					<li><strong>Pro Plan:</strong> Advanced features with higher usage limits</li>
					<li><strong>Enterprise Plan:</strong> Custom solutions for large organizations</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Price Changes</h2>
				<p className="mb-4">We reserve the right to modify our pricing at any time. However, we will:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>Provide at least 30 days notice for any price increases</li>
					<li>Honor existing pricing for current subscribers during their billing cycle</li>
					<li>Clearly communicate any changes through email and our website</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Billing and Payment</h2>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>All prices are in USD unless otherwise specified</li>
					<li>Billing occurs monthly or annually based on your selected plan</li>
					<li>Payment is due in advance for each billing period</li>
					<li>We accept major credit cards and other payment methods as available</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Taxes</h2>
				<p className="mb-4">All prices are exclusive of applicable taxes. You are responsible for any taxes, duties, or fees imposed by your local jurisdiction.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Contact</h2>
				<p className="mb-8">For questions about pricing, please contact us at <a href="mailto:contact@nimbleai.in" className="underline">contact@nimbleai.in</a>.</p>
			</div>
		</div>
	);
}

function ShippingPolicy({ isDarkMode }) {
	return (
		<div className={`min-h-screen py-12 px-4 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold mb-6">Shipping Policy – NimbleAI</h1>

				<p className="mb-4">Since NimbleAI provides digital services and software solutions, this policy covers the delivery and activation of our services.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Digital Service Delivery</h2>
				<p className="mb-4">Our services are delivered digitally and include:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>AI chatbot setup and configuration</li>
					<li>Integration with your existing platforms (WhatsApp, website, etc.)</li>
					<li>Training and onboarding support</li>
					<li>Access to our dashboard and analytics</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Service Activation Timeline</h2>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li><strong>Free Tier:</strong> Immediate activation upon signup</li>
					<li><strong>Pro Plan:</strong> Setup within 24-48 hours of payment confirmation</li>
					<li><strong>Enterprise Plan:</strong> Custom timeline based on requirements (typically 1-2 weeks)</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Delivery Method</h2>
				<p className="mb-4">All services are delivered through:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>Email notifications with setup instructions</li>
					<li>Access credentials sent to your registered email</li>
					<li>Dashboard access provided immediately upon activation</li>
					<li>Integration links and API keys delivered securely</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Support and Onboarding</h2>
				<p className="mb-4">We provide comprehensive support to ensure successful service delivery:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>Setup assistance via email and chat support</li>
					<li>Documentation and tutorials</li>
					<li>Training sessions for Pro and Enterprise customers</li>
					<li>Ongoing technical support</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Contact</h2>
				<p className="mb-8">For questions about service delivery, please contact us at <a href="mailto:contact@nimbleai.in" className="underline">contact@nimbleai.in</a>.</p>
			</div>
		</div>
	);
}

function CancellationRefundPolicy({ isDarkMode }) {
	return (
		<div className={`min-h-screen py-12 px-4 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold mb-6">Cancellation & Refund Policy – NimbleAI</h1>

				<p className="mb-4">This policy outlines the terms and conditions for canceling your NimbleAI subscription and requesting refunds.</p>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Cancellation Policy</h2>
				<p className="mb-4">You may cancel your subscription at any time:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li><strong>Free Tier:</strong> No cancellation required - simply stop using the service</li>
					<li><strong>Pro Plan:</strong> Cancel through your dashboard or by contacting support</li>
					<li><strong>Enterprise Plan:</strong> Contact your account manager or support team</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Refund Policy</h2>
				<p className="mb-4">We offer refunds under the following conditions:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li><strong>30-Day Money-Back Guarantee:</strong> Full refund within 30 days of initial purchase</li>
					<li><strong>Pro-rated Refunds:</strong> For annual subscriptions, refunds are calculated based on unused months</li>
					<li><strong>Service Issues:</strong> Refunds for technical problems we cannot resolve</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Refund Process</h2>
				<p className="mb-2">To request a refund:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>Email us at <a href="mailto:contact@nimbleai.in" className="underline">contact@nimbleai.in</a></li>
					<li>Include your account details and reason for refund</li>
					<li>We will process your request within 5-7 business days</li>
					<li>Refunds will be issued to the original payment method</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Non-Refundable Items</h2>
				<p className="mb-4">The following are not eligible for refunds:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>Usage-based charges already incurred</li>
					<li>Custom development work completed</li>
					<li>Third-party integration costs</li>
					<li>Services used beyond the 30-day guarantee period</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Service Termination</h2>
				<p className="mb-4">Upon cancellation or refund:</p>
				<ul className="list-disc list-inside mb-4 ml-4">
					<li>Your service will remain active until the end of your current billing period</li>
					<li>Data will be retained for 30 days after termination</li>
					<li>You may export your data before the retention period expires</li>
					<li>After 30 days, all data will be permanently deleted</li>
				</ul>

				<h2 className="text-2xl font-semibold mt-8 mb-3">Contact</h2>
				<p className="mb-8">For questions about cancellations or refunds, please contact us at <a href="mailto:contact@nimbleai.in" className="underline">contact@nimbleai.in</a>.</p>
			</div>
		</div>
	);
}

export default App;
