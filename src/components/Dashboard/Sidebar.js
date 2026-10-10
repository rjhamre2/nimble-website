import React, { useEffect } from 'react';
import {
  InboxIcon,
  MegaphoneIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ChartPieIcon,
  IdentificationIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

const menuItems = [
  { id: 'dashboard',        name: 'Dashboard',       icon: ChartPieIcon },
  { id: 'setup',            name: 'Setup',            icon: ClipboardDocumentCheckIcon },
  { id: 'team-inbox',       name: 'Inbox',            icon: InboxIcon },
  { id: 'broadcast',        name: 'Broadcast',        icon: MegaphoneIcon },
  { id: 'media-library',    name: 'Media Library',    icon: PhotoIcon },
  { id: 'contacts',         name: 'Customers',        icon: UserGroupIcon },
  { id: 'account-details',  name: 'Account Details',  icon: IdentificationIcon },
];

const Sidebar = ({
  activeTab,
  setActiveTab,
  isWabaDetailsEmpty,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  inboxUnreadCount = 0,
}) => {
  /* Prevent body scroll when mobile drawer is open */
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const handleSelect = (id) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-20 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed lg:static left-0 top-16 z-30',
          'flex flex-col',
          'w-56 bg-white border-r border-slate-100',
          'transform transition-transform duration-250 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        style={{ height: 'calc(100vh - 64px)' }}
      >
        {/* Logo accent strip */}
        <div className="h-0.5 bg-gradient-to-r from-[#25D366] to-[#128C7E]" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4 space-y-0.5">
          {menuItems.map((item) => {
            const Icon  = item.icon;
            const active = activeTab === item.id;
            const warn   = item.id === 'account-details' && isWabaDetailsEmpty;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left',
                  'transition-all duration-150 group',
                  active
                    ? 'bg-[#25D366]/10 text-green-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                ].join(' ')}
              >
                <Icon
                  className={[
                    'h-[18px] w-[18px] flex-shrink-0 transition-colors',
                    active
                      ? 'text-[#25D366]'
                      : 'text-slate-400 group-hover:text-slate-600',
                  ].join(' ')}
                />
                <span className={[
                  'text-[13px] truncate flex-1 transition-colors',
                  active ? 'font-semibold' : 'font-medium',
                ].join(' ')}>
                  {item.name}
                </span>

                {item.id === 'team-inbox' && inboxUnreadCount > 0 && (
                  <span className="ml-auto bg-[#25D366] text-white text-[9px] font-bold px-1.5 min-w-[18px] h-4 rounded-full flex items-center justify-center flex-shrink-0">
                    {inboxUnreadCount > 99 ? '99+' : inboxUnreadCount}
                  </span>
                )}
                {item.id !== 'team-inbox' && active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#25D366] flex-shrink-0" />
                )}
                {warn && !active && (
                  <ExclamationTriangleIcon className="h-4 w-4 text-amber-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom footer */}
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">
            NimbleAI v1.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
