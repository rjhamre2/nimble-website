import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BellIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationService';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchNotifications();
      if (res && res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Poll for new notifications every 60 seconds
    const interval = setInterval(loadNotifications, 60000);

    // Refresh when window regains focus
    const handleFocus = () => loadNotifications();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadNotifications]);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notif) => {
    // Mark as read locally and on server
    if (!notif.is_read) {
      markNotificationAsRead(notif.notification_id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notif.notification_id ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }

    setIsOpen(false);

    // Navigation target handling
    if (notif.cta_target === 'integrations' || notif.cta_target === 'setup') {
      const targetTab = notif.cta_target === 'setup' ? 'setup' : 'integrations';
      if (location.pathname === '/dashboard') {
        window.dispatchEvent(
          new CustomEvent('navigate-dashboard-tab', { detail: targetTab })
        );
      } else {
        navigate(`/dashboard?tab=${targetTab}`);
      }
    } else if (notif.cta_link) {
      if (notif.cta_link.startsWith('http')) {
        window.open(notif.cta_link, '_blank');
      } else {
        navigate(notif.cta_link);
      }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // Check if any unread notification is critical or warning
  const hasUrgentAlert = notifications.some(
    (n) => !n.is_read && (n.severity === 'critical' || n.severity === 'warning')
  );

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          icon: ExclamationCircleIcon,
          iconColor: 'text-rose-600',
          badgeBg: 'bg-rose-100 text-rose-700 border-rose-200',
          cardBorder: 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/80',
          ctaBg: 'bg-rose-600 hover:bg-rose-700 text-white',
          label: 'Critical',
        };
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          iconColor: 'text-amber-600',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
          cardBorder: 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/80',
          ctaBg: 'bg-amber-600 hover:bg-amber-700 text-white',
          label: 'Action Required',
        };
      case 'info':
      default:
        return {
          icon: InformationCircleIcon,
          iconColor: 'text-sky-600',
          badgeBg: 'bg-sky-100 text-sky-700 border-sky-200',
          cardBorder: 'border-slate-200 bg-white hover:bg-slate-50',
          ctaBg: 'bg-slate-900 hover:bg-slate-800 text-white',
          label: 'Notice',
        };
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffHours = Math.round((now - date) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className={`absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full ${
              hasUrgentAlert ? 'bg-rose-500 animate-pulse' : 'bg-blue-600'
            }`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                >
                  <CheckIcon className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2.5">
                  <BellIcon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-700">No notifications</p>
                <p className="text-xs text-slate-400 mt-0.5">You're all caught up with your alerts</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = getSeverityConfig(notif.severity);
                const IconComponent = config.icon;

                return (
                  <div
                    key={notif.notification_id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition-all cursor-pointer border-l-4 ${
                      notif.is_read
                        ? 'border-transparent bg-white hover:bg-slate-50 opacity-75'
                        : `${notif.severity === 'critical' ? 'border-rose-500 bg-rose-50/20' : notif.severity === 'warning' ? 'border-amber-500 bg-amber-50/20' : 'border-blue-500 bg-blue-50/20'} hover:bg-slate-50`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${config.badgeBg}`}
                          >
                            {config.label}
                          </span>
                          <span className="text-[11px] text-slate-400 flex-shrink-0">
                            {formatTimestamp(notif.created_at)}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {notif.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Optional CTA Button */}
                        {notif.cta_text && (
                          <div className="mt-2.5 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notif);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${config.ctaBg}`}
                            >
                              <span>{notif.cta_text}</span>
                              <ArrowRightIcon className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
