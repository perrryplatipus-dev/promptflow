import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { Project, PromptRun } from './services/storage';
import {
  getProjects,
  getHistory,
  createProject,
  updateProject,
  deleteProject,
  createHistory,
  deleteHistory,
  updateProjectTimestamp,
  incrementProjectVersions,
  findUserByEmail,
  createUser
} from './services/dbStorage';
import { runPromptStream, runAutomatedEvaluation } from './services/llm';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Nodemailer SMTP Transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// In-Memory store for active OTP codes
const otpMap = new Map<string, { otp: string; expiresAt: number }>();

// PostgreSQL Authentication Endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email and password are required'
      });
    }

    const formattedEmail = email.trim().toLowerCase();

    const existingUser = await findUserByEmail(formattedEmail);

    if (existingUser) {
      return res.status(409).json({
        error: 'An account with this email address already exists.'
      });
    }

    const user = await createUser({
      name: name.trim(),
      email: formattedEmail,
      password,
      company: company || 'Indie Builder'
    });

    res.status(201).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        company: company || 'Indie Builder',
        role: 'user'
      }
    });
  } catch (err) {
    console.error('Registration failed:', err);
    res.status(500).json({
      error: 'Registration failed'
    });
  }
});
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const formattedEmail = email.trim().toLowerCase();

    const user = await findUserByEmail(formattedEmail);

    if (!user) {
      return res.status(404).json({
        error: 'Account not found. Please register first.'
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        error: 'Incorrect credentials. Check password and try again.'
      });
    }

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        company: 'Indie Builder',
        role: user.email === 'admin@promptflow.ai' ? 'admin' : 'user'
      }
    });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({
      error: 'Login failed'
    });
  }
});
// OTP Verification REST Endpoints
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }
  
  const formattedEmail = email.trim().toLowerCase();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  otpMap.set(formattedEmail, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
  });

  // Log to Node terminal for immediate sandbox visual verification
  console.log(`\n==========================================`);
  console.log(`[AUTH OTP CODE for ${formattedEmail}]: ${otp}`);
  console.log(`==========================================\n`);

  const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSMTP) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'PromptFlow <noreply@promptflow.ai>',
        to: formattedEmail,
        subject: 'PromptFlow Login Verification OTP',
        text: `Your PromptFlow login verification OTP code is: ${otp}. It is valid for 5 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #334155; border-radius: 12px; background: #0f172a; color: #f8fafc; text-align: left;">
            <h2 style="color: #6C63FF; text-align: center;">PromptFlow Verification</h2>
            <p style="color: #f8fafc;">Hello,</p>
            <p style="color: #f8fafc;">Verify your sign-in request to PromptFlow. Please enter the following 6-digit One-Time Password (OTP):</p>
            <div style="font-size: 32px; font-weight: bold; text-align: center; color: #00D4FF; letter-spacing: 5px; margin: 30px 0; background: #1e293b; padding: 15px; border-radius: 8px;">
              ${otp}
            </div>
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 30px;">
              This code expires in 5 minutes. If you did not request this login, please ignore this email.
            </p>
          </div>
        `
      });
      return res.json({ success: true, method: 'email', message: 'OTP verification code sent to your inbox!' });
    } catch (e) {
      console.error('Failed to send SMTP email:', e);
      return res.json({ 
        success: true, 
        method: 'terminal', 
        otp,
        message: 'SMTP email dispatch failed! OTP has been logged to the terminal console.' 
      });
    }
  } else {
    return res.json({ 
      success: true, 
      method: 'terminal', 
      otp,
      message: 'SMTP is not configured in .env! OTP code has been logged to your server terminal console.' 
    });
  }
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and OTP code are required' });
  }

  const key = email.trim().toLowerCase();
  const record = otpMap.get(key);

  if (!record) {
    return res.status(400).json({ error: 'No active OTP verification session found.' });
  }

  if (Date.now() > record.expiresAt) {
    otpMap.delete(key);
    return res.status(400).json({ error: 'OTP code has expired. Request a new one.' });
  }

  if (record.otp !== code.trim()) {
    return res.status(400).json({ error: 'Incorrect OTP code. Please check and try again.' });
  }

  otpMap.delete(key);
  res.json({ success: true, message: 'OTP verified successfully!' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow connections from frontend Vite dev server
    methods: ['GET', 'POST']
  }
});

// Real-Time Socket.io Stream Comparison Handlers
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('compare-prompts', async (data) => {
    try {
      const {
        projectId,
        projectName,
        promptA,
        promptB,
        variables = {},
        apiKeys = {},
        userEmail = 'guest@promptflow.ai'
      } = data;

      const providerA = apiKeys.providerA || 'mock';
      const providerB = apiKeys.providerB || 'mock';
      const keyA = providerA === 'openai' ? apiKeys.openai : apiKeys.gemini;
      const keyB = providerB === 'openai' ? apiKeys.openai : apiKeys.gemini;

      const [resA, resB] = await Promise.all([
        runPromptStream({
          prompt: promptA,
          variables,
          provider: providerA,
          apiKey: keyA,
          onToken: (token) => socket.emit('token-a', token),
        }).then((res) => {
          socket.emit('done-a', res);
          return res;
        }),
        runPromptStream({
          prompt: promptB,
          variables,
          provider: providerB,
          apiKey: keyB,
          onToken: (token) => socket.emit('token-b', token),
        }).then((res) => {
          socket.emit('done-b', res);
          return res;
        }),
      ]);

      const scores = runAutomatedEvaluation(resA.fullText, resB.fullText, promptA, promptB);
      const winner =
        resA.latency < resB.latency && scores.overall >= 8.5
          ? 'A'
          : resB.latency < resA.latency && scores.overall >= 8.5
          ? 'B'
          : scores.accuracy > 8.8
          ? 'A'
          : 'B';

      const runResult: PromptRun = {
        id: `run-${Date.now()}`,
        projectId,
        projectName,
        date: new Date().toISOString(),
        promptA,
        promptB,
        variables,
        outputA: resA.fullText,
        outputB: resB.fullText,
        latencyA: resA.latency,
        latencyB: resB.latency,
        tokensA: resA.tokensCount,
        tokensB: resB.tokensCount,
        costA: resA.cost,
        costB: resB.cost,
        winner,
        scores,
        userId: userEmail,
      };

      try {
        await createHistory(runResult);
        await updateProjectTimestamp(projectId);
      } catch (e) {
        console.warn('Failed to persist run to DB:', e);
      }

      socket.emit('comparison-finished', runResult);
    } catch (err: any) {
      console.error('Error during prompt comparison:', err);
      socket.emit('error', err?.message || 'An error occurred during comparison');
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});


// REST API Endpoints

// Projects endpoints
app.get('/api/projects', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] as string;
    const projects = await getProjects();

    if (userEmail === 'admin@promptflow.ai') {
      return res.json(projects);
    }

    const filtered = projects.filter((p) => p.userId === userEmail);
    res.json(filtered);
  } catch (err) {
    console.error('Failed to load projects:', err);
    res.status(500).json({ error: 'Failed to load projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, tags } = req.body;
    const userEmail = req.headers['x-user-email'] as string;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const now = new Date().toISOString();

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      description: description || '',
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
      versionsCount: 1,
      userId: userEmail
    };

    const createdProject = await createProject(newProject);

    res.status(201).json(createdProject);
  } catch (err) {
    console.error('Failed to create project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, tags, versionsCount } = req.body;

    const updatedProject = await updateProject(id, {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(tags !== undefined && { tags }),
      ...(versionsCount !== undefined && { versionsCount }),
      updatedAt: new Date().toISOString()
    });

    if (!updatedProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(updatedProject);
  } catch (err) {
    console.error('Failed to update project:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await deleteProject(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// History endpoints
app.get('/api/history', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] as string;
    const history = await getHistory();

    if (userEmail === 'admin@promptflow.ai') {
      return res.json(history);
    }

    const filtered = history.filter((h) => h.userId === userEmail);
    res.json(filtered);
  } catch (err) {
    console.error('Failed to load history:', err);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

app.post('/api/history', async (req, res) => {
  try {
    const run: PromptRun = req.body;
    const userEmail = req.headers['x-user-email'] as string;

    if (!run.projectId || !run.outputA || !run.outputB) {
      return res.status(400).json({ error: 'Invalid run data' });
    }

    const newRun: PromptRun = {
      ...run,
      id: run.id || `run-${Date.now()}`,
      date: run.date || new Date().toISOString(),
      userId: userEmail
    };

    const createdRun = await createHistory(newRun);

    await updateProjectTimestamp(run.projectId);

    res.status(201).json(createdRun);
  } catch (err) {
    console.error('Failed to create history:', err);
    res.status(500).json({ error: 'Failed to create history' });
  }
});

app.delete('/api/history/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await deleteHistory(id);

    if (!deleted) {
      return res.status(404).json({ error: 'History entry not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete history:', err);
    res.status(500).json({ error: 'Failed to delete history' });
  }
});
// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] as string;

    let history = await getHistory();
    let projects = await getProjects();

    if (userEmail !== 'admin@promptflow.ai') {
      history = history.filter((h) => h.userId === userEmail);
      projects = projects.filter((p) => p.userId === userEmail);
    }

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

    const avgLatency =
      history.length > 0
        ? totalLatency / (history.length * 2)
        : 0;

    const avgAccuracy =
      history.length > 0
        ? history.reduce((acc, curr) => acc + curr.scores.overall, 0) / history.length
        : 0;

    res.json({
      totalProjects: projects.length,
      totalRuns: history.length,
      totalCost,
      totalTokens,
      avgLatency,
      avgAccuracy,
      wins: { winsA, winsB, ties }
    });
  } catch (err) {
    console.error('Failed to load analytics:', err);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});