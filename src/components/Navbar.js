import React from 'react';

const Navbar = ({ toggleDarkMode, isDarkMode }) => (
  <nav className={`sticky top-0 z-50 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} animate-fadeIn`}>
    <div className='container mx-auto px-4 py-4 flex items-center'>
      <div className='flex-grow basis-1/3'></div>
      <a href='#' className='flex items-center space-x-2 flex-grow justify-center basis-1/3'>
        <img src={require('../logo.png')} alt='Nimble AI Logo' className={`h-12 w-auto object-contain ${isDarkMode ? 'logo-invert' : ''}`} />
      </a>
      <div className='flex-grow flex justify-end basis-1/3'>
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          aria-label='Toggle Dark Mode'
        >
          {isDarkMode ? (
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 3v1m0 16v1m9-9h1M2 12h1m15.325-4.475l-.707-.707M6.382 17.618l-.707-.707M17.618 6.382l-.707-.707M6.382 6.382l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
              ></path>
            </svg>
          ) : (
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

export default Navbar; 