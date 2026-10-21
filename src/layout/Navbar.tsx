import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Moon, Sun, ArrowUpRight, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useSettings } from '../contexts/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const { theme, toggleTheme } = useSettings();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Load and poll notifications in real-time
  useEffect(() => {
    const loadNotifs = () => {
      const saved = localStorage.getItem('promptflow_notifications');
      if (saved) {
        setNotifications(JSON.parse(saved));
      } else {
        const welcome = [
          {
            id: 1,
            title: 'Welcome to PromptFlow!',
            desc: 'Configure your LLM API keys in settings or run mock benchmarks in the editor.',
            time: 'Just now',
            unread: true,
          }
        ];
        localStorage.setItem('promptflow_notifications', JSON.stringify(welcome));
        setNotifications(welcome);
      }
    };

    loadNotifs();
    const interval = setInterval(loadNotifs, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, unread: false }));
    localStorage.setItem('promptflow_notifications', JSON.stringify(updated));
    setNotifications(updated);
    toast.success('All notifications marked as read');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-16 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md">
      {/* Search and Mobile Hamburger */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-400 hover:text-slate-200 rounded-lg lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="relative max-w-md w-full hidden md:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects, prompt runs, settings..."
            className="w-full pl-10 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 bg-slate-800/40 hover:bg-slate-800/60 focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 border border-slate-800 rounded-xl transition-all"
          />
        </div>
      </div>

      {/* Right Navbar Controls */}
      <div className="flex items-center gap-4">
        {/* Connection status pill */}
        <div className="flex items-center">
          {isConnected ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Connected (Live)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Offline (Simulated)
            </span>
          )}
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl border border-slate-800/80 transition-all duration-200"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl border border-slate-800/80 transition-all duration-200"
          >
            <Bell size={16} />
            {notifications.some(n => n.unread) && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-slate-900" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Overlay to close notifications click-away */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowNotifications(false)}
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2.5 w-80 z-20 overflow-hidden border border-slate-800 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-950/50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
                    <span className="text-xs font-semibold text-slate-200">Notifications</span>
                    <span 
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-[#6C63FF] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </span>
                  </div>
                  
                  <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-5 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-1.5">
                        <Info size={16} className="text-slate-600" />
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={`flex items-start gap-3 p-3.5 hover:bg-slate-800/30 transition cursor-pointer ${
                            notif.unread ? 'bg-slate-850/40' : ''
                          }`}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {notif.unread ? (
                              <ArrowUpRight size={15} className="text-[#6C63FF]" />
                            ) : (
                              <CheckCircle2 size={15} className="text-emerald-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-slate-200 truncate">{notif.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{notif.desc}</p>
                            <span className="text-[8px] text-slate-500 mt-1 block">{notif.time}</span>
                          </div>
                          {notif.unread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] flex-shrink-0 mt-2" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User profile button */}
        {user && (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-xl object-cover ring-2 ring-slate-800 hover:ring-[#6C63FF]/50 cursor-pointer transition-all duration-200"
          />
        )}
      </div>
    </header>
  );
};
