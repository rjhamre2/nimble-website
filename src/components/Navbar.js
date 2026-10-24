import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logoutLambda as logout } from '../services/authService';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { ArrowRight } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const Navbar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const isLoginPage  = location.pathname === '/login';
  const isDashboard  = location.pathname === '/dashboard';
  const isPublicPage = !isDashboard && !isLoginPage;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Left – burger (mobile dashboard only) + Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isDashboard && (
            <button
              id="nav-mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              {isMobileMenuOpen
                ? <XMarkIcon className="h-5 w-5" />
                : <Bars3Icon className="h-5 w-5" />}
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src={require('../logo.png')}
              alt="nimbleAI"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] font-bold tracking-wider text-trust-600 uppercase leading-none font-mono">
                RTO &amp; Revenue Shield
              </span>
              <span className="text-[9px] text-slate-500 leading-tight">
                For Indian D2C
              </span>
            </div>
          </Link>
        </div>

        {/* Center nav – public pages only */}
        {isPublicPage && (
          <nav className="hidden md:flex items-center gap-7">
            <a
              href="#solutions"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Solutions
            </a>
            <a
              href="#rto-calculator"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
            >
              <span>RTO Calculator</span>
              <span className="text-[9px] font-bold text-conversion-600 bg-conversion-50 border border-conversion-200 px-1.5 py-0.2 rounded font-mono">
                P&amp;L
              </span>
            </a>
            <a
              href="#the-enemy"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Why We Win
            </a>
            <a
              href="#unit-economics"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Unit Economics
            </a>
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="skeleton h-8 w-24 inline-block bg-gray-200 rounded-lg" />
          ) : user ? (
            <>
              <NotificationCenter />
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border border-trust-500/50 object-cover flex-shrink-0"
                />
              )}
              {!isDashboard && (
                <span className="hidden sm:block text-xs font-medium text-slate-700 truncate max-w-[130px]">
                  {user.displayName}
                </span>
              )}
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="btn-outline text-xs px-3.5 py-1.5"
              >
                Sign out
              </button>
            </>
          ) : (
            !isLoginPage && (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-outline text-xs px-3.5 py-1.5 font-medium"
                >
                  Sign in
                </button>
                {isPublicPage && (
                  <a
                    href="#waitlist"
                    className="btn-primary text-xs px-4 py-2 font-semibold flex items-center gap-1.5"
                  >
                    <span>Deploy The Shield</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
