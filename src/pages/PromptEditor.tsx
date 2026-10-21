import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FolderGit, 
  Play, 
  Copy, 
  Trash2, 
  FileSpreadsheet, 
  FileText,
  HelpCircle
} from 'lucide-react';
import api from '../services/api';
import type { Project } from '../types';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

export const PromptEditor: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { startComparison } = useSocket();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);

  // Editor states (Starts empty for a real working sandbox)
  const [promptA, setPromptA] = useState('');
  const [promptB, setPromptB] = useState('');

  // Variables parsed from prompts
  const [variables, setVariables] = useState<string[]>([]);
  
  // Variable values mapping
  const [inputVariables, setInputVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPlaygroundData = async () => {
      try {
        const data = await api.getProjects();
        setProjects(data);
        
        // Select project if provided in query param
        const paramId = searchParams.get('projectId');
        if (paramId) {
          setSelectedProjectId(paramId);
        } else if (data.length > 0) {
          setSelectedProjectId(data[0].id);
        }
      } catch (err) {
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchPlaygroundData();
  }, [searchParams]);

  // Scan prompts for variables inside brackets: {variable_name}
  useEffect(() => {
    const regex = /\{([a-zA-Z0-9_]+)\}/g;
    const foundVars = new Set<string>();
    
    let match;
    while ((match = regex.exec(promptA)) !== null) {
      foundVars.add(match[1]);
    }
    while ((match = regex.exec(promptB)) !== null) {
      foundVars.add(match[1]);
    }

    const varList = Array.from(foundVars);
    setVariables(varList);

    // Initialize new variables with empty strings if not present
    setInputVariables((prev) => {
      const next = { ...prev };
      varList.forEach((v) => {
        if (next[v] === undefined) {
          next[v] = '';
        }
      });
      return next;
    });
  }, [promptA, promptB]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleVariableChange = (key: string, val: string) => {
    setInputVariables((prev) => ({ ...prev, [key]: val }));
  };

  // Real CSV parsing using the HTML FileReader API
  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 2) {
        toast.error('CSV file must have a header row and at least one data row.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const firstRow = lines[1].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));

      const newVars: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (header) {
          newVars[header] = firstRow[index] || '';
        }
      });

      setInputVariables(prev => ({ ...prev, ...newVars }));
      toast.success(`Successfully parsed CSV! Imported variables: ${headers.join(', ')}`);
    };

    reader.onerror = () => {
      toast.error('Failed to read CSV file.');
    };

    reader.readAsText(file);
  };

  const handleRunComparison = () => {
    if (!selectedProjectId) {
      toast.error('Please select or create a project first');
      return;
    }
    if (!promptA.trim() || !promptB.trim()) {
      toast.error('Both Prompt A and Prompt B must be filled out');
      return;
    }

    const activeProject = projects.find((p) => p.id === selectedProjectId);
    
    // Start WebSocket stream comparison
    startComparison({
      projectId: selectedProjectId,
      projectName: activeProject?.name || 'Active Playground',
      promptA,
      promptB,
      variables: inputVariables
    });

    // Navigate to Live Comparison screen
    navigate('/compare/live');
  };

  // Synchronized line counts for gutter display
  const getLineCountGutter = (text: string) => {
    const lines = text.split('\n');
    return lines.map((_, i) => (
      <div key={i} className="text-[10px] text-slate-600 select-none leading-5">{i + 1}</div>
    ));
  };

  if (loading) {
    return (
      <div className="space-y-6 py-2 animate-pulse">
        <div className="h-8 w-44 bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96 bg-slate-800/20 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Editor Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Prompt Comparison Editor</h1>
          <p className="text-xs text-slate-400">Write two prompt variations side-by-side and evaluate LLM streams.</p>
        </div>

        {/* Project Selector dropdown */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <FolderGit size={15} className="text-slate-400" />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3.5 py-2 text-xs text-slate-200 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Prompt Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Prompt A Panel */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between">
          <div className="px-5 h-12 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]" />
              Prompt Option A
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleCopy(promptA, 'Prompt A')}
                className="p-1.5 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                title="Copy to clipboard"
              >
                <Copy size={13} />
              </button>
              <button 
                onClick={() => setPromptA('')}
                className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                title="Clear content"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Prompt textarea layout with line numbers */}
          <div className="flex bg-slate-950/40 min-h-[220px] p-4 font-mono text-xs">
            <div className="line-numbers-gutter pr-3 border-r border-slate-800/60 select-none">
              {getLineCountGutter(promptA)}
            </div>
            
            <textarea
              value={promptA}
              onChange={(e) => setPromptA(e.target.value)}
              placeholder="Type Prompt version A here. Use {variableName} to declare variable inputs..."
              className="flex-1 pl-3 bg-transparent text-slate-200 border-none outline-none resize-none leading-5 focus:ring-0 focus:outline-none"
            />
          </div>

          {/* Footer Metrics */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/10 flex items-center justify-between text-[10px] text-slate-500">
            <span>Chars: <b className="text-slate-350">{promptA.length}</b></span>
            <span>Est. Tokens: <b className="text-slate-350">{Math.ceil(promptA.length / 4)}</b></span>
          </div>
        </div>

        {/* Prompt B Panel */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between">
          <div className="px-5 h-12 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B8CFF]" />
              Prompt Option B
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleCopy(promptB, 'Prompt B')}
                className="p-1.5 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                title="Copy to clipboard"
              >
                <Copy size={13} />
              </button>
              <button 
                onClick={() => setPromptB('')}
                className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                title="Clear content"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Prompt textarea layout with line numbers */}
          <div className="flex bg-slate-950/40 min-h-[220px] p-4 font-mono text-xs">
            <div className="line-numbers-gutter pr-3 border-r border-slate-800/60 select-none">
              {getLineCountGutter(promptB)}
            </div>
            
            <textarea
              value={promptB}
              onChange={(e) => setPromptB(e.target.value)}
              placeholder="Type Prompt version B here. Use {variableName} to declare variable inputs..."
              className="flex-1 pl-3 bg-transparent text-slate-200 border-none outline-none resize-none leading-5 focus:ring-0 focus:outline-none"
            />
          </div>

          {/* Footer Metrics */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/10 flex items-center justify-between text-[10px] text-slate-500">
            <span>Chars: <b className="text-slate-350">{promptB.length}</b></span>
            <span>Est. Tokens: <b className="text-slate-350">{Math.ceil(promptB.length / 4)}</b></span>
          </div>
        </div>

      </div>

      {/* Variables and Sample Inputs Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-800 text-[#00D4FF]">
              <FileText size={15} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-200 block">Prompt Variables Inputs</span>
              <span className="text-[10px] text-slate-500">Inputs matching the brackets variables declared in the instructions above.</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label
              className="flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-bold text-slate-300 hover:text-slate-100 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer transition"
              title="Upload CSV to parse variables"
            >
              <FileSpreadsheet size={13} className="text-emerald-500" />
              Import CSV File
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Variables Inputs fields grid */}
        {variables.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
            {variables.map((v) => (
              <div key={v} className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
                  {`{${v}}`}
                </span>
                
                <input
                  type="text"
                  value={inputVariables[v] || ''}
                  onChange={(e) => handleVariableChange(v, e.target.value)}
                  placeholder={`Value for {${v}}`}
                  className="w-full px-4 py-2.5 text-xs text-slate-200 bg-slate-950 border border-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]/50 rounded-xl transition"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 border border-dashed border-slate-800/80 rounded-xl text-center text-slate-500 text-xs italic">
            No variables found in Prompt A or Prompt B instructions. Use bracket notation (e.g. {'{topic}'}) to parameterize your prompts.
          </div>
        )}

        {/* Action Run Comparison Buttons */}
        <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
            <HelpCircle size={12} className="text-slate-400" />
            Comparison feeds variables concurrently to Prompt A & B and streams results side-by-side.
          </span>

          <button
            onClick={handleRunComparison}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-bold text-white bg-gradient-to-r from-[#6C63FF] to-[#5B8CFF] hover:opacity-95 rounded-xl shadow-lg shadow-[#6C63FF]/20 border border-[#6C63FF]/30 transition"
          >
            Run A/B Comparison
            <Play size={11} fill="white" />
          </button>
        </div>

      </div>

    </div>
  );
};
export default PromptEditor;
