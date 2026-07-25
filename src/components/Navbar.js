import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import SignInButton from './SignInButton';
import { Button } from "./ui/button";
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Navbar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const location = useLocation();

  // Define logic for what to hide
  const isLoginPage = location.pathname === '/login';
  const isDashboard = location.pathname === '/dashboard';
  const hideButtons = location.pathname === '/start-now' || isLoginPage;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200">
      {/* Changed 'container' to 'w-full max-w-7xl' so it utilizes desktop space better and aligns with Dashboard */}
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        
      {/* Left Side: Burger + Logo */}
        <div className="flex items-center gap-4">
          {/* 1. Changed lg:hidden to md:hidden so it hides exactly when desktop links appear.
            2. Added -ml-2 so the burger menu sits flush left on mobile screens.
          */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden -ml-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6 text-gray-700" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-gray-700" />
            )}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={require('../logo.png')} 
              alt="Nimble AI Logo" 
              className="h-10 sm:h-12 w-auto object-contain" 
            />
          </Link>
        </div>

        {/* Navigation Links - HIDDEN ON LOGIN PAGE */}
        {!isLoginPage && !isDashboard && (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#solutions" className="hover:text-green-600 transition-colors">Solutions</a>
            {/*
            <a href="#features" className="hover:text-green-600 transition-colors">Features</a>
            <a href="#waitlist" className="hover:text-green-600 transition-colors">Pricing</a> 
            */}
          </nav>
        )}

        {/* Right Actions */}
        {!isLoginPage && !isDashboard && (
        <div className="flex items-center gap-4">
          {!hideButtons && (
            <Button asChild variant="hero" size="sm">
              <a href="#waitlist">Get Early Access</a>
            </Button>
          )}
        </div>
        )}
{/*      
        {window.location.hostname === "localhost" &&(
          <SignInButton /> 
        )}
*/}     
        <SignInButton /> 
      </div>
    </header>
  );
};

export default Navbar;