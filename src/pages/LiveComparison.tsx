import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Copy, 
  Download, 
  Clock, 
  Cpu, 
  DollarSign, 
  FileText,
  ThumbsUp,
  Award,
  CheckCircle,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export const LiveComparison: React.FC = () => {
  const navigate = useNavigate();
  const { 
    isStreaming, 
    streamOutputA, 
    streamOutputB, 
    metricsA, 
    metricsB, 
    currentRunResult,
    resetComparison
  } = useSocket();

  const [vote, setVote] = useState<'A' | 'B' | 'Tie' | null>(null);
  const [savingVote, setSavingVote] = useState(false);

  // Redirect to editor if there is no active streaming state or result
  useEffect(() => {
    if (!isStreaming && !currentRunResult && !streamOutputA && !streamOutputB) {
      toast.error('No active test comparison. Start one in the editor!');
      navigate('/compare');
    }
  }, [isStreaming, currentRunResult, streamOutputA, streamOutputB, navigate]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVote = async (winner: 'A' | 'B' | 'Tie') => {
    if (vote || !currentRunResult) return;
    setVote(winner);
    setSavingVote(true);
    
    try {
      // Update historical run in database
      const updatedRun = { ...currentRunResult, winner };
      // Delete old entry and save new one or update
      await api.deleteRun(currentRunResult.id);
      await api.saveRun(updatedRun);
      
      toast.success(`Vote casted: ${winner === 'Tie' ? 'Tie' : `Prompt ${winner} won`}`);
    } catch (e) {
      toast.error('Failed to register vote');
    } finally {
      setSavingVote(false);
    }
  };

  // Word counts calculation
  const getWordCount = (text: string) => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const overallScores = currentRunResult?.scores;
  const isFinished = !isStreaming && currentRunResult;

  return (
    <div className="space-y-6 py-2">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetComparison();
              navigate('/compare');
            }}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl border border-slate-800 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Live Parallel Testing</h1>
            <p className="text-xs text-slate-400">Streaming A/B responses side-by-side in real-time.</p>
          </div>
        </div>

        {/* Progress Bar status indicator */}
        <div className="flex items-center gap-3">
          {isStreaming ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold bg-[#6C63FF]/15 text-[#6C63FF] border border-[#6C63FF]/20">
              <span className="w-1.5 h-1.5 bg-[#6C63FF] rounded-full animate-ping" />
              Streaming Outputs...
            </div>
          ) : isFinished ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle size={12} className="text-emerald-400" />
              Completions Finished
            </div>
          ) : null}
        </div>
      </div>

      {/* Progress timeline indicator at top */}
      {isStreaming && (
        <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
          <motion.div 
            className="bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] h-full"
            initial={{ width: '0%' }}
            animate={{ width: ['5%', '35%', '65%', '85%', '95%'] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      {/* Side-by-Side Response Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel A Output */}
        <div className={`glass-panel rounded-2xl border flex flex-col justify-between overflow-hidden relative transition-all duration-500 ${
          isFinished && currentRunResult.winner === 'A' ? 'border-[#6C63FF]/50 shadow-2xl shadow-[#6C63FF]/10' : 'border-slate-800'
        }`}>
          {/* Winner banner badge */}
          {isFinished && currentRunResult.winner === 'A' && (
            <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-[#6C63FF] to-[#5B8CFF] text-white py-1 px-4 text-[9px] font-bold tracking-widest text-center flex items-center justify-center gap-1 shadow-md">
              <Award size={11} />
              WINNER: OPTION A
            </div>
          )}

          {/* Panel Header */}
          <div className={`px-5 h-12 bg-slate-900/60 border-b border-slate-850 flex items-center justify-between ${
            isFinished && currentRunResult.winner === 'A' ? 'mt-5' : ''
          }`}>
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]" />
              Response A
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopy(streamOutputA, 'Response A')}
                disabled={!streamOutputA}
                className="p-1.5 text-slate-500 hover:text-slate-200 disabled:opacity-30 rounded-lg transition"
                title="Copy response markdown"
              >
                <Copy size={13} />
              </button>
              <button
                onClick={() => handleDownload(streamOutputA, 'response-a.md')}
                disabled={!streamOutputA}
                className="p-1.5 text-slate-500 hover:text-slate-200 disabled:opacity-30 rounded-lg transition"
                title="Download file"
              >
                <Download size={13} />
              </button>
            </div>
          </div>

          {/* Markdown content area */}
          <div className="p-6 text-xs prose prose-invert max-w-none min-h-[300px] overflow-y-auto leading-relaxed text-slate-350 bg-slate-950/20">
            {streamOutputA ? (
              <ReactMarkdown>{streamOutputA}</ReactMarkdown>
            ) : (
              <div className="flex flex-col items-center justify-center h-44 text-slate-500 space-y-3">
                <span className="w-5 h-5 border-2 border-slate-700 border-t-[#6C63FF] rounded-full animate-spin" />
                <span className="text-[10px] font-medium animate-pulse">Waiting for server stream...</span>
              </div>
            )}
            {/* Live Typing Cursor */}
            {isStreaming && streamOutputA && (
              <span className="w-1 h-3 bg-[#6C63FF] inline-block ml-0.5 animate-pulse" />
            )}
          </div>

          {/* Panel Footer Metrics */}
          <div className="px-5 py-4.5 border-t border-slate-850 bg-slate-900/10 grid grid-cols-4 gap-2 text-center text-[10px] text-slate-500">
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1"><Clock size={11} /> Latency</span>
              <b className="text-slate-200 mt-1">{metricsA?.latency ? `${metricsA.latency}ms` : '-'}</b>
            </div>
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1"><Cpu size={11} /> Tokens</span>
              <b className="text-slate-200 mt-1">{metricsA?.tokens ? metricsA.tokens : '-'}</b>
            </div>
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1"><DollarSign size={11} /> Cost</span>
              <b className="text-slate-200 mt-1">{metricsA?.cost ? `$${metricsA.cost.toFixed(6)}` : '-'}</b>
            </div>
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1"><FileText size={11} /> Words</span>
              <b className="text-slate-200 mt-1">{getWordCount(streamOutputA)}</b>
            </div>
          </div>
        </div>

        {/* Panel B Output */}
        <div className={`glass-panel rounded-2xl border flex flex-col justify-between overflow-hidden relative transition-all duration-500 ${
          isFinished && currentRunResult.winner === 'B' ? 'border-[#5B8CFF]/50 shadow-2xl shadow-[#5B8CFF]/10' : 'border-slate-800'
        }`}>
          {/* Winner banner badge */}
          {isFinished && currentRunResult.winner === 'B' && (
            <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-[#5B8CFF] to-[#00D4FF] text-white py-1 px-4 text-[9px] font-bold tracking-widest text-center flex items-center justify-center gap-1 shadow-md">
              <Award size={11} />
              WINNER: OPTION B
            </div>
          )}

          {/* Panel Header */}
          <div className={`px-5 h-12 bg-slate-900/60 border-b border-slate-850 flex items-center justify-between ${
            isFinished && currentRunResult.winner === 'B' ? 'mt-5' : ''
          }`}>
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B8CFF]" />
              Response B
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopy(streamOutputB, 'Response B')}
                disabled={!streamOutputB}
                className="p-1.5 text-slate-500 hover:text-slate-200 disabled:opacity-30 rounded-lg transition"
                title="Copy response markdown"
              >
                <Copy size={13} />
              </button>
              <button
                onClick={() => handleDownload(streamOutputB, 'response-b.md')}
                disabled={!streamOutputB}
                className="p-1.5 text-slate-500 hover:text-slate-200 disabled:opacity-30 rounded-lg transition"
                title="Download file"
              >
                <Download size={13} />
              </button>
            </div>
          </div>

          {/* Markdown content area */}
          <div className="p-6 text-xs prose prose-invert max-w-none min-h-[300px] overflow-y-auto leading-relaxed text-slate-350 bg-slate-950/20">
            {streamOutputB ? (
              <ReactMarkdown>{streamOutputB}</ReactMarkdown>
            ) : (
              <div className="flex flex-col items-center justify-center h-44 text-slate-500 space-y-3">
                <span className="w-5 h-5 border-2 border-slate-700 border-t-[#5B8CFF] rounded-full animate-spin" />
                <span className="text-[10px] font-medium animate-pulse">Waiting for server stream...</span>
              </div>
            )}
            {/* Live Typing Cursor */}
            {isStreaming && streamOutputB && (
              <span className="w-1 h-3 bg-[#5B8CFF] inline-block ml-0.5 animate-pulse" />
            )}
          </div>

          {/* Panel Footer Metrics */}
          <div className="px-5 py-4.5 border-t border-slate-850 bg-slate-900/10 grid grid-cols-4 gap-2 text-center text-[10px] text-slate-500">
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1"><Clock size={11} /> Latency</span>
              <b className="text-slate-200 mt-1">{metricsB?.latency ? `${metricsB.latency}ms` : '-'}</b>
            </div>
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1"><Cpu size={11} /> Tokens</span>
              <b className="text-slate-200 mt-1">{metricsB?.tokens ? metricsB.tokens : '-'}</b>
            </div>
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1"><DollarSign size={11} /> Cost</span>
              <b className="text-slate-200 mt-1">{metricsB?.cost ? `$${metricsB.cost.toFixed(6)}` : '-'}</b>
            </div>
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1"><FileText size={11} /> Words</span>
              <b className="text-slate-200 mt-1">{getWordCount(streamOutputB)}</b>
            </div>
          </div>
        </div>

      </div>

      {/* Evaluation metrics and Voting card */}
      {isFinished && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          
          {/* Evaluation Scores breakdown */}
          {overallScores && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-8 space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <TrendingUp size={15} className="text-[#6C63FF]" />
                  LLM-Based Automated Evaluation
                </span>
                <p className="text-[10px] text-slate-500">Intelligent criteria scoring computed automatically on comparison outputs.</p>
              </div>

              {/* Progress bars list */}
              <div className="space-y-3.5">
                {[
                  { name: 'Tone Matching', score: overallScores.tone, desc: 'Vocabulary style & vibe check' },
                  { name: 'Context Accuracy', score: overallScores.accuracy, desc: 'Adherence to prompt variables instructions' },
                  { name: 'Output Structural Length', score: overallScores.length, desc: 'Formatting matching length boundaries' },
                  { name: 'Grammar & Formatting', score: overallScores.grammar, desc: 'Markdown layout & syntax validation' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-slate-350">{item.name}</span>
                      <span className="font-bold text-[#6C63FF]">{item.score.toFixed(1)}/10</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                      <motion.div 
                        className="bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.score * 10}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Voting Actions Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 lg:col-span-4 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <ThumbsUp size={15} className="text-[#00D4FF]" />
                Cast Your Vote
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                Your feedback adjusts project stats, updating the accuracy charts logs in the history database.
              </p>
            </div>

            <div className="space-y-2.5 my-5">
              <button
                onClick={() => handleVote('A')}
                disabled={vote !== null || savingVote}
                className={`w-full py-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition ${
                  vote === 'A' 
                    ? 'bg-[#6C63FF]/20 text-[#6C63FF] border-[#6C63FF]' 
                    : 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white'
                }`}
              >
                Option A Performed Better
              </button>

              <button
                onClick={() => handleVote('B')}
                disabled={vote !== null || savingVote}
                className={`w-full py-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition ${
                  vote === 'B' 
                    ? 'bg-[#5B8CFF]/20 text-[#5B8CFF] border-[#5B8CFF]' 
                    : 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white'
                }`}
              >
                Option B Performed Better
              </button>

              <button
                onClick={() => handleVote('Tie')}
                disabled={vote !== null || savingVote}
                className={`w-full py-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition ${
                  vote === 'Tie' 
                    ? 'bg-slate-850 border-slate-700 text-white' 
                    : 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white'
                }`}
              >
                It is a Tie / Split Decision
              </button>
            </div>

            {vote ? (
              <span className="text-[9px] text-[#22C55E] flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider text-center">
                ✓ Voted Successfully
              </span>
            ) : (
              <span className="text-[9px] text-slate-550 flex items-center justify-center gap-1 text-center">
                <HelpCircle size={10} /> Choose which completion was superior.
              </span>
            )}
          </div>

        </motion.div>
      )}

    </div>
  );
};
export default LiveComparison;
