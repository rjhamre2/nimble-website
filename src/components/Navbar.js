import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import SignInButton from './SignInButton';
import { Button } from "./ui/button";

const Navbar = () => {
  const location = useLocation();
  
  // Define logic for what to hide
  const isLoginPage = location.pathname === '/login';
  const isDashboard = location.pathname === '/dashboard';
  const hideButtons = location.pathname === '/start-now' || isLoginPage;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2">
          <img 
            src={require('../logo.png')} 
            alt="Nimble AI Logo" 
            className="h-12 w-auto object-contain" 
          />
        </Link>

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
        {window.location.hostname === "localhost" &&(
          <SignInButton /> 
        )}
      </div>
    </header>
  );
};

export default Navbar;