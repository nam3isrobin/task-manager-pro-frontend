import React from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import { CheckSquare, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const roleStyles = {
    admin: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    manager: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    user: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  };

  const userRole = user?.role || 'user';

  return (
    <nav className="bg-[#0a0f1e]/85 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500 p-2 rounded-xl text-slate-900 shadow-md shadow-amber-500/20 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Task Manager <span className="text-amber-400 font-semibold">Pro</span>
              </span>
            </div>
          </div>

          {/* User Profile & Actions */}
          {user && (
            <div className="flex items-center space-x-3 sm:space-x-4">
              <NotificationDropdown />

              <div className="flex items-center space-x-3 border-l border-white/10 pl-3 sm:pl-4">
                {/* Avatar Badge */}
                <div
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-xs shadow-sm select-none"
                  title={`${user.name} (${user.email})`}
                >
                  {getInitials(user.name)}
                </div>

                {/* User Details */}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-sm font-semibold text-slate-200 line-clamp-1 leading-snug">
                    {user.name}
                  </span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span
                      className={`inline-flex items-center text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border tracking-wider ${
                        roleStyles[userRole] || roleStyles.user
                      }`}
                    >
                      {userRole}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
