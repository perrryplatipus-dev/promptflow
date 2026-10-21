import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { PromptRun } from '../types';
import { useSettings } from './SettingsContext';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isStreaming: boolean;
  streamOutputA: string;
  streamOutputB: string;
  metricsA: { latency: number; tokens: number; cost: number } | null;
  metricsB: { latency: number; tokens: number; cost: number } | null;
  currentRunResult: PromptRun | null;
  startComparison: (data: {
    projectId: string;
    projectName: string;
    promptA: string;
    promptB: string;
    variables: Record<string, string>;
  }) => void;
  resetComparison: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const pushLocalNotification = (title: string, desc: string) => {
  try {
    const saved = localStorage.getItem('promptflow_notifications');
    const list = saved ? JSON.parse(saved) : [];
    list.unshift({
      id: Date.now(),
      title,
      desc,
      time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      unread: true
    });
    localStorage.setItem('promptflow_notifications', JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save notification', e);
  }
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { apiKeys } = useSettings();
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Streaming states
  const [streamOutputA, setStreamOutputA] = useState('');
  const [streamOutputB, setStreamOutputB] = useState('');
  
  // Metrics states
  const [metricsA, setMetricsA] = useState<{ latency: number; tokens: number; cost: number } | null>(null);
  const [metricsB, setMetricsB] = useState<{ latency: number; tokens: number; cost: number } | null>(null);
  
  const [currentRunResult, setCurrentRunResult] = useState<PromptRun | null>(null);
  
  const serverUrl = 'http://localhost:3001';
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Attempt connection
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to PromptFlow WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', () => {
      console.warn('Could not connect to WebSocket server. Client-side simulation fallback active.');
      setIsConnected(false);
    });

    // Handle incoming stream tokens
    newSocket.on('token-a', (token: string) => {
      setStreamOutputA((prev) => prev + token);
    });

    newSocket.on('token-b', (token: string) => {
      setStreamOutputB((prev) => prev + token);
    });

    // Handle direct completion of single prompts
    newSocket.on('done-a', (data: any) => {
      setMetricsA({
        latency: data.latency,
        tokens: data.tokensCount,
        cost: data.cost,
      });
    });

    newSocket.on('done-b', (data: any) => {
      setMetricsB({
        latency: data.latency,
        tokens: data.tokensCount,
        cost: data.cost,
      });
    });

    // Handle full run finished
    newSocket.on('comparison-finished', (runResult: PromptRun) => {
      setCurrentRunResult(runResult);
      setIsStreaming(false);
      pushLocalNotification(
        `${runResult.projectName} A/B Test Finished`,
        `Comparison complete. Grade overall: ${runResult.scores.overall.toFixed(1)}/10. Winner: Option ${runResult.winner}`
      );
    });

    newSocket.on('error', (err: string) => {
      console.error('Socket error received:', err);
      setIsStreaming(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const resetComparison = useCallback(() => {
    setStreamOutputA('');
    setStreamOutputB('');
    setMetricsA(null);
    setMetricsB(null);
    setCurrentRunResult(null);
    setIsStreaming(false);
  }, []);

  // Client-Side fallback simulation if Socket server is not running
  const simulateComparisonOffline = useCallback(async (data: {
    projectId: string;
    projectName: string;
    promptA: string;
    promptB: string;
    variables: Record<string, string>;
  }) => {
    console.log('Running offline simulation...');
    setIsStreaming(true);
    setStreamOutputA('');
    setStreamOutputB('');
    setMetricsA(null);
    setMetricsB(null);
    setCurrentRunResult(null);

    // Dynamic mock response text based on prompt
    const getMockText = (prompt: string, vars: Record<string, string>) => {
      let rendered = prompt;
      for (const [k, v] of Object.entries(vars)) {
        rendered = rendered.replace(new RegExp(`{${k}}`, 'g'), v);
      }
      
      const lower = rendered.toLowerCase();
      if (lower.includes('sql') || lower.includes('select')) {
        return `\`\`\`sql\nSELECT user_id, COUNT(*) FROM runs GROUP BY user_id;\n\`\`\`\n\nGenerated offline. Connect backend to run live LLMs!`;
      }
      if (lower.includes('marketing') || lower.includes('saas')) {
        return `# PromptFlow Offline\n\nExperience seamless side-by-side prompt debugging. Start your local server at \`localhost:3001\` to run real Gemini/OpenAI queries.`;
      }
      return `### Offline Stream Simulation\nThis is a simulation representing a side-by-side streaming panel response. Use variables: ${JSON.stringify(vars)}`;
    };

    const textA = getMockText(data.promptA, data.variables);
    const textB = getMockText(data.promptB, data.variables);

    // Simulated timing variables
    const intervalMs = 25;
    const charPerToken = 3;

    let indexA = 0;
    let indexB = 0;
    
    const startA = Date.now();
    const startB = Date.now();

    // Stream A
    const timerA = setInterval(() => {
      if (indexA < textA.length) {
        const chunk = textA.substring(indexA, indexA + charPerToken);
        setStreamOutputA((prev) => prev + chunk);
        indexA += charPerToken;
      } else {
        clearInterval(timerA);
        const latency = Date.now() - startA;
        const tokens = Math.ceil(textA.length / 4);
        setMetricsA({
          latency,
          tokens,
          cost: (tokens * 0.2) / 1000000
        });
      }
    }, intervalMs);

    // Stream B
    const timerB = setInterval(() => {
      if (indexB < textB.length) {
        const chunk = textB.substring(indexB, indexB + charPerToken);
        setStreamOutputB((prev) => prev + chunk);
        indexB += charPerToken;
      } else {
        clearInterval(timerB);
        const latency = Date.now() - startB;
        const tokens = Math.ceil(textB.length / 4);
        setMetricsB({
          latency,
          tokens,
          cost: (tokens * 0.25) / 1000000
        });
      }
    }, intervalMs + 5); // small offset

    // Wait until both streams complete to finalize
    const checkInterval = setInterval(() => {
      if (indexA >= textA.length && indexB >= textB.length) {
        clearInterval(checkInterval);
        
        const latencyA = Date.now() - startA;
        const latencyB = Date.now() - startB;
        const tokensA = Math.ceil(textA.length / 4);
        const tokensB = Math.ceil(textB.length / 4);

        const scores = {
          tone: 8.8,
          accuracy: 9.0,
          length: 8.5,
          grammar: 9.5,
          overall: 8.95
        };

        const result: PromptRun = {
          id: `run-${Date.now()}`,
          projectId: data.projectId,
          projectName: data.projectName,
          date: new Date().toISOString(),
          promptA: data.promptA,
          promptB: data.promptB,
          variables: data.variables,
          outputA: textA,
          outputB: textB,
          latencyA,
          latencyB,
          tokensA,
          tokensB,
          costA: (tokensA * 0.2) / 1000000,
          costB: (tokensB * 0.25) / 1000000,
          winner: Math.random() > 0.5 ? 'A' : 'B',
          scores
        };

        // Save local history to in-memory state
        api.saveRun(result);

        setCurrentRunResult(result);
        setIsStreaming(false);
        pushLocalNotification(
          `${result.projectName} A/B Test Finished (Simulated)`,
          `Comparison complete. Grade overall: ${result.scores.overall.toFixed(1)}/10. Winner: Option ${result.winner}`
        );
      }
    }, 100);

  }, []);

  const startComparison = useCallback((data: {
    projectId: string;
    projectName: string;
    promptA: string;
    promptB: string;
    variables: Record<string, string>;
  }) => {
    resetComparison();
    setIsStreaming(true);

    if (isConnected && socketRef.current) {
      // Connect to server streaming
      console.log('Sending comparison request to socket server...');
      socketRef.current.emit('compare-prompts', {
        ...data,
        apiKeys: {
          openai: apiKeys.openai,
          gemini: apiKeys.gemini,
          providerA: apiKeys.providerA,
          providerB: apiKeys.providerB
        },
        userEmail: user?.email || 'guest@promptflow.ai'
      });
    } else {
      // Fallback offline simulation
      simulateComparisonOffline(data);
    }
  }, [isConnected, apiKeys, user, resetComparison, simulateComparisonOffline]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        isStreaming,
        streamOutputA,
        streamOutputB,
        metricsA,
        metricsB,
        currentRunResult,
        startComparison,
        resetComparison
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
