import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FolderGit, 
  Play, 
  Coins, 
  Trash2, 
  LogOut, 
  Activity, 
  Search,
  Lock
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Project, PromptRun } from '../types';
import toast from 'react-hot-toast';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [runsList, setRunsList] = useState<PromptRun[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAdminData = async () => {
    try {
      // 1. Load users list from localStorage
      const savedUsers = localStorage.getItem('promptflow_registered_users');
      const parsedUsers = savedUsers ? JSON.parse(savedUsers) : [];
      setUsersList(parsedUsers);

      // 2. Load all projects and history runs (backend returns everything for admin session)
      const [allProjects, allHistory] = await Promise.all([
        api.getProjects(),
        api.getHistory()
      ]);
      setProjectsList(allProjects);
      setRunsList(allHistory);
    } catch (e) {
      toast.error('Failed to load administrative reports data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Route guard: verify role
    if (!user || user.role !== 'admin') {
      toast.error('Access denied. Administrator privileges required.');
      navigate('/admin/login');
      return;
    }
    fetchAdminData();
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out from Admin Portal');
    navigate('/admin/login');
  };

  const handleDeleteUser = (email: string) => {
    if (email === 'admin@promptflow.ai') {
      toast.error('Cannot delete the root administrator account!');
      return;
    }
    const confirm = window.confirm(`Are you sure you want to delete user ${email}? This will delete all their registered account credentials.`);
    if (confirm) {
      const savedUsers = localStorage.getItem('promptflow_registered_users');
      if (savedUsers) {
        const list = JSON.parse(savedUsers);
        const filtered = list.filter((u: any) => u.email !== email);
        localStorage.setItem('promptflow_registered_users', JSON.stringify(filtered));
        toast.success(`Deleted user account: ${email}`);
        fetchAdminData();
      }
    }
  };

  const handleDeleteRun = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this prompt run log?');
    if (confirm) {
      try {
        await api.deleteRun(id);
        toast.success('Prompt run log deleted successfully');
        fetchAdminData();
      } catch (err) {
        toast.error('Failed to delete run entry');
      }
    }
  };

  // Compute metrics
  const totalUsers = usersList.length;
  const totalProjects = projectsList.length;
  const totalRuns = runsList.length;
  const totalTokens = runsList.reduce((acc, r) => acc + (r.tokensA || 0) + (r.tokensB || 0), 0);
  const totalCost = runsList.reduce((acc, r) => acc + (r.costA || 0) + (r.costB || 0), 0);

  // Filter runs based on search
  const filteredRuns = runsList.filter(run => 
    run.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (run.userId && run.userId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper to count projects owned by a user
  const getUserProjectCount = (email: string) => {
    return projectsList.filter(p => p.userId === email).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col items-center justify-center gap-4">
        <span className="w-10 h-10 border-4 border-[#6C63FF]/20 border-t-[#6C63FF] rounded-full animate-spin" />
        <span className="text-xs text-slate-400">Loading Admin Control Panel...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] font-sans pb-12">
      {/* Admin Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-16 border-b border-red-500/20 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
            <Lock size={16} />
          </div>
          <span className="text-sm font-bold tracking-wider text-red-500 uppercase">
            PromptFlow Admin Console
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg transition"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        {/* Banner Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            System Administration Panel
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor system operations, audit user datasets, and manage registered developer accounts.
          </p>
        </div>

        {/* Admin Counters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {[
            { label: 'Registered Users', value: totalUsers, icon: Users, color: 'text-red-400' },
            { label: 'Total Projects', value: totalProjects, icon: FolderGit, color: 'text-purple-400' },
            { label: 'Evaluations Run', value: totalRuns, icon: Play, color: 'text-emerald-400' },
            { label: 'Tokens Consumed', value: totalTokens, icon: Activity, color: 'text-[#00D4FF]' },
            { label: 'Aggregate Costs', value: `$${totalCost.toFixed(4)}`, icon: Coins, color: 'text-yellow-400' }
          ].map((card, idx) => (
            <div key={idx} className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.label}</span>
                <card.icon size={16} className={card.color} />
              </div>
              <p className="text-xl font-bold text-slate-100">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Registered Users List (Left Column) */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-4 space-y-4">
            <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider border-b border-slate-800 pb-2">
              Registered Accounts ({totalUsers})
            </span>
            
            <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
              {usersList.map((usr) => (
                <div 
                  key={usr.email}
                  className="p-3 rounded-xl bg-slate-950/40 border border-slate-850 flex items-center justify-between gap-3 hover:border-slate-800 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-200 truncate">{usr.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        usr.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/20'
                      }`}>
                        {usr.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{usr.email}</p>
                    <div className="flex items-center gap-2 mt-2 text-[9px] text-slate-400">
                      <span>Projects: <b>{getUserProjectCount(usr.email)}</b></span>
                      <span>•</span>
                      <span className="truncate">{usr.company}</span>
                    </div>
                  </div>

                  {usr.role !== 'admin' && (
                    <button
                      onClick={() => handleDeleteUser(usr.email)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Delete User Account"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Master Logs Audit list (Right Column) */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                System Run Audit Logs ({totalRuns})
              </span>
              
              {/* Search filter */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-550" />
                <input
                  type="text"
                  placeholder="Filter logs by project or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500/50 transition"
                />
              </div>
            </div>

            {/* Logs Table */}
            {filteredRuns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-550 font-bold uppercase text-[9px] tracking-wider bg-slate-950/20">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">User Scope</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Winner</th>
                      <th className="py-3 px-4">Cost</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-350">
                    {filteredRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-slate-850/10 transition">
                        <td className="py-3.5 px-4 text-[10px] text-slate-550 font-mono">
                          {new Date(run.date).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-semibold truncate max-w-[120px]" title={run.userId}>
                          {run.userId || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium max-w-[120px] truncate">
                          {run.projectName}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            run.winner === 'A' ? 'bg-[#6C63FF]/15 text-[#6C63FF]' :
                            run.winner === 'B' ? 'bg-[#5B8CFF]/15 text-[#5B8CFF]' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {run.winner}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-450">
                          ${((run.costA || 0) + (run.costB || 0)).toFixed(5)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteRun(run.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            title="Delete log record"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 italic text-xs">
                No system audit records match your filter parameters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
