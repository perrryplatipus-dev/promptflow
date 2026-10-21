import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderGit, 
  GitCompare, 
  History, 
  BarChart3, 
  Settings, 
  LogOut, 
  Terminal 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Prompt Projects', path: '/projects', icon: FolderGit },
    { name: 'Compare Prompts', path: '/compare', icon: GitCompare },
    { name: 'History', path: '/history', icon: History },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <motion.aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r border-slate-800/80 bg-slate-900/90 backdrop-blur-xl transition-all duration-300 lg:sticky lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-slate-800/80">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#5B8CFF] shadow-lg shadow-[#6C63FF]/20">
            <Terminal size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Prompt<span className="text-[#6C63FF]">Flow</span>
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#6C63FF]/15 to-[#5B8CFF]/15 text-[#6C63FF] border-l-2 border-[#6C63FF]'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`
              }
            >
              <item.icon size={18} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Profile Summary */}
        {user && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/20">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/30 border border-slate-800/40">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#6C63FF]/20" 
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                  {user.name}
                  {user.role === 'admin' && (
                    <span className="px-1.5 py-0.5 text-[8px] font-bold text-white bg-red-500/80 rounded uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );
};
