import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Trash2, 
  Eye, 
  Download, 
  Copy
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';
import type { Project, PromptRun } from '../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export const History: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [history, setHistory] = useState<PromptRun[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedWinner, setSelectedWinner] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected Run Drawer state
  const [selectedRun, setSelectedRun] = useState<PromptRun | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadHistoryData = async () => {
    setLoading(true);
    try {
      const [historyData, projectsData] = await Promise.all([
        api.getHistory(),
        api.getProjects()
      ]);
      setHistory(historyData);
      setProjects(projectsData);

      // Check if a specific runId was query-passed from dashboard
      const queryRunId = searchParams.get('runId');
      if (queryRunId) {
        const match = historyData.find((h) => h.id === queryRunId);
        if (match) {
          setSelectedRun(match);
          setDrawerOpen(true);
        }
      }
    } catch (e) {
      toast.error('Failed to load history logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistoryData();
  }, [searchParams]);

  const handleDeleteRun = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this comparison run log?')) return;
    try {
      await api.deleteRun(id);
      toast.success('Run deleted successfully');
      if (selectedRun?.id === id) {
        setDrawerOpen(false);
      }
      loadHistoryData();
    } catch (e) {
      toast.error('Failed to delete run');
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  // Filter logic
  const filteredHistory = history.filter((run) => {
    const matchesSearch = 
      run.projectName.toLowerCase().includes(search.toLowerCase()) ||
      run.promptA.toLowerCase().includes(search.toLowerCase()) ||
      run.promptB.toLowerCase().includes(search.toLowerCase());
    
    const matchesProject = selectedProject === '' || run.projectId === selectedProject;
    const matchesWinner = selectedWinner === '' || run.winner === selectedWinner;

    return matchesSearch && matchesProject && matchesWinner;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 py-2 relative">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Run History Logs</h1>
        <p className="text-xs text-slate-400">Search and audit past side-by-side completions and votes.</p>
      </div>

      {/* Filters toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search prompt contents..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs text-slate-200 bg-slate-950 border border-slate-850 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 md:flex-none px-3.5 py-2 text-xs text-slate-200 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={selectedWinner}
            onChange={(e) => {
              setSelectedWinner(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 md:flex-none px-3.5 py-2 text-xs text-slate-200 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50"
          >
            <option value="">All Winner Status</option>
            <option value="A">Winner: Prompt A</option>
            <option value="B">Winner: Prompt B</option>
            <option value="Tie">Winner: Tie</option>
          </select>
        </div>
      </div>

      {/* Main Datatable */}
      <div className="glass-panel rounded-2xl border border-slate-850 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <span className="w-6 h-6 border-2 border-slate-750 border-t-[#6C63FF] rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Loading audit history...</span>
          </div>
        ) : paginatedHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[9px] tracking-wider bg-slate-900/10">
                  <th className="py-4.5 px-6">Date</th>
                  <th className="py-4.5 px-6">Project Name</th>
                  {user?.role === 'admin' && <th className="py-4.5 px-6">Owner</th>}
                  <th className="py-4.5 px-6">Outcome Winner</th>
                  <th className="py-4.5 px-6">Avg Latency</th>
                  <th className="py-4.5 px-6">Total Tokens</th>
                  <th className="py-4.5 px-6">Cost</th>
                  <th className="py-4.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-350">
                {paginatedHistory.map((run) => (
                  <tr 
                    key={run.id}
                    onClick={() => {
                      setSelectedRun(run);
                      setDrawerOpen(true);
                    }}
                    className="hover:bg-slate-850/20 cursor-pointer transition"
                  >
                    <td className="py-4 px-6 text-[10px] text-slate-500 font-mono">
                      {new Date(run.date).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      {run.projectName}
                    </td>
                    {user?.role === 'admin' && (
                      <td className="py-4 px-6 text-[10px] text-[#5B8CFF] font-semibold">
                        {run.userId || 'N/A'}
                      </td>
                    )}
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        run.winner === 'A' ? 'bg-[#6C63FF]/15 text-[#6C63FF] border border-[#6C63FF]/20' :
                        run.winner === 'B' ? 'bg-[#5B8CFF]/15 text-[#5B8CFF] border border-[#5B8CFF]/20' :
                        'bg-slate-800 text-slate-400 border border-slate-700/60'
                      }`}>
                        Winner: {run.winner}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-400">
                      {Math.ceil((run.latencyA + run.latencyB) / 2)}ms
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-400">
                      {run.tokensA + run.tokensB}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-400">
                      ${(run.costA + run.costB).toFixed(5)}
                    </td>
                    <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRun(run);
                            setDrawerOpen(true);
                          }}
                          className="p-1.5 text-slate-450 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                          title="View detailed outputs"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteRun(run.id, e)}
                          className="p-1.5 text-slate-450 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          title="Delete run entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 italic">
            No comparison runs match your filters. Run tests in the comparison page!
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4.5 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/10">
            <span>
              Showing Page <b>{currentPage}</b> of <b>{totalPages}</b>
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800/80 rounded-lg transition"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800/80 rounded-lg transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RUN DETAILS OVERLAY DRAWER */}
      <AnimatePresence>
        {drawerOpen && selectedRun && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop click off */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Slide-over Container */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: '0%' }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-screen max-w-3xl bg-slate-900 border-l border-slate-800 flex flex-col justify-between shadow-2xl relative"
              >
                {/* Drawer Header */}
                <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Run Details Log</span>
                    <span className="text-[9px] text-slate-500 font-mono mt-0.5">{selectedRun.id} — {new Date(selectedRun.date).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedRun, null, 2), 'JSON Data')}
                      className="p-1.5 text-slate-500 hover:text-slate-250 hover:bg-slate-800 rounded-lg"
                      title="Copy full JSON dataset"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => setDrawerOpen(false)}
                      className="text-slate-400 hover:text-white text-lg font-semibold"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Drawer Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Variables used */}
                  <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Variables Applied</span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Object.entries(selectedRun.variables).map(([key, val]) => (
                        <span key={key} className="text-[10px] px-2.5 py-1 bg-slate-950 border border-slate-800/80 rounded-lg text-slate-350">
                          <b className="text-[#00D4FF]">{key}</b>: "{val}"
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Original Prompt Instructions collapsible tabs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Original Prompt A Instructions</span>
                      <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl text-[10px] font-mono leading-relaxed text-slate-400 max-h-32 overflow-y-auto">
                        {selectedRun.promptA}
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Original Prompt B Instructions</span>
                      <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl text-[10px] font-mono leading-relaxed text-slate-400 max-h-32 overflow-y-auto">
                        {selectedRun.promptB}
                      </div>
                    </div>
                  </div>

                  {/* Outputs panel side-by-side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Output A Details */}
                    <div className={`glass-panel rounded-xl border p-4 flex flex-col justify-between min-h-[220px] ${
                      selectedRun.winner === 'A' ? 'border-[#6C63FF]/30' : 'border-slate-800/80'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-3">
                          <span className="text-xs font-bold text-slate-200">Response output A</span>
                          {selectedRun.winner === 'A' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#6C63FF]/15 text-[#6C63FF] font-bold">🏆 WINNER</span>}
                        </div>
                        <div className="text-[11px] text-slate-350 prose prose-invert max-w-none leading-relaxed overflow-y-auto max-h-48">
                          <ReactMarkdown>{selectedRun.outputA}</ReactMarkdown>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-slate-800/50 flex items-center justify-between text-[9px] text-slate-500 font-mono mt-3">
                        <span>Latency: {selectedRun.latencyA}ms</span>
                        <span>Tokens: {selectedRun.tokensA}</span>
                      </div>
                    </div>

                    {/* Output B Details */}
                    <div className={`glass-panel rounded-xl border p-4 flex flex-col justify-between min-h-[220px] ${
                      selectedRun.winner === 'B' ? 'border-[#5B8CFF]/30' : 'border-slate-800/80'
                    }`}>
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-3">
                          <span className="text-xs font-bold text-slate-200">Response output B</span>
                          {selectedRun.winner === 'B' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#5B8CFF]/15 text-[#5B8CFF] font-bold">🏆 WINNER</span>}
                        </div>
                        <div className="text-[11px] text-slate-350 prose prose-invert max-w-none leading-relaxed overflow-y-auto max-h-48">
                          <ReactMarkdown>{selectedRun.outputB}</ReactMarkdown>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/50 flex items-center justify-between text-[9px] text-slate-500 font-mono mt-3">
                        <span>Latency: {selectedRun.latencyB}ms</span>
                        <span>Tokens: {selectedRun.tokensB}</span>
                      </div>
                    </div>

                  </div>

                  {/* Evaluation Scores breakdown grid */}
                  <div className="glass-panel p-5 rounded-xl border border-slate-800/80 space-y-4">
                    <span className="text-xs font-bold text-slate-200 block">Evaluated Scoring metrics</span>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                      {[
                        { label: 'Tone alignment', val: selectedRun.scores.tone },
                        { label: 'Context accuracy', val: selectedRun.scores.accuracy },
                        { label: 'Length boundaries', val: selectedRun.scores.length },
                        { label: 'Grammar layout', val: selectedRun.scores.grammar },
                        { label: 'Overall Average', val: selectedRun.scores.overall, highlight: true }
                      ].map((item, idx) => (
                        <div key={idx} className={`p-3 rounded-lg text-center flex flex-col justify-center border ${
                          item.highlight 
                            ? 'bg-[#6C63FF]/10 border-[#6C63FF]/20 text-[#6C63FF]' 
                            : 'bg-slate-950 border-slate-850/60 text-slate-300'
                        }`}>
                          <span className="text-[9px] text-slate-500 uppercase font-semibold block mb-1">{item.label}</span>
                          <span className="text-sm font-extrabold">{item.val.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Drawer Footer Actions */}
                <div className="px-6 py-4.5 border-t border-slate-800 bg-slate-950/20 flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      const reportText = `PromptFlow Run Report\nDate: ${selectedRun.date}\nWinner: ${selectedRun.winner}\n\nScores:\n- Tone: ${selectedRun.scores.tone}\n- Accuracy: ${selectedRun.scores.accuracy}\n- Length: ${selectedRun.scores.length}\n- Grammar: ${selectedRun.scores.grammar}\n- Overall: ${selectedRun.scores.overall}\n\nOutputs A:\n${selectedRun.outputA}\n\nOutputs B:\n${selectedRun.outputB}`;
                      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `run-report-${selectedRun.id}.txt`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.success('Report downloaded!');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-750 rounded-xl transition"
                  >
                    <Download size={13} />
                    Download Report
                  </button>
                  
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="px-4.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/40 rounded-xl"
                  >
                    Close Drawer
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default History;
