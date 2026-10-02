import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Bell, CheckCheck, Info } from 'lucide-react';

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data || response.data);
    } catch (err) {
      // Handle error gracefully or endpoint not ready
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      // Handle error
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err) {
      // Handle error
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-amber-500 text-slate-900 rounded-full text-xs w-4 h-4 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0a0f1e]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/8">
            <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/8">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.read && handleMarkAsRead(notif._id)}
                  className={`p-3 text-sm cursor-pointer hover:bg-white/5 transition-colors ${
                    !notif.read ? 'bg-indigo-500/5 font-medium' : 'text-slate-500'
                  }`}
                >
                  <p className={!notif.read ? 'text-slate-300' : 'text-slate-500'}>
                    {notif.message || notif.title}
                  </p>
                  <span className="text-xs text-slate-600 mt-1 block">
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-slate-600 flex flex-col items-center">
                <Info className="w-6 h-6 text-slate-700 mb-1" />
                No notifications yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
