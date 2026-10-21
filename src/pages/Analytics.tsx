import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  TrendingDown, 
  Coins, 
  Clock, 
  ShieldCheck,
  Skull
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import api from '../services/api';
import type { AnalyticsSummary, PromptRun } from '../types';
import toast from 'react-hot-toast';

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [history, setHistory] = useState<PromptRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        const [statsData, historyData] = await Promise.all([
          api.getAnalyticsSummary(),
          api.getHistory()
        ]);
        setStats(statsData);
        setHistory(historyData);
      } catch (e) {
        toast.error('Failed to compile analytics report');
      } finally {
        setLoading(false);
      }
    };
    loadAnalyticsData();
  }, []);

  // Heatmap rows computed dynamically from live history
  const getHeatmapRows = () => {
    const projectScores: Record<string, number[]> = {};
    history.forEach(run => {
      if (!projectScores[run.projectName]) {
        projectScores[run.projectName] = [];
      }
      projectScores[run.projectName].push(run.scores.overall);
    });
    return Object.entries(projectScores).map(([project, scores]) => ({
      project,
      scores: scores.slice().reverse().slice(0, 8) // Order latest to the right
    }));
  };

  const heatmapRows = getHeatmapRows();

  const getHeatmapColor = (score: number) => {
    if (score >= 9.5) return 'bg-emerald-500 text-white';
    if (score >= 9.0) return 'bg-emerald-400 text-slate-900';
    if (score >= 8.5) return 'bg-[#6C63FF] text-white';
    if (score >= 8.0) return 'bg-indigo-500/80 text-white';
    return 'bg-amber-500 text-slate-950';
  };

  // Recharts Scatter Chart dataset: Cost vs Latency
  const scatterData = history.map((run) => ({
    latency: Math.ceil((run.latencyA + run.latencyB) / 2),
    cost: parseFloat(((run.costA + run.costB) * 1000).toFixed(4)), // scale up cost for visualization
    name: run.projectName
  }));

  // Standard win distribution dataset
  const winColors = ['#6C63FF', '#5B8CFF', '#334155'];
  const winDistribution = [
    { name: 'Prompt A Wins', value: stats?.wins.winsA || 0 },
    { name: 'Prompt B Wins', value: stats?.wins.winsB || 0 },
    { name: 'Ties', value: stats?.wins.ties || 0 }
  ];

  // Dynamic calculations for Stats Cards
  const getPerformanceMetrics = () => {
    if (history.length === 0) {
      return {
        topPrompt: 'N/A',
        topSub: 'No runs recorded',
        worstPrompt: 'N/A',
        worstSub: 'No runs recorded',
        avgCost: '$0.00000',
        avgLatency: '0ms',
        avgAccuracy: '0.0/10'
      };
    }

    // Find run with highest overall score
    const sortedByScore = [...history].sort((a, b) => b.scores.overall - a.scores.overall);
    const topRun = sortedByScore[0];
    const worstRun = sortedByScore[sortedByScore.length - 1];

    const topPromptWinner = topRun.winner === 'A' ? 'Prompt A' : topRun.winner === 'B' ? 'Prompt B' : 'Tie';
    const worstPromptWinner = worstRun.winner === 'A' ? 'Prompt B' : worstRun.winner === 'B' ? 'Prompt A' : 'Tie';

    return {
      topPrompt: topPromptWinner,
      topSub: `${topRun.projectName} (${topRun.scores.overall.toFixed(1)}/10)`,
      worstPrompt: worstPromptWinner,
      worstSub: `${worstRun.projectName} (${worstRun.scores.overall.toFixed(1)}/10)`,
      avgCost: `$${(stats?.totalCost ? (stats.totalCost / (stats.totalRuns || 1)) : 0).toFixed(5)}`,
      avgLatency: `${Math.ceil(stats?.avgLatency || 0)}ms`,
      avgAccuracy: `${(stats?.avgAccuracy || 0).toFixed(1)}/10`
    };
  };

  const metrics = getPerformanceMetrics();

  if (loading) {
    return (
      <div className="space-y-6 py-2 animate-pulse">
        <div className="h-8 w-44 bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800/40 rounded-2xl border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Advanced Analytics</h1>
        <p className="text-xs text-slate-400">Review detailed cost, token volume distributions, and heatmap evaluations.</p>
      </div>

      {/* Advanced Statistics Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Top Performing Prompt', value: metrics.topPrompt, sub: metrics.topSub, icon: Trophy, color: 'text-yellow-400' },
          { label: 'Worst Performing', value: metrics.worstPrompt, sub: metrics.worstSub, icon: Skull, color: 'text-red-400' },
          { label: 'Average Cost', value: metrics.avgCost, sub: 'Per test run', icon: Coins, color: 'text-emerald-400' },
          { label: 'Average Latency', value: metrics.avgLatency, sub: 'Average response speed', icon: Clock, color: 'text-[#00D4FF]' },
          { label: 'Average Accuracy', value: metrics.avgAccuracy, sub: 'Criteria score average', icon: ShieldCheck, color: 'text-[#6C63FF]' }
        ].map((item, idx) => (
          <div
            key={idx}
            className="glass-panel p-4.5 rounded-2xl border border-slate-800/80 hover:border-slate-800 transition duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
              <item.icon size={16} className={item.color} />
            </div>
            <p className="text-base font-bold text-slate-200 truncate">{item.value}</p>
            <span className="text-[9px] text-slate-500 mt-1 block">{item.sub}</span>
          </div>
        ))}
      </div>

      {/* Analytics Charts Panels row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Win Ratio BarChart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-850">
          <div>
            <span className="text-xs font-semibold text-slate-250 block">Prompt Wins Ratio</span>
            <p className="text-[10px] text-slate-500">Distribution of superior output variations.</p>
          </div>
          
          <div className="h-56 w-full text-xs mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={winDistribution} margin={{ left: -30, right: 10, top: 10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#475569" tickLine={false} />
                <YAxis stroke="#475569" tickLine={false} />
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px' }} />
                <Bar dataKey="value" name="Win Count">
                  {winDistribution.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={winColors[index % winColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost vs Latency ScatterChart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-850 lg:col-span-2">
          <div>
            <span className="text-xs font-semibold text-slate-250 block">Cost vs Latency Dispersion</span>
            <p className="text-[10px] text-slate-500">Latency (ms) plotted against scaled cost (milli-dollars) per run.</p>
          </div>

          <div className="h-56 w-full text-xs mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
                <XAxis type="number" dataKey="latency" name="Latency" unit="ms" stroke="#475569" />
                <YAxis type="number" dataKey="cost" name="Cost" unit="m$" stroke="#475569" />
                <ZAxis type="category" dataKey="name" name="Project" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px' }} />
                <Scatter name="Runs" data={scatterData} fill="#00D4FF" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Version Performance Heatmap */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-850 space-y-4">
        <div>
          <span className="text-xs font-semibold text-slate-220 flex items-center gap-2">
            <TrendingDown size={15} className="text-[#6C63FF]" />
            Prompt Version Performance Heatmap
          </span>
          <p className="text-[10px] text-slate-500">Score progressions across project version iterations (latest versions to the right).</p>
        </div>

        <div className="space-y-4 pt-2">
          {heatmapRows.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No project versions scored yet. Run some comparisons to see dynamic heatmap score tracks!</div>
          ) : (
            heatmapRows.map((row, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-850/60">
                <span className="text-xs font-semibold text-slate-350 sm:w-1/3 truncate">{row.project}</span>
                
                <div className="flex flex-wrap gap-2 sm:w-2/3 justify-start sm:justify-end">
                  {row.scores.map((score, sIdx) => (
                    <div 
                      key={sIdx}
                      className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center font-bold text-[10px] border border-slate-950/20 shadow-sm ${getHeatmapColor(score)}`}
                      title={`Version ${sIdx + 1} Score: ${score}`}
                    >
                      <span>V{sIdx + 1}</span>
                      <span className="text-[8px] font-medium opacity-80">{score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Heatmap Legend */}
        <div className="pt-3 border-t border-slate-850/60 flex items-center justify-center gap-4 text-[9px] text-slate-550">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" />Elite (≥ 9.5)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-400" />Strong (9.0 - 9.4)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#6C63FF]" />Good (8.5 - 8.9)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500/80" />Passing (8.0 - 8.4)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500" />Suboptimal (&lt; 8.0)</span>
        </div>
      </div>

    </div>
  );
};
export default Analytics;
