import React, { useState, useEffect, useRef } from "react";

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
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
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
       .animate-fadeIn {
         animation: fadeIn 0.8s ease-out forwards;
       }
       .animate-slideInUp {
         animation: slideInUp 0.8s ease-out forwards;
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

      {/* Navbar Component */}
      <Navbar />
      {/* Hero Section Component */}
      <HeroSection />
      {/* Features Section Component */}
      <FeaturesSection />
      {/* About Section Component */}
      <AboutSection />
      {/* Comparison Section Component */}
      <ComparisonSection />
      {/* FAQ Section Component */}
      <FAQSection />
      {/* Footer Component */}
      <Footer />
    </div>
  );
}

// Navbar Component - Updated for Black & White theme with centered logo and new name
function Navbar() {
  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-200 animate-fadeIn">
      <div className="container mx-auto px-4 py-4 flex justify-center items-center">
        {" "}
        {/* Changed to justify-center */}
        {/* Logo - Updated to Nimble AI and centered */}
        <a href="#" className="flex items-center space-x-2">
          <img
            src={require("./logo.png")}
            alt="Nimble AI Logo"
            className="h-12 w-auto object-contain"
          />
          {/* <span className="text-2xl font-bold text-gray-900">Nimble AI</span> */}
        </a>
      </div>
    </nav>
  );
}

// Hero Section Component - Updated for Black & White theme with animations and centered content
function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-white to-gray-50 py-12 md:py-16 overflow-hidden relative px-4">
      {" "}
      {/* Adjusted py and added px for mobile */}
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
        {" "}
        {/* Adjusted gap */}
        {/* Content */}
        <div className="md:w-1/2 text-center z-10 animate-slideInUp">
          {" "}
          {/* Removed md:text-left */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-4 sm:mb-6">
            {" "}
            {/* Adjusted font sizes for responsiveness */}
            Empower Your Business <br className="hidden sm:inline" /> with
            Nimble AI
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-6 sm:mb-8 max-w-xl mx-auto">
            {" "}
            {/* Adjusted font sizes for responsiveness */}
            Nimble AI is here to revolutionize your business with our advanced
            AI-powered solutions.
          </p>
          {/* Email Input with Integrated Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center w-full max-w-md mx-auto rounded-full border border-gray-300 overflow-hidden shadow-lg bg-white">
            <input
              type="email"
              placeholder="Your Email"
              className="flex-grow px-4 py-2 sm:px-5 sm:py-3 bg-white focus:outline-none text-gray-900 w-full sm:w-auto rounded-t-full sm:rounded-l-full sm:rounded-tr-none" // Adjusted padding and rounding for mobile
            />
            <button className="px-6 py-3 bg-gray-900 text-white font-bold hover:bg-gray-700 transition duration-300 flex items-center justify-center gap-2 m-2 rounded-full">
              Contact Us
              {/* Simple arrow icon */}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Wavy background effect (simplified with a large, rotated div) - Grayscale */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gray-100 transform rotate-6 -translate-y-1/2 opacity-50 hidden md:block animate-fadeIn animate-delay-300"></div>
      <div className="absolute top-0 right-0 w-full h-1/2 bg-gray-200 transform -rotate-12 translate-y-1/2 opacity-30 hidden md:block animate-fadeIn animate-delay-400"></div>
    </section>
  );
}

// Features Section Component - Updated for Black & White theme with NEW creative icons
function FeaturesSection() {
  const [featuresRef, featuresVisible] = useIntersectionObserver({
    threshold: 0.1,
  });

  const features = [
    {
      icon: (
        <svg
          fill="currentColor"
          className="w-10 h-10 sm:w-12 sm:h-12 text-gray-700"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
        >
          <path d="M256 48C141.1 48 48 141.1 48 256l0 40c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-40C0 114.6 114.6 0 256 0S512 114.6 512 256l0 144.1c0 48.6-39.4 88-88.1 88L313.6 488c-8.3 14.3-23.8 24-41.6 24l-32 0c-26.5 0-48-21.5-48-48s21.5-48 48-48l32 0c17.8 0 33.3 9.7 41.6 24l110.4 .1c22.1 0 40-17.9 40-40L464 256c0-114.9-93.1-208-208-208zM144 208l16 0c17.7 0 32 14.3 32 32l0 112c0 17.7-14.3 32-32 32l-16 0c-35.3 0-64-28.7-64-64l0-48c0-35.3 28.7-64 64-64zm224 0c35.3 0 64 28.7 64 64l0 48c0 35.3-28.7 64-64 64l-16 0c-17.7 0-32-14.3-32-32l0-112c0-17.7 14.3-32 32-32l16 0z" />
        </svg>
      ),
      title: "AI Customer Support Service",
      description: [
        {
          text: "Instant Support: Resolve up to 80% of queries instantly while cutting response times by 60%",
          icon: (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {" "}
              {/* Adjusted icon size */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          ),
        },
        {
          text: "Cost Efficiency: Reduce support costs by 70% through automation and 24/7 availability",
          icon: (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {" "}
              {/* Adjusted icon size */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
          ),
        },
        {
          text: "Customer Satisfaction: Boost engagement by 50% and achieve over 90% satisfaction rates",
          icon: (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {" "}
              {/* Adjusted icon size */}
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14h-2V8h2v8zm3 0h-2V8h2v8zm3 0h-2V8h2v8z" />
            </svg>
          ),
        },
        // {
        //   text: "Increase customer engagement by 50%",
        //   icon: (
        //     <svg
        //       className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
        //       fill="currentColor"
        //       viewBox="0 0 24 24"
        //       xmlns="http://www.w3.org/2000/svg"
        //     >
        //       {" "}
        //       {/* Adjusted icon size */}
        //       <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM12 6l-1.5 3L6 10.5l4.5 1.5L12 16l1.5-3L18 10.5l-4.5-1.5L12 6z" />
        //     </svg>
        //   ),
        // },
        // {
        //   text: "Operate 24/7 for continuous support",
        //   icon: (
        //     <svg
        //       className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
        //       fill="none"
        //       stroke="currentColor"
        //       viewBox="0 0 24 24"
        //       xmlns="http://www.w3.org/2000/svg"
        //     >
        //       {" "}
        //       {/* Adjusted icon size */}
        //       <path
        //         strokeLinecap="round"
        //         strokeLinejoin="round"
        //         strokeWidth="2"
        //         d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        //       ></path>
        //     </svg>
        //   ),
        // },
        // {
        //   text: "Achieve 90%+ customer satisfaction rates",
        //   icon: (
        //     <svg
        //       className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
        //       fill="none"
        //       stroke="currentColor"
        //       viewBox="0 0 24 24"
        //       xmlns="http://www.w3.org/2000/svg"
        //     >
        //       {" "}
        //       {/* Adjusted icon size */}
        //       <path
        //         strokeLinecap="round"
        //         strokeLinejoin="round"
        //         strokeWidth="2"
        //         d="M14 10h.01M17 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0zM7 16s1.5 2 5 2 5-2 5-2"
        //       ></path>
        //     </svg>
        //   ),
        // },
      ],
    },
    {
      icon: (
        <svg
          fill="currentColor"
          className="w-10 h-10 sm:w-12 sm:h-12 text-gray-700"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 512"
        >
          <path d="M144 160A80 80 0 1 0 144 0a80 80 0 1 0 0 160zm368 0A80 80 0 1 0 512 0a80 80 0 1 0 0 160zM0 298.7C0 310.4 9.6 320 21.3 320l213.3 0c.2 0 .4 0 .7 0c-26.6-23.5-43.3-57.8-43.3-96c0-7.6 .7-15 1.9-22.3c-13.6-6.3-28.7-9.7-44.6-9.7l-42.7 0C47.8 192 0 239.8 0 298.7zM320 320c24 0 45.9-8.8 62.7-23.3c2.5-3.7 5.2-7.3 8-10.7c2.7-3.3 5.7-6.1 9-8.3C410 262.3 416 243.9 416 224c0-53-43-96-96-96s-96 43-96 96s43 96 96 96zm65.4 60.2c-10.3-5.9-18.1-16.2-20.8-28.2l-103.2 0C187.7 352 128 411.7 128 485.3c0 14.7 11.9 26.7 26.7 26.7l300.6 0c-2.1-5.2-3.2-10.9-3.2-16.4l0-3c-1.3-.7-2.7-1.5-4-2.3l-2.6 1.5c-16.8 9.7-40.5 8-54.7-9.7c-4.5-5.6-8.6-11.5-12.4-17.6l-.1-.2-.1-.2-2.4-4.1-.1-.2-.1-.2c-3.4-6.2-6.4-12.6-9-19.3c-8.2-21.2 2.2-42.6 19-52.3l2.7-1.5c0-.8 0-1.5 0-2.3s0-1.5 0-2.3l-2.7-1.5zM533.3 192l-42.7 0c-15.9 0-31 3.5-44.6 9.7c1.3 7.2 1.9 14.7 1.9 22.3c0 17.4-3.5 33.9-9.7 49c2.5 .9 4.9 2 7.1 3.3l2.6 1.5c1.3-.8 2.6-1.6 4-2.3l0-3c0-19.4 13.3-39.1 35.8-42.6c7.9-1.2 16-1.9 24.2-1.9s16.3 .6 24.2 1.9c22.5 3.5 35.8 23.2 35.8 42.6l0 3c1.3 .7 2.7 1.5 4 2.3l2.6-1.5c16.8-9.7 40.5-8 54.7 9.7c2.3 2.8 4.5 5.8 6.6 8.7c-2.1-57.1-49-102.7-106.6-102.7zm91.3 163.9c6.3-3.6 9.5-11.1 6.8-18c-2.1-5.5-4.6-10.8-7.4-15.9l-2.3-4c-3.1-5.1-6.5-9.9-10.2-14.5c-4.6-5.7-12.7-6.7-19-3l-2.9 1.7c-9.2 5.3-20.4 4-29.6-1.3s-16.1-14.5-16.1-25.1l0-3.4c0-7.3-4.9-13.8-12.1-14.9c-6.5-1-13.1-1.5-19.9-1.5s-13.4 .5-19.9 1.5c-7.2 1.1-12.1 7.6-12.1 14.9l0 3.4c0 10.6-6.9 19.8-16.1 25.1s-20.4 6.6-29.6 1.3l-2.9-1.7c-6.3-3.6-14.4-2.6-19 3c-3.7 4.6-7.1 9.5-10.2 14.6l-2.3 3.9c-2.8 5.1-5.3 10.4-7.4 15.9c-2.6 6.8 .5 14.3 6.8 17.9l2.9 1.7c9.2 5.3 13.7 15.8 13.7 26.4s-4.5 21.1-13.7 26.4l-3 1.7c-6.3 3.6-9.5 11.1-6.8 17.9c2.1 5.5 4.6 10.7 7.4 15.8l2.4 4.1c3 5.1 6.4 9.9 10.1 14.5c4.6 5.7 12.7 6.7 19 3l2.9-1.7c9.2-5.3 20.4-4 29.6 1.3s16.1 14.5 16.1 25.1l0 3.4c0 7.3 4.9 13.8 12.1 14.9c6.5 1 13.1 1.5 19.9 1.5s13.4-.5 19.9-1.5c7.2-1.1 12.1-7.6 12.1-14.9l0-3.4c0-10.6 6.9-19.8 16.1-25.1s20.4-6.6 29.6-1.3l2.9 1.7c6.3 3.6 14.4 2.6 19-3c3.7-4.6 7.1-9.4 10.1-14.5l2.4-4.2c2.8-5.1 5.3-10.3 7.4-15.8c2.6-6.8-.5-14.3-6.8-17.9l-3-1.7c-9.2-5.3-13.7-15.8-13.7-26.4s4.5-21.1 13.7-26.4l3-1.7zM472 384a40 40 0 1 1 80 0 40 40 0 1 1 -80 0z" />
        </svg>
      ),
      title: "Agentic workflows",
      description: [
        // {
        //   text: "Streamline operations by 75%",
        //   icon: (
        //     <svg
        //       className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
        //       fill="none"
        //       stroke="currentColor"
        //       viewBox="0 0 24 24"
        //       xmlns="http://www.w3.org/2000/svg"
        //     >
        //       {" "}
        //       {/* Adjusted icon size */}
        //       <path
        //         strokeLinecap="round"
        //         strokeLinejoin="round"
        //         strokeWidth="2"
        //         d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        //       ></path>
        //     </svg>
        //   ),
        // },
        {
          text: "Boost Efficiency: Streamline operations by 75% and accelerate task completion by 50%",
          icon: (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {" "}
              {/* Adjusted icon size */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          ),
        },
        {
          text: "Enhance Accuracy & Insight: Reduce manual errors by 90% and make smarter decisions with real-time insights",
          icon: (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {" "}
              {/* Adjusted icon size */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              ></path>
            </svg>
          ),
        },
        {
          text: "Adapt & Optimize: Dynamically respond to business changes while improving resource allocations",
          icon: (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {" "}
              {/* Adjusted icon size */}
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
          ),
        },
        // {
        //   text: "Adapt dynamically to changing business needs",
        //   icon: (
        //     <svg
        //       className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
        //       fill="none"
        //       stroke="currentColor"
        //       viewBox="0 0 24 24"
        //       xmlns="http://www.w3.org/2000/svg"
        //     >
        //       {" "}
        //       {/* Adjusted icon size */}
        //       <path
        //         strokeLinecap="round"
        //         strokeLinejoin="round"
        //         strokeWidth="2"
        //         d="M4 4v5h.582m15.356-2A8.964 8.964 0 0120 12c0 4.97-4.03 9-9 9a9 9 0 01-8.63-6H4c0 3.31 2.69 6 6 6s6-2.69 6-6-2.69-6-6-6h-.582m.582 0H16"
        //       ></path>
        //     </svg>
        //   ),
        // },
        // {
        //   text: "Improve resource allocation efficiency",
        //   icon: (
        //     <svg
        //       className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
        //       fill="currentColor"
        //       viewBox="0 0 24 24"
        //       xmlns="http://www.w3.org/2000/svg"
        //     >
        //       {" "}
        //       {/* Adjusted icon size */}
        //       <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14H8V8h2v8zm3 0h-2V8h2v8zm3 0h-2V8h2v8z" />
        //     </svg>
        //   ),
        // },
      ],
    },
    {
      icon: (
        <svg
          className="w-10 h-10 sm:w-12 sm:h-12 text-gray-700"
          viewBox="0 0 512 512"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M176 24c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40c-35.3 0-64 28.7-64 64l-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0 0 56-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0 0 56-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0c0 35.3 28.7 64 64 64l0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40 56 0 0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40 56 0 0 40c0 13.3 10.7 24 24 24s24-10.7 24-24l0-40c35.3 0 64-28.7 64-64l40 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-40 0 0-56 40 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-40 0 0-56 40 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-40 0c0-35.3-28.7-64-64-64l0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40-56 0 0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40-56 0 0-40zM160 128l192 0c17.7 0 32 14.3 32 32l0 192c0 17.7-14.3 32-32 32l-192 0c-17.7 0-32-14.3-32-32l0-192c0-17.7 14.3-32 32-32zm192 32l-192 0 0 192 192 0 0-192z"/></svg>
      ),
      title: "Intelligent Business Logic",
      description: [
        // {
        //   text: "Automate decision-making processes by 60%",
        //   icon: (
        //     <svg
        //       className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
        //       fill="none"
        //       stroke="currentColor"
        //       viewBox="0 0 24 24"
        //       xmlns="http://www.w3.org/2000/svg"
        //     >
        //       {" "}
        //       {/* Adjusted icon size */}
        //       <path
        //         strokeLinecap="round"
        //         strokeLinejoin="round"
        //         strokeWidth="2"
        //         d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M12 16h.01"
        //       ></path>
        //     </svg>
        //   ),
        // },
        {
          text: "Smarter Decisions: Automate decision-making by 60% and improve data accuracy by 95%",
          icon: (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {" "}
              {/* Adjusted icon size */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          ),
        },
        {
          text: "Cost & Resource Optimization: Cut operational costs by 30% and enhance resource allocation by 25%",
          icon: (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {" "}
              {/* Adjusted icon size */}
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14h-2V8h2v8zm3 0h-2V8h2v8zm3 0h-2V8h2v8z" />
            </svg>
          ),
        },
        {
          text: "Future-Ready Intelligence: Continuously adapt to market changes and boost predictive capabilities for better forecasting",
          icon: (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {" "}
              {/* Adjusted icon size */}
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14H8V8h2v8zm3 0h-2V8h2v8zm3 0h-2V8h2v8z" />
            </svg>
          ),
        },
        // {
        //   text: "Ensure continuous adaptation to market changes",
        //   icon: (
        //     <svg
        //       className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
        //       fill="none"
        //       stroke="currentColor"
        //       viewBox="0 0 24 24"
        //       xmlns="http://www.w3.org/2000/svg"
        //     >
        //       {" "}
        //       {/* Adjusted icon size */}
        //       <path
        //         strokeLinecap="round"
        //         strokeLinejoin="round"
        //         strokeWidth="2"
        //         d="M4 4v5h.582m15.356-2A8.964 8.964 0 0120 12c0 4.97-4.03 9-9 9a9 9 0 01-8.63-6H4c0 3.31 2.69 6 6 6s6-2.69 6-6-2.69-6-6-6h-.582m.582 0H16"
        //       ></path>
        //     </svg>
        //   ),
        // },
        // {
        //   text: "Enhance predictive capabilities for future trends",
        //   icon: (
        //     <svg
        //       className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0"
        //       fill="currentColor"
        //       viewBox="0 0 24 24"
        //       xmlns="http://www.w3.org/2000/svg"
        //     >
        //       {" "}
        //       {/* Adjusted icon size */}
        //       <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        //     </svg>
        //   ),
        // },
      ],
    },
  ];

  return (
    <section
      ref={featuresRef}
      className={`py-12 pb-20 bg-white transition-opacity duration-1000 ${
        featuresVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {" "}
      {/* Adjusted padding */}
      <div className="container mx-auto px-4 text-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {" "}
          {/* Adjusted gap */}
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Feature Card Component - Adjusted for Black & White theme with animation
const FeatureCard = ({ icon, title, description, delay }) => (
  <div
    className={`bg-white p-6 sm:p-8  rounded-xl shadow-lg border border-gray-200 flex flex-col items-center justify-center text-center animate-slideInUp`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {" "}
    {/* Adjusted padding */}
    <div className="mb-3 sm:mb-4 flex justify-center">{icon}</div>{" "}
    {/* Adjusted margin */}
    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
      {title}
    </h3>{" "}
    {/* Adjusted font size and margin */}
    {Array.isArray(description) ? (
      <ul className="text-gray-600 list-none p-0 m-0 space-y-1 sm:space-y-2 text-left">
        {" "}
        {/* Adjusted spacing */}
        {description.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5 sm:gap-2">
            {" "}
            {/* Adjusted gap */}
            {item.icon}
            <span className="text-xs sm:text-sm">{item.text}</span>{" "}
            {/* Adjusted font size */}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-gray-600 text-sm sm:text-base">
        {description}
      </p> /* Adjusted font size */
    )}
  </div>
);

// About Section Component (existing) with animations and centered content
function AboutSection() {
  const [aboutRef, aboutVisible] = useIntersectionObserver({ threshold: 0.1 });

  return (
    <section
      ref={aboutRef}
      className={`py-12 sm:py-20 bg-gray-50 transition-opacity duration-1000 ${
        aboutVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {" "}
      {/* Adjusted padding */}
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
        {" "}
        {/* Adjusted gap */}
        <div className="md:w-1/2 text-center animate-slideInUp">
          <span className="inline-block bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium px-2 py-0.5 sm:px-3 sm:py-1 rounded-full mb-4 sm:mb-6">
            {" "}
            {/* Adjusted font size and padding */}
            About Nimble AI
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4 sm:mb-6">
            {" "}
            {/* Adjusted font sizes */}
            Nimble AI empowers your business with cutting-edge AI solutions,
            driving unparalleled efficiency and strategic advantage.
          </h2>
          <p className="text-sm sm:text-lg text-gray-700 mb-6 sm:mb-8 max-w-xl mx-auto">
            {" "}
            {/* Adjusted font sizes */}
            At Nimble AI, we harness the power of advanced artificial
            intelligence to drive business transformation. Our cutting-edge
            solutions: Elevate customer support with intelligent, responsive
            systems Automate complex workflows to boost efficiency and reduce
            manual effort Implement intelligent business logic for smarter,
            faster decision-making Founded by IIT Bombay alumni with over 8
            years of deep expertise in AI, machine learning, and related
            domains, our team combines technical excellence with real-world
            insights. This ensures Nimble AI consistently delivers
            forward-thinking, impactful innovations that keep our clients ahead
            of the curve.
          </p>
        </div>
        <div className="md:w-1/2 grid grid-cols-1 gap-4 sm:gap-6 animate-fadeIn animate-delay-200 max-w-xs sm:max-w-sm mx-auto">
          {" "}
          {/* Adjusted gap and max-width */}
          <InfoCard title="Beta Access:" value="Q2, 2025" />
          <InfoCard title="Implementation:" value="Founder-led Onboarding" />
          <InfoCard
            title="Free Trial:"
            value="One month free"
            icon={
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {" "}
                {/* Adjusted icon size */}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V4m0 12v4m-6-2h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
            }
          />
        </div>
      </div>
    </section>
  );
}

// Reusable Info Card Component for About Section (existing)
const InfoCard = ({ title, value, icon }) => (
  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200 flex items-center justify-between animate-slideInUp">
    {" "}
    {/* Adjusted padding */}
    <div className="flex items-center gap-1.5 sm:gap-2">
      {" "}
      {/* Adjusted gap */}
      {icon}
      <span className="text-sm sm:text-base text-gray-700 font-medium">
        {title}
      </span>{" "}
      {/* Adjusted font size */}
    </div>
    <span className="text-sm sm:text-base text-gray-900 font-semibold">
      {value}
    </span>{" "}
    {/* Adjusted font size */}
  </div>
);

// Comparison Section Component (existing) with animations
function ComparisonSection() {
  const [comparisonRef, comparisonVisible] = useIntersectionObserver({
    threshold: 0.1,
  });

  return (
    <section
      ref={comparisonRef}
      className={`py-12 sm:py-20 bg-white transition-opacity duration-1000 ${
        comparisonVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {" "}
      {/* Adjusted padding */}
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-8 sm:mb-12 animate-slideInUp">
          Nimble AI in Action
        </h2>{" "}
        {/* Adjusted font sizes and margin */}
        <div className="flex flex-col lg:flex-row justify-center items-stretch gap-6 sm:gap-8">
          {" "}
          {/* Adjusted gap */}
          {/* Nimble AI Chat Demo */}
          <div className="lg:w-1/2 bg-gray-100 rounded-xl shadow-lg p-4 sm:p-6 flex flex-col animate-fadeIn animate-delay-200 max-w-md mx-auto">
            {" "}
            {/* Adjusted padding and max-width */}
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 text-center flex items-center justify-center gap-1.5 sm:gap-2">
              {" "}
              {/* Adjusted font size and margin */}
              {/* Reverted to original Nimble AI circle icon */}
              <span className="text-2xl sm:text-3xl text-gray-900">◎</span>{" "}
              Nimble AI Chat {/* Adjusted font size */}
            </h3>
            {/* Chat Messages */}
            <div className="space-y-3 flex-grow">
              {" "}
              {/* Adjusted spacing */}
              {/* AI Message (left) */}
              <AIMessage text="Hello! How can I assist you today?" />
              {/* Customer Message (right) */}
              <CustomerMessage text="I need to know my order status." />
              {/* AI Message (left) */}
              <AIMessage text="Could you please provide your order number or the email address used for the purchase?" />
              {/* Customer Message (right) */}
              <CustomerMessage text="My order number is #12345." />
              {/* AI Message (left) */}
              <AIMessage text="Thank you. Please wait a moment while I retrieve your order details." />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Reusable User Message Component for Comparison Section (now CustomerMessage)
const CustomerMessage = ({ text }) => (
  <div className="flex justify-end animate-fadeIn">
    <div className="bg-gray-900 text-white p-2 sm:p-3 rounded-lg max-w-[80%] text-right shadow-sm">
      {" "}
      {/* Adjusted padding */}
      <p className="text-xs sm:text-sm">{text}</p> {/* Adjusted font size */}
    </div>
  </div>
);

// Reusable AI Message Component for Comparison Section
const AIMessage = ({ text, link }) => (
  <div className="flex justify-start animate-fadeIn">
    <div className="bg-white p-2 sm:p-3 rounded-lg max-w-[80%] text-left shadow-sm border border-gray-200">
      {" "}
      {/* Adjusted padding */}
      <p className="text-xs sm:text-sm text-gray-800">
        {" "}
        {/* Adjusted font size */}
        {text}
        {link && (
          <a
            href={link}
            className="text-blue-600 hover:underline ml-1 text-xs sm:text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            {" "}
            {/* Adjusted font size */}
            refer to this article.
          </a>
        )}
      </p>
    </div>
  </div>
);

// FAQ Section Component (existing) with animations
function FAQSection() {
  const [faqRef, faqVisible] = useIntersectionObserver({ threshold: 0.1 });

  const faqs = [
    {
      question: "What is Nimble AI?",
      answer:
        "Nimble AI is an intelligent AI agent designed to automate customer interactions, enhance response accuracy, and dynamically update knowledge graphs for seamless workflow integration.",
    },
    {
      question: "What platforms does it support?",
      answer:
        "Nimble AI is designed to integrate seamlessly with various popular customer support and CRM platforms. Specific integrations will be announced closer to launch.",
    },
    {
      question: "Who can use Nimble AI?",
      answer:
        "Nimble AI is built for businesses of all sizes looking to enhance their customer support, streamline operations, and leverage AI for better customer interactions.",
    },
    {
      question: "What kind of data does Nimble AI use for training?",
      answer:
        "Nimble AI is trained on a diverse range of anonymized and aggregated customer interaction data to ensure broad applicability and high accuracy, while strictly adhering to privacy protocols.",
    },
    {
      question: "How does Nimble AI handle sensitive customer information?",
      answer:
        "We prioritize data security and privacy. Nimble AI employs robust encryption and anonymization techniques, and all sensitive information is handled in compliance with industry-leading security standards.",
    },
    {
      question: "Can Nimble AI integrate with my existing CRM system?",
      answer:
        "Yes, Nimble AI is built with flexible APIs and connectors to seamlessly integrate with most popular CRM platforms, ensuring a smooth transition and enhanced functionality.",
    },
    {
      question: "What support is available after implementation?",
      answer:
        "We offer comprehensive support packages, including dedicated account management, technical assistance, and regular updates to ensure optimal performance and continuous improvement of your AI solutions.",
    },
    {
      question: "How long does it take to implement Nimble AI?",
      answer:
        "Implementation time varies depending on your specific needs and existing infrastructure, but our team works closely with you to ensure a swift and efficient setup, typically ranging from a few weeks to a couple of months.",
    },
  ];

  return (
    <section
      ref={faqRef}
      className={`py-12 sm:py-20 bg-gray-50 transition-opacity duration-1000 ${
        faqVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {" "}
      {/* Adjusted padding */}
      <div className="container mx-auto px-4 text-center">
        <span className="inline-block bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium px-2 py-0.5 sm:px-3 sm:py-1 rounded-full mb-4 sm:mb-6 animate-fadeIn">
          {" "}
          {/* Adjusted font size and padding */}
          FAQ
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-8 sm:mb-12 animate-slideInUp">
          Frequently Asked Questions
        </h2>{" "}
        {/* Adjusted font sizes and margin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start max-w-lg sm:max-w-4xl mx-auto">
          {" "}
          {/* Adjusted gap and max-width */}
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// Reusable FAQ Item Component with animation
function FAQItem({ question, answer, delay }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div
      className={`bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200 text-left cursor-pointer transition-all duration-300 hover:shadow-lg animate-slideInUp`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {" "}
      {/* Adjusted padding */}
      <div
        className="flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          {question}
        </h3>{" "}
        {/* Adjusted font size */}
        <svg
          className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-700 transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </div>
      {isOpen && (
        <p className="mt-3 text-gray-600 text-sm sm:text-base transition-all duration-300 ease-in-out">
          {" "}
          {/* Adjusted margin and font size */}
          {answer}
        </p>
      )}
    </div>
  );
}

// Footer Component - Updated for Black & White theme to match the screenshot
function Footer() {
  const [footerRef, footerVisible] = useIntersectionObserver({
    threshold: 0.1,
  });

  return (
    <footer
      ref={footerRef}
      className={`bg-white text-gray-900 py-8 sm:py-10 border-t border-gray-200 transition-opacity duration-1000 ${
        footerVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {" "}
      {/* Adjusted padding */}
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4 justify-center items-center">
          {" "}
          {/* Adjusted gap and margin */}
          {/* "Write Us" button updated to mailto link */}
          <a
            href="mailto:enquire@nimble.ai"
            className="px-4 py-1.5 sm:px-6 sm:py-2 bg-gray-900 text-white font-semibold rounded-full shadow-lg hover:bg-gray-700 transition duration-300 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
          >
            {" "}
            {/* Adjusted padding, font size, and gap */}
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              ></path>
            </svg>
            Write Us
          </a>
        </div>

        {/* Follow Us */}
        <div className="flex flex-col items-center space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
          {" "}
          {/* Adjusted spacing and margin */}
          <span className="text-gray-700 text-xs sm:text-sm font-medium">
            Follow Us
          </span>{" "}
          {/* Adjusted font size */}
          <a
            href="https://www.linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-gray-900 transition-colors duration-300"
          >
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {" "}
              {/* Adjusted icon size */}
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          </a>
        </div>

        {/* Copyright and Slogan */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-gray-600 text-xs sm:text-sm border-t border-gray-200 pt-4 sm:pt-6 mt-4 sm:mt-6">
          {" "}
          {/* Adjusted font size, padding, and margin */}
          <p className="mb-1.5 sm:mb-0">&copy; 2025, Nimble AI, Inc</p>{" "}
          {/* Adjusted margin */}
          <p>100x your productivity while supporting customers!</p>
        </div>
      </div>
    </footer>
  );
}

export default App;
