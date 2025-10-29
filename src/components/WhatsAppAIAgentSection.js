import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { signInWithGoogleLambda } from '../services/authService';

const WhatsAppAIAgentSection = ({ isDarkMode }) => {
	const [isVisible, setIsVisible] = useState(false);
	const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
	const sectionRef = useRef(null);
	const { user } = useAuth();

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
				}
			},
			{ threshold: 0.1 }
		);

		if (sectionRef.current) {
			observer.observe(sectionRef.current);
		}

		return () => {
			if (sectionRef.current) {
				observer.unobserve(sectionRef.current);
			}
		};
	}, []);

	const handleGoogleSignIn = async () => {
		setIsGoogleSigningIn(true);
		try {
			// Add timeout to handle case where user cancels popup
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Sign-in cancelled or timed out')), 10000); // 5 second timeout
			});
			
			await Promise.race([signInWithGoogleLambda(), timeoutPromise]);
			// PublicRoute will automatically redirect to dashboard
		} catch (error) {
			console.error('Google sign in error:', error);
			// Reset the signing in state on any error (including cancellation)
			setIsGoogleSigningIn(false);
		}
	};

	return (
		<section
			id="whatsapp-ai-agent-section"
			ref={sectionRef}
			className={`py-16 px-4 transition-opacity duration-1000 ${
				isVisible ? 'opacity-100' : 'opacity-0'
			} ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
		>
			<div className="max-w-6xl mx-auto">
				<div className="text-center mb-12">
					<h2
						className={`text-3xl sm:text-4xl font-bold mb-4 ${
							isDarkMode ? 'text-gray-100' : 'text-gray-900'
						}`}
					>
						WhatsApp AI Agent
					</h2>
					<p
						className={`text-lg sm:text-xl max-w-3xl mx-auto ${
							isDarkMode ? 'text-gray-300' : 'text-gray-600'
						}`}
					>
						Transform your WhatsApp Business into a 24/7 intelligent customer service
						powerhouse. Our AI agent handles inquiries, provides instant responses,
						and escalates complex issues seamlessly.
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
					{/* Left side - Features */}
					<div className="space-y-6">
						<div
							className={`p-6 rounded-xl shadow-lg ${
								isDarkMode ? 'bg-gray-700' : 'bg-white'
							}`}
						>
							<div className="flex items-center mb-4">
								<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
									<svg
										className="w-6 h-6 text-green-600"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
									</svg>
								</div>
								<h3
									className={`text-xl font-semibold ${
										isDarkMode ? 'text-gray-100' : 'text-gray-900'
									}`}
								>
									Instant Responses
								</h3>
							</div>
							<p
								className={`${
									isDarkMode ? 'text-gray-300' : 'text-gray-600'
								}`}
							>
								Your customers get immediate, accurate answers to their questions
								without waiting for business hours.
							</p>
						</div>

						<div
							className={`p-6 rounded-xl shadow-lg ${
								isDarkMode ? 'bg-gray-700' : 'bg-white'
							}`}
						>
							<div className="flex items-center mb-4">
								<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
									<svg
										className="w-6 h-6 text-blue-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</div>
								<h3
									className={`text-xl font-semibold ${
										isDarkMode ? 'text-gray-100' : 'text-gray-900'
									}`}
								>
									Smart Escalation
								</h3>
							</div>
							<p
								className={`${
									isDarkMode ? 'text-gray-300' : 'text-gray-600'
								}`}
							>
								Complex queries are automatically escalated to human agents when
								needed, ensuring no customer is left behind.
							</p>
						</div>

						<div
							className={`p-6 rounded-xl shadow-lg ${
								isDarkMode ? 'bg-gray-700' : 'bg-white'
							}`}
						>
							<div className="flex items-center mb-4">
								<div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
									<svg
										className="w-6 h-6 text-purple-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M13 10V3L4 14h7v7l9-11h-7z"
										/>
									</svg>
								</div>
								<h3
									className={`text-xl font-semibold ${
										isDarkMode ? 'text-gray-100' : 'text-gray-900'
									}`}
								>
									24/7 Availability
								</h3>
							</div>
							<p
								className={`${
									isDarkMode ? 'text-gray-300' : 'text-gray-600'
								}`}
							>
								Never miss a customer inquiry. Our AI agent works around the
								clock to provide consistent support.
							</p>
						</div>
					</div>

					{/* Right side - Demo/Visual */}
					<div className="relative">
						<div
							className={`p-6 rounded-2xl shadow-2xl ${
								isDarkMode ? 'bg-gray-700' : 'bg-white'
							}`}
						>
							<div className="flex items-center mb-4">
								<div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
									<svg
										className="w-6 h-6 text-white"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
									</svg>
								</div>
								<div>
									<h4
										className={`font-semibold ${
											isDarkMode ? 'text-gray-100' : 'text-gray-900'
										}`}
									>
										WhatsApp Business
									</h4>
									<p
										className={`text-sm ${
											isDarkMode ? 'text-gray-400' : 'text-gray-500'
										}`}
									>
										AI Agent Active
									</p>
								</div>
							</div>

							{/* Chat messages simulation */}
							<div className="space-y-3">
								<div className="flex justify-end">
									<div
										className={`max-w-xs px-4 py-2 rounded-lg ${
											isDarkMode
												? 'bg-green-600 text-white'
												: 'bg-green-500 text-white'
										}`}
									>
										<p className="text-sm">
											Hi! I need help with my order status
										</p>
									</div>
								</div>

								<div className="flex justify-start">
									<div
										className={`max-w-xs px-4 py-2 rounded-lg ${
											isDarkMode
												? 'bg-gray-600 text-gray-100'
												: 'bg-gray-200 text-gray-800'
										}`}
									>
										<p className="text-sm">
											Hello! I'd be happy to help you check your order status.
											Could you please provide your order number?
										</p>
									</div>
								</div>

								<div className="flex justify-end">
									<div
										className={`max-w-xs px-4 py-2 rounded-lg ${
											isDarkMode
												? 'bg-green-600 text-white'
												: 'bg-green-500 text-white'
										}`}
									>
										<p className="text-sm">#12345</p>
									</div>
								</div>

								<div className="flex justify-start">
									<div
										className={`max-w-xs px-4 py-2 rounded-lg ${
											isDarkMode
												? 'bg-gray-600 text-gray-100'
												: 'bg-gray-200 text-gray-800'
										}`}
									>
										<p className="text-sm">
											Thank you! Your order #12345 is currently being
											processed and will be shipped within 2-3 business days.
											You'll receive a tracking number via email.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* CTA Section */}
				<div className="text-center mt-12">
					<button
						onClick={handleGoogleSignIn}
						disabled={isGoogleSigningIn}
						className={`px-8 py-4 rounded-full font-semibold text-lg shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
							isDarkMode
								? 'bg-green-600 text-white hover:bg-green-700'
								: 'bg-green-600 text-white hover:bg-green-700'
						}`}
					>
						{isGoogleSigningIn ? 'Signing in...' : 'Get Started with WhatsApp AI Agent'}
					</button>
				</div>
			</div>
		</section>
	);
};

export default WhatsAppAIAgentSection;

