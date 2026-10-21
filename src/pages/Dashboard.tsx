import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderGit, 
  Play, 
  Cpu, 
  DollarSign, 
  Activity, 
  Trophy, 
  GitCompare, 
  Settings, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Cell,
  Pie
} from 'recharts';
import api from '../services/api';
import type { PromptRun, AnalyticsSummary } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [recentRuns, setRecentRuns] = useState<PromptRun[]>([]);
  const [allRuns, setAllRuns] = useState<PromptRun[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsData, runsData] = await Promise.all([
          api.getAnalyticsSummary(),
          api.getHistory()
        ]);
        setStats(statsData);
        setAllRuns(runsData);
        setRecentRuns(runsData.slice(0, 4));
      } catch (e) {
        console.error('Failed to load dashboard statistics', e);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  // Compute live graphs dynamically from actual runs history
  const getChartData = () => {
    const days = [];
    const dateMap: Record<string, { runs: number; input: number; output: number; cost: number }> = {};
    
    // Initialize the last 7 calendar days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { weekday: 'short' });
      const key = d.toISOString().split('T')[0];
      days.push({ key, name: dateStr });
      dateMap[key] = { runs: 0, input: 0, output: 0, cost: 0 };
    }
    
    // Populate counts based on actual database logs
    allRuns.forEach(run => {
      const runDate = run.date.split('T')[0];
      if (dateMap[runDate] !== undefined) {
        dateMap[runDate].runs += 1;
        const tokensA = run.tokensA || 0;
        const tokensB = run.tokensB || 0;
        dateMap[runDate].input += Math.round((tokensA + tokensB) * 0.35);
        dateMap[runDate].output += Math.round((tokensA + tokensB) * 0.65);
        dateMap[runDate].cost += (run.costA || 0) + (run.costB || 0);
      }
    });
    
    const dailyRuns = days.map(d => ({
      name: d.name,
      runs: dateMap[d.key].runs
    }));
    
    const tokenUsage = days.map(d => ({
      name: d.name,
      input: dateMap[d.key].input,
      output: dateMap[d.key].output
    }));
    
    let accumulatedCost = 0;
    const costTrend = days.map(d => {
      accumulatedCost += dateMap[d.key].cost;
      return {
        name: d.name,
        cost: parseFloat(accumulatedCost.toFixed(6))
      };
    });
    
    return { dailyRuns, tokenUsage, costTrend };
  };

  const { dailyRuns: dailyRunsData, tokenUsage: tokenUsageData, costTrend: costTrendData } = getChartData();

  const pieColors = ['#6C63FF', '#5B8CFF', '#334155'];
  const winDistribution = [
    { name: 'Prompt A Wins', value: stats?.wins.winsA || 0 },
    { name: 'Prompt B Wins', value: stats?.wins.winsB || 0 },
    { name: 'Ties', value: stats?.wins.ties || 0 }
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-8 w-48 bg-slate-800 rounded-xl" />
        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800/40 rounded-2xl border border-slate-800" />
          ))}
        </div>
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-800/40 rounded-2xl border border-slate-800" />
          <div className="h-64 bg-slate-800/40 rounded-2xl border border-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Welcome Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Overview Dashboard</h1>
          <p className="text-xs text-slate-400">Benchmark your prompt updates and review real-time comparisons.</p>
        </div>
        
        <button
          onClick={() => navigate('/compare')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#6C63FF] to-[#5B8CFF] hover:opacity-95 rounded-xl shadow-lg shadow-[#6C63FF]/20 border border-[#6C63FF]/30 transition"
        >
          ⚡ Start A/B Tester
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Projects', value: stats?.totalProjects || 0, sub: 'Active playgrounds', icon: FolderGit, color: 'text-[#6C63FF]' },
          { label: 'Total Runs', value: stats?.totalRuns || 0, sub: 'Test completions', icon: Play, color: 'text-[#5B8CFF]' },
          { label: 'Tokens Used', value: stats?.totalTokens || 0, sub: 'Est. accumulation', icon: Cpu, color: 'text-[#00D4FF]' },
          { label: 'Total Cost', value: `$${stats?.totalCost.toFixed(4) || '0.00'}`, sub: 'LLM pricing cost', icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Avg Accuracy', value: `${(stats?.avgAccuracy || 0).toFixed(1)}/10`, sub: 'Automated grades', icon: Activity, color: 'text-amber-400' },
          { label: 'Prompt Wins (A/B)', value: `${stats?.wins.winsA || 0} / ${stats?.wins.winsB || 0}`, sub: 'Win ratio scores', icon: Trophy, color: 'text-pink-400' }
        ].map((m, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="glass-panel p-4.5 rounded-2xl border border-slate-800/80 hover:border-slate-800 transition duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{m.label}</span>
              <m.icon size={16} className={m.color} />
            </div>
            <p className="text-xl font-bold text-white tracking-tight">{m.value}</p>
            <span className="text-[9px] text-slate-500 mt-1 block">{m.sub}</span>
          </motion.div>
        ))}
      </div>

      {/* Row of primary analytics charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily runs line chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold text-slate-200">Daily Runs (Usage Volume)</span>
              <p className="text-[10px] text-slate-500">Number of side-by-side completions requested.</p>
            </div>
            <TrendingUp size={16} className="text-[#6C63FF]" />
          </div>
          
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRunsData} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#475569" tickLine={false} />
                <YAxis stroke="#475569" tickLine={false} />
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="runs" stroke="#6C63FF" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Token Usage BarChart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold text-slate-200">Token Consumption Details</span>
              <p className="text-[10px] text-slate-500">Grouped tokens showing input vs output counts.</p>
            </div>
            <Cpu size={16} className="text-[#00D4FF]" />
          </div>

          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tokenUsageData} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#475569" tickLine={false} />
                <YAxis stroke="#475569" tickLine={false} />
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px' }} />
                <Bar dataKey="input" name="Input (Tokens)" fill="#5B8CFF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="output" name="Output (Tokens)" fill="#00D4FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row of secondary analytics charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Prompt Wins PieChart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-200">Prompt Wins (Distribution)</span>
            <p className="text-[10px] text-slate-500">Summary of winning models.</p>
          </div>
          
          <div className="h-44 w-full flex items-center justify-center relative my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {winDistribution.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-xl font-bold text-white">{stats?.totalRuns || 0}</span>
              <p className="text-[8px] uppercase tracking-wider text-slate-500">Runs</p>
            </div>
          </div>

          <div className="flex justify-around text-[10px] text-slate-400 mt-2">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#6C63FF]" />A Wins</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#5B8CFF]" />B Wins</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#334155]" />Ties</span>
          </div>
        </div>

        {/* Cost Trend area chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 lg:col-span-2">
          <div>
            <span className="text-xs font-semibold text-slate-200">Cost Trend (Cumulative Spend)</span>
            <p className="text-[10px] text-slate-500">Aggregated spending rate for active integrations.</p>
          </div>

          <div className="h-52 w-full text-xs mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costTrendData} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#475569" tickLine={false} />
                <YAxis stroke="#475569" tickLine={false} />
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="cost" stroke="#22C55E" fillOpacity={1} fill="url(#colorCost)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Quick Actions and Recent Activity Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Activity Table */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-200">Recent Comparison Activity</span>
              <button onClick={() => navigate('/history')} className="text-[10px] text-[#6C63FF] hover:underline flex items-center gap-1 font-semibold">
                View all logs <ArrowRight size={12} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Project</th>
                    <th className="pb-2.5">Winner</th>
                    <th className="pb-2.5">Latency</th>
                    <th className="pb-2.5 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {recentRuns.length > 0 ? (
                    recentRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-slate-800/10 cursor-pointer" onClick={() => navigate(`/history?runId=${run.id}`)}>
                        <td className="py-3 text-[10px] text-slate-400">{new Date(run.date).toLocaleDateString()}</td>
                        <td className="py-3 font-medium text-slate-200">{run.projectName}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            run.winner === 'A' ? 'bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/20' :
                            run.winner === 'B' ? 'bg-[#5B8CFF]/10 text-[#5B8CFF] border border-[#5B8CFF]/20' :
                            'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            Winner: {run.winner}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">{Math.max(run.latencyA, run.latencyB)}ms</td>
                        <td className="py-3 text-right text-slate-400">${(run.costA + run.costB).toFixed(5)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 text-xs italic">
                        No recent comparisons. Create a project to test!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 lg:col-span-4 space-y-4">
          <span className="text-xs font-semibold text-slate-200 block">Quick Workspace Actions</span>
          
          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => navigate('/projects?create=true')}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-[#6C63FF]/30 transition text-left text-xs group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#6C63FF]/10 text-[#6C63FF]">
                  <FolderGit size={14} />
                </div>
                <div>
                  <span className="font-semibold text-slate-250 block">Create Project</span>
                  <span className="text-[10px] text-slate-500">Initialize a new prompt tests collection</span>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/compare')}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-[#5B8CFF]/30 transition text-left text-xs group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#5B8CFF]/10 text-[#5B8CFF]">
                  <GitCompare size={14} />
                </div>
                <div>
                  <span className="font-semibold text-slate-250 block">A/B Testing Playground</span>
                  <span className="text-[10px] text-slate-500">Run parallel real-time LLM requests</span>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-[#00D4FF]/30 transition text-left text-xs group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF]">
                  <Settings size={14} />
                </div>
                <div>
                  <span className="font-semibold text-slate-250 block">API Integrations Keys</span>
                  <span className="text-[10px] text-slate-500">Register Gemini & OpenAI secure access</span>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
export default Dashboard;
