export interface Project {
  id: string;
  name: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  versionsCount: number;
  userId?: string; // scoping owner ID
}

export interface EvaluationScores {
  tone: number;
  accuracy: number;
  length: number;
  grammar: number;
  overall: number;
}

export interface PromptRun {
  id: string;
  projectId: string;
  projectName: string;
  date: string;
  promptA: string;
  promptB: string;
  variables: Record<string, string>;
  outputA: string;
  outputB: string;
  latencyA: number;
  latencyB: number;
  tokensA: number;
  tokensB: number;
  costA: number;
  costB: number;
  winner: 'A' | 'B' | 'Tie' | null;
  scores: EvaluationScores;
  userId?: string; // scoping owner ID
}

export interface ApiKeys {
  openai?: string;
  gemini?: string;
  providerA?: 'openai' | 'gemini' | 'mock';
  providerB?: 'openai' | 'gemini' | 'mock';
}

export interface UserProfile {
  name: string;
  email: string;
  company: string;
  avatar: string;
  role: 'user' | 'admin';
}

export interface AnalyticsSummary {
  totalProjects: number;
  totalRuns: number;
  totalCost: number;
  totalTokens: number;
  avgLatency: number;
  avgAccuracy: number;
  wins: {
    winsA: number;
    winsB: number;
    ties: number;
  };
}
