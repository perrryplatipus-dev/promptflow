import fs from 'fs';
import path from 'path';

export interface Project {
  id: string;
  name: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  versionsCount: number;
  userId?: string; // Scoping owner ID
}

export interface PromptVersion {
  id: string;
  projectId: string;
  promptA: string;
  promptB: string;
  variables: string[];
  createdAt: string;
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
  latencyA: number; // in ms
  latencyB: number; // in ms
  tokensA: number;
  tokensB: number;
  costA: number;
  costB: number;
  winner: 'A' | 'B' | 'Tie' | null;
  scores: EvaluationScores;
  userId?: string; // Scoping owner ID
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Start with empty arrays so the user starts at 0
const DEFAULT_PROJECTS: Project[] = [];
const DEFAULT_HISTORY: PromptRun[] = [];

export function loadProjects(): Project[] {
  ensureDataDir();
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(DEFAULT_PROJECTS, null, 2), 'utf-8');
    return DEFAULT_PROJECTS;
  }
  try {
    const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse projects.json', e);
    return DEFAULT_PROJECTS;
  }
}

export function saveProjects(projects: Project[]) {
  ensureDataDir();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
}

export function loadHistory(): PromptRun[] {
  ensureDataDir();
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(DEFAULT_HISTORY, null, 2), 'utf-8');
    return DEFAULT_HISTORY;
  }
  try {
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse history.json', e);
    return DEFAULT_HISTORY;
  }
}

export function saveHistory(history: PromptRun[]) {
  ensureDataDir();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
}
