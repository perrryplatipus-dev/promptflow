import axios from 'axios';
import type { Project, PromptRun, AnalyticsSummary } from '../types';

const API_BASE = 'http://localhost:3001/api';

// Intercept all requests to inject the current user's email scoping header
axios.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('promptflow_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user && user.email) {
        config.headers['x-user-email'] = user.email;
      }
    } catch (e) {
      console.error('Failed to parse user email header', e);
    }
  }
  return config;
});

// Create a local storage mock DB for absolute resilience if the backend is down
const getLocalProjects = (): Project[] => {
  const saved = localStorage.getItem('promptflow_local_projects');
  if (saved) return JSON.parse(saved);
  const defaults: Project[] = [];
  localStorage.setItem('promptflow_local_projects', JSON.stringify(defaults));
  return defaults;
};

const saveLocalProjects = (projects: Project[]) => {
  localStorage.setItem('promptflow_local_projects', JSON.stringify(projects));
};

const getLocalHistory = (): PromptRun[] => {
  const saved = localStorage.getItem('promptflow_local_history');
  if (saved) return JSON.parse(saved);
  const defaults: PromptRun[] = [];
  localStorage.setItem('promptflow_local_history', JSON.stringify(defaults));
  return defaults;
};

const saveLocalHistory = (history: PromptRun[]) => {
  localStorage.setItem('promptflow_local_history', JSON.stringify(history));
};

export const api = {
  // Fetch Projects
  async getProjects(): Promise<Project[]> {
    try {
      const res = await axios.get(`${API_BASE}/projects`, { timeout: 2000 });
      return res.data;
    } catch (e) {
      console.warn('REST API failed, using LocalStorage projects');
      return getLocalProjects();
    }
  },

  // Create Project
  async createProject(name: string, description: string, tags: string[]): Promise<Project> {
    try {
      const res = await axios.post(`${API_BASE}/projects`, { name, description, tags }, { timeout: 2000 });
      return res.data;
    } catch (e) {
      console.warn('REST API failed, saving project to LocalStorage');
      const projects = getLocalProjects();
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        name,
        description,
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        versionsCount: 1
      };
      projects.unshift(newProj);
      saveLocalProjects(projects);
      return newProj;
    }
  },

  // Update Project
  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    try {
      const res = await axios.put(`${API_BASE}/projects/${id}`, data, { timeout: 2000 });
      return res.data;
    } catch (e) {
      console.warn('REST API failed, updating project in LocalStorage');
      const projects = getLocalProjects();
      const idx = projects.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error('Project not found');
      
      const updated = { ...projects[idx], ...data, updatedAt: new Date().toISOString() };
      projects[idx] = updated;
      saveLocalProjects(projects);
      return updated;
    }
  },

  // Delete Project
  async deleteProject(id: string): Promise<boolean> {
    try {
      await axios.delete(`${API_BASE}/projects/${id}`, { timeout: 2000 });
      return true;
    } catch (e) {
      console.warn('REST API failed, deleting project from LocalStorage');
      const projects = getLocalProjects();
      const filtered = projects.filter((p) => p.id !== id);
      saveLocalProjects(filtered);

      const history = getLocalHistory();
      const filteredHistory = history.filter((h) => h.projectId !== id);
      saveLocalHistory(filteredHistory);
      return true;
    }
  },

  // Fetch History Runs
  async getHistory(): Promise<PromptRun[]> {
    try {
      const res = await axios.get(`${API_BASE}/history`, { timeout: 2000 });
      return res.data;
    } catch (e) {
      console.warn('REST API failed, using LocalStorage run history');
      return getLocalHistory();
    }
  },

  // Save Run to History
  async saveRun(run: Omit<PromptRun, 'id' | 'date'>): Promise<PromptRun> {
    try {
      const res = await axios.post(`${API_BASE}/history`, run, { timeout: 2000 });
      return res.data;
    } catch (e) {
      console.warn('REST API failed, saving run to LocalStorage history');
      const history = getLocalHistory();
      const newRun: PromptRun = {
        ...run,
        id: `run-${Date.now()}`,
        date: new Date().toISOString()
      };
      history.unshift(newRun);
      saveLocalHistory(history);

      // Increment versions count on project
      const projects = getLocalProjects();
      const pIndex = projects.findIndex((p) => p.id === run.projectId);
      if (pIndex !== -1) {
        projects[pIndex].versionsCount += 1;
        projects[pIndex].updatedAt = new Date().toISOString();
        saveLocalProjects(projects);
      }

      return newRun;
    }
  },

  // Delete Run from History
  async deleteRun(id: string): Promise<boolean> {
    try {
      await axios.delete(`${API_BASE}/history/${id}`, { timeout: 2000 });
      return true;
    } catch (e) {
      console.warn('REST API failed, deleting run from LocalStorage history');
      const history = getLocalHistory();
      const filtered = history.filter((h) => h.id !== id);
      saveLocalHistory(filtered);
      return true;
    }
  },

  // Fetch Analytics Summary
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    try {
      const res = await axios.get(`${API_BASE}/analytics`, { timeout: 2000 });
      return res.data;
    } catch (e) {
      console.warn('REST API failed, calculating LocalStorage analytics');
      const history = getLocalHistory();
      const projects = getLocalProjects();
      
      let winsA = 0;
      let winsB = 0;
      let ties = 0;
      let totalCost = 0;
      let totalTokens = 0;
      let totalLatency = 0;

      history.forEach((run) => {
        if (run.winner === 'A') winsA++;
        else if (run.winner === 'B') winsB++;
        else if (run.winner === 'Tie') ties++;
        
        totalCost += (run.costA || 0) + (run.costB || 0);
        totalTokens += (run.tokensA || 0) + (run.tokensB || 0);
        totalLatency += (run.latencyA || 0) + (run.latencyB || 0);
      });

      const avgLatency = history.length > 0 ? (totalLatency / (history.length * 2)) : 0;
      const avgAccuracy = history.length > 0 
        ? history.reduce((acc, curr) => acc + curr.scores.overall, 0) / history.length
        : 0;

      return {
        totalProjects: projects.length,
        totalRuns: history.length,
        totalCost,
        totalTokens,
        avgLatency,
        avgAccuracy,
        wins: { winsA, winsB, ties }
      };
    }
  },

  // Send OTP Verification Email
  async sendOtp(email: string): Promise<{ success: boolean; method: 'email' | 'terminal'; message: string }> {
    const res = await axios.post(`${API_BASE}/auth/send-otp`, { email });
    return res.data;
  },

  // Verify OTP Verification Code
  async verifyOtp(email: string, code: string): Promise<{ success: boolean; message: string }> {
    const res = await axios.post(`${API_BASE}/auth/verify-otp`, { email, code });
    return res.data;
  }
};
export default api;
