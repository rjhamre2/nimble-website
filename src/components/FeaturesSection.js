import React from 'react';
import ComparisonSection from './ComparisonSection';
import { CheckCircle, Clock, DollarSign, Globe, MessageCircle, LineChart } from 'lucide-react';

const FeaturesSection = ({ isDarkMode }) => {
  const sectionBg = isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const cardBg = isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-50 text-gray-800';
  const iconColor = isDarkMode ? 'text-green-400' : 'text-green-600';

  const features = [
    {
      icon: <CheckCircle className={`w-5 h-5 ${iconColor}`} />,
      text: 'Instant Support: Handle 80% of queries instantly, cutting wait time by 60%',
    },
    {
      icon: <Clock className={`w-5 h-5 ${iconColor}`} />,
      text: '24/7 Availability: Provide support around the clock',
    },
    {
      icon: <DollarSign className={`w-5 h-5 ${iconColor}`} />,
      text: 'Cost Efficiency: Reduce support expenses by 70%',
    },
    {
      icon: <Globe className={`w-5 h-5 ${iconColor}`} />,
      text: 'Multilingual Capability: Serve customers worldwide',
    },
    {
      icon: <MessageCircle className={`w-5 h-5 ${iconColor}`} />,
      text: 'Human-like Interaction: Escalate complex issues',
    },
    {
      icon: <LineChart className={`w-5 h-5 ${iconColor}`} />,
      text: 'Customer Insights: Real-time analytics',
    },
  ];

  return (
    <section className={`py-20 ${sectionBg}`}>
      <div className='container mx-auto px-6 flex flex-col md:flex-row items-center gap-12 justify-center'>
        {/* Chat Mockup */}
        <ComparisonSection isDarkMode={isDarkMode} />
        {/* Text Content */}
        <div className='w-full md:w-1/2'>
          <h2 className='text-3xl sm:text-4xl font-bold mb-4 leading-snug'>
            Assist customers on their journeys with <span className='text-blue-600'>Live Chat</span>
          </h2>
          <p className='mb-6 text-base sm:text-lg'>
            Offer a clear route for customer questions and provide immediate answers through a lightweight live chat widget.
          </p>
          <ul className='space-y-4'>
            {features.map((feature, index) => (
              <li key={index} className='flex items-start gap-3'>
                {feature.icon}
                <span>{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 