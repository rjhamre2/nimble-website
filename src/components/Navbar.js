import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logoutLambda as logout } from '../services/authService';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import NotificationCenter from './NotificationCenter';

const Navbar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const isLoginPage  = location.pathname === '/login';
  const isDashboard  = location.pathname === '/dashboard';
  const isPublicPage = !isDashboard && !isLoginPage;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Left – burger (mobile dashboard only) + Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isDashboard && (
            <button
              id="nav-mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              {isMobileMenuOpen
                ? <XMarkIcon className="h-5 w-5" />
                : <Bars3Icon className="h-5 w-5" />}
            </button>
          )}

          <Link to="/" className="flex items-center">
            <img
              src={require('../logo.png')}
              alt="NimbleAI"
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Center nav – public pages only */}
        {isPublicPage && (
          <nav className="hidden md:flex items-center gap-6">
            <a href="#solutions"
               className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Solutions
            </a>
            <a href="#features"
               className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Features
            </a>
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="skeleton h-8 w-24 inline-block" />
          ) : user ? (
            <>
              <NotificationCenter />
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border-2 border-slate-200 object-cover flex-shrink-0"
                />
              )}
              {!isDashboard && (
                <span className="hidden sm:block text-sm font-medium text-slate-700 truncate max-w-[140px]">
                  {user.displayName}
                </span>
              )}
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="btn-outline text-xs px-4 py-2"
              >
                Sign out
              </button>
            </>
          ) : (
            !isLoginPage && (
              <>
                {isPublicPage && (
                  <a
                    href="#waitlist"
                    className="hidden sm:inline-flex btn-primary text-xs px-4 py-2"
                  >
                    Get Early Access
                  </a>
                )}
                <button
                  onClick={() => navigate('/login')}
                  className="btn-outline text-xs px-4 py-2"
                >
                  Sign in
                </button>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
