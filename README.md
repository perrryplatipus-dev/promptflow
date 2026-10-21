<div align="center">

# ⚡ PromptFlow

**Enterprise-Grade Real-Time A/B Testing & Evaluation Platform for LLM Prompts**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7+-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Prisma](https://img.shields.io/badge/Prisma-7.1+-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

<p align="center">
  Stop guessing how prompt tweaks affect production outputs. Compare, stream, benchmark, and score competing LLM prompts side-by-side in real time.
</p>

[Explore Features](#-key-features) • [System Architecture](#-system-architecture) • [Quickstart Guide](#-quickstart-guide) • [API & Sockets](#-api--websocket-reference) • [Evaluation Engine](#-automated-evaluation-engine)

---

</div>

## 📖 Overview

Prompt engineering in modern AI applications often feels like trial and error in production. Modifying a system prompt to fix tone can silently bloat token costs, spike generation latency, or degrade factual consistency.

**PromptFlow** solves this by providing a unified, developer-first A/B experimentation environment. Teams can craft competing prompt variations, inject dynamic variables, stream outputs concurrently through WebSockets, evaluate responses with multi-dimensional criteria (Tone, Accuracy, Length, Grammar), and track cost and performance regressions across historical runs.

PromptFlow is architected with complete resilience: it operates seamlessly with **OpenAI (GPT-4o-mini)**, **Google Gemini (Gemini 1.5 Flash)**, or an intelligent **Mock LLM Simulator** for zero-cost offline local testing.

---

## ✨ Key Features

### 1. ⚔️ Side-by-Side Real-Time Streaming (A/B Playground)
- Dual-terminal streaming viewer powered by **Socket.io**.
- Real-time token generation with live typing cadence and zero UI stutter.
- Instant per-token latency counter ($ms$), token accumulator, and dynamic cost estimation ($USD$).

### 2. 🧩 Dynamic Variable Interpolation Engine
- Inject template variables into prompts using intuitive `{variable_name}` syntax.
- Real-time syntax detection and variable input form generation.
- Test variations across identical input payloads to eliminate bias.

### 3. 🎯 Multi-Provider Model Orchestration
- **OpenAI**: First-class support for `gpt-4o-mini` and OpenAI chat models.
- **Google Gemini**: Native streaming with `gemini-1.5-flash`.
- **Mock Simulator**: Offline-ready deterministic mock engine simulating code generation, customer support, and copywriting scenarios.

### 4. 📊 Automated Evaluation & Winner Benchmark
- Automated grading across 5 core dimensions:
  - **Tone**: Sentiment and appropriateness alignment.
  - **Accuracy**: Semantic correctness against intent.
  - **Length & Density**: Verbosity vs. conciseness balance.
  - **Grammar & Formatting**: Markdown, syntax, and structure check.
  - **Overall Score**: Weighted composite index ($1-10$).
- Automatic Winner Declaration (**Option A**, **Option B**, or **Tie**).

### 5. 📈 Analytics & Regression Tracking
- Visualized performance metrics powered by **Recharts**.
- Win/Loss distribution charts across prompt variants.
- Aggregate latency curves, cumulative token consumption, and cost tracking.

### 6. 🗂️ Project & Version Management
- Organize experiments by projects with tagged classifications.
- Version history ledger tracking prompt evolutions, diffs, and historical metrics.
- Scoped multi-tenant workspace with user-level isolation.

### 7. 🔐 Authentication & Transactional OTP
- Email & password authentication with PostgreSQL persistence.
- 6-digit One-Time Password (OTP) verification with **Nodemailer SMTP** (Gmail/Apple Mail).
- Terminal fallback mode logging OTP codes directly to the server console during local development.

### 8. 🛡️ Offline-First Fallback Resilience
- Client automatically detects server status.
- If PostgreSQL or the backend server is unreachable, PromptFlow seamlessly falls back to browser **LocalStorage** and client-side stream simulation without breaking the workflow.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Frontend["React 19 + Vite Client (Port 5173)"]
        UI["Tailwind CSS UI + Framer Motion"]
        SocketClient["Socket.io Client Context"]
        ApiClient["Axios API Client + LocalStorage Fallback"]
        State["Settings / Auth / Socket Providers"]
    end

    subgraph Backend["Express + Node.js Server (Port 3001)"]
        Router["Express REST Endpoints (/api)"]
        SocketServer["Socket.io Streaming Gateway"]
        AuthService["Auth & Nodemailer OTP Service"]
        LLMOrchestrator["LLM Orchestrator Service"]
    end

    subgraph Data["Persistence Layer"]
        Prisma["Prisma ORM"]
        Postgres[(PostgreSQL Database)]
        JSONFallback[(Local JSON Storage Backup)]
    end

    subgraph Providers["External LLM & SMTP APIs"]
        OpenAI["OpenAI API (gpt-4o-mini)"]
        Gemini["Google Gemini (gemini-1.5-flash)"]
        SMTP["SMTP Transporter (Gmail / Ethereal)"]
    end

    UI --> State
    State --> SocketClient
    State --> ApiClient

    SocketClient <-->|WebSocket Stream Events| SocketServer
    ApiClient <-->|REST Requests & Headers| Router

    Router --> AuthService
    Router --> Prisma
    SocketServer --> LLMOrchestrator

    LLMOrchestrator --> OpenAI
    LLMOrchestrator --> Gemini
    AuthService --> SMTP

    Prisma --> Postgres
    Prisma -.->|Fallback| JSONFallback
```

---

## 🔄 End-to-End A/B Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer / Prompt Engineer
    participant UI as PromptFlow Studio
    participant Gateway as WebSocket Server
    participant Engine as LLM Orchestrator
    participant ModelA as Provider A (Prompt A)
    participant ModelB as Provider B (Prompt B)
    participant DB as Prisma / Postgres

    Dev->>UI: Enter Prompt A, Prompt B, and Variables {name, role}
    Dev->>UI: Click "Start Live Comparison"
    UI->>Gateway: emit('compare-prompts', payload)
    
    par Stream Prompt A
        Gateway->>Engine: runPromptStream(Prompt A)
        Engine->>ModelA: Stream Query
        ModelA-->>Gateway: Chunks
        Gateway-->>UI: emit('token-a', chunk)
        Gateway-->>UI: emit('done-a', { latency, tokens, cost })
    and Stream Prompt B
        Gateway->>Engine: runPromptStream(Prompt B)
        Engine->>ModelB: Stream Query
        ModelB-->>Gateway: Chunks
        Gateway-->>UI: emit('token-b', chunk)
        Gateway-->>UI: emit('done-b', { latency, tokens, cost })
    end

    Gateway->>Engine: runAutomatedEvaluation(outputA, outputB)
    Engine-->>Gateway: EvaluationScores { tone, accuracy, length, grammar, overall }
    Gateway->>DB: createHistory(PromptRun)
    Gateway-->>UI: emit('comparison-finished', runResult)
    UI->>Dev: Display side-by-side diff, Winner badge, and radar scores
```

---

## 💻 Tech Stack

| Domain | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | UI component hierarchy and type-safe state |
| **Build Tool** | Vite 8 + PostCSS | Ultra-fast Hot Module Replacement (HMR) and bundling |
| **Styling** | Tailwind CSS 3.4 | Modern dark-mode dashboard styling with glassmorphism |
| **Animations** | Framer Motion 11 | Smooth page transitions and streaming micro-interactions |
| **Icons** | Lucide React | Clean, developer-oriented icons |
| **Charts** | Recharts 2.12 | Latency, token, and score distribution visualizations |
| **Backend Runtime** | Node.js + Express 4 | REST routing, middleware, and request validation |
| **Real-Time Gateway**| Socket.io 4.7 | Dual full-duplex token streaming channels |
| **Database & ORM** | PostgreSQL + Prisma 7 | Structured schema, migrations, and relational queries |
| **AI SDKs** | `@google/generative-ai` & `openai` | Official client integrations for Gemini and GPT models |
| **Email Service** | Nodemailer 9 | Transactional 6-digit OTP delivery |

---

## 📁 Repository Structure

```text
PromptFlow/
├── public/                 # Static public assets (SVG icons, favicons)
├── src/                    # Frontend React application
│   ├── assets/             # Brand logos and hero graphics
│   ├── contexts/           # Global React Contexts
│   │   ├── AuthContext.tsx     # Session state, login, register, and token management
│   │   ├── SettingsContext.tsx # API keys (OpenAI, Gemini), theme, default providers
│   │   └── SocketContext.tsx   # Socket.io connection, live streams, and offline simulation
│   ├── layout/             # App shell layouts
│   │   ├── Navbar.tsx          # Top bar with user profile and quick stats
│   │   ├── Sidebar.tsx         # Navigation bar with route highlights
│   │   └── PageLayout.tsx      # Authenticated dashboard wrapper
│   ├── pages/              # Primary application views
│   │   ├── Auth/               # Login, Register, Forgot Password, Admin Login
│   │   ├── LandingPage.tsx     # Hero presentation, interactive simulator, FAQ
│   │   ├── Dashboard.tsx       # KPI cards, active projects, quick test launcher
│   │   ├── Projects.tsx        # Project CRUD, tag filters, version counters
│   │   ├── PromptEditor.tsx    # Dual prompt composer & dynamic variable parser
│   │   ├── LiveComparison.tsx  # Dual-terminal streaming viewer & winner badges
│   │   ├── History.tsx         # Historical runs table & run inspection modal
│   │   ├── Analytics.tsx       # Recharts dashboards (latency, costs, win ratios)
│   │   ├── Settings.tsx        # User profile, API key inputs, notification toggles
│   │   └── AdminDashboard.tsx  # Admin oversight & system-wide metrics
│   ├── services/           # Frontend API and storage services
│   │   └── api.ts              # Axios HTTP client with automatic LocalStorage fallback
│   ├── types/              # Unified TypeScript interfaces
│   │   └── index.ts            # Project, PromptRun, EvaluationScores, ApiKeys definitions
│   ├── App.tsx             # Route configuration and toast notification wrapper
│   ├── index.css           # Global Tailwind utilities and scrollbar themes
│   └── main.tsx            # React root mount
│
├── server/                 # Backend Node.js & Express server
│   ├── data/               # Local JSON fallback store (history.json, projects.json)
│   ├── prisma/             # Prisma ORM schema and migrations
│   │   ├── migrations/         # PostgreSQL database migration files
│   │   └── schema.prisma       # User, Project, and PromptRun data models
│   ├── services/           # Backend business logic
│   │   ├── dbStorage.ts        # Prisma database access layer
│   │   ├── storage.ts          # JSON file backup storage adapter
│   │   ├── llm.ts              # OpenAI & Gemini streaming orchestrator
│   │   └── mockLLM.ts          # Simulated LLM responses & evaluation algorithms
│   ├── .env.example        # Environment variable template
│   ├── index.ts            # Express server, Socket.io gateway, and REST routes
│   └── prisma.ts           # Prisma client instantiation
│
├── package.json            # Frontend dependencies and dev scripts
├── tsconfig.json           # Root TypeScript configuration
└── vite.config.ts          # Vite build and plugin settings
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher
- *(Optional)* **PostgreSQL** instance for database persistence. *(If PostgreSQL is not running, the app automatically runs in resilient local storage mode).*

### 2. Clone the Repository
```bash
git clone https://github.com/perrryplatipus-dev/promptflow.git
cd promptflow
```

### 3. Install Dependencies
Install dependencies for both the frontend client and the backend server:

```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 4. Configure Environment Variables
Copy the example environment configuration in the `server` directory:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your settings:
```ini
PORT=3001

# PostgreSQL Database (Optional - defaults to local storage if omitted)
DATABASE_URL="postgresql://postgres:password@localhost:5432/promptflow"

# SMTP Transactional Mail (Optional - logs OTP to terminal if not set)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=PromptFlow <noreply@promptflow.ai>
```

> **Note on API Keys:** OpenAI and Gemini API keys can also be configured dynamically directly within the **Settings** page in the web interface.

### 5. Initialize the Database (Optional)
If using PostgreSQL:
```bash
cd server
npx prisma migrate dev --name init
cd ..
```

### 6. Run the Application
Start both the Vite frontend and the backend server concurrently with a single command:

```bash
npm run dev
```

- **Frontend Studio**: `http://localhost:5173`
- **Backend API & WebSockets**: `http://localhost:3001`

---

## 📡 API & WebSocket Reference

### REST Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Authenticate existing user |
| `POST` | `/api/auth/send-otp` | Dispatch 6-digit verification code via email or terminal |
| `POST` | `/api/auth/verify-otp` | Validate submitted OTP code |
| `GET` | `/api/projects` | Fetch all projects scoped to the active user |
| `POST` | `/api/projects` | Create a new prompt project |
| `PUT` | `/api/projects/:id` | Update project metadata or tags |
| `DELETE`| `/api/projects/:id` | Delete project and cascade-delete prompt runs |
| `GET` | `/api/history` | Retrieve past A/B test run executions |
| `POST` | `/api/history` | Save a completed prompt comparison run |
| `DELETE`| `/api/history/:id` | Remove a historical run record |
| `GET` | `/api/analytics` | Compute aggregate KPIs, win ratios, and cost summaries |

### WebSocket Events (`Socket.io`)

#### Client to Server
- **`compare-prompts`**: Dispatches the execution request.
  ```typescript
  {
    projectId: string;
    projectName: string;
    promptA: string;
    promptB: string;
    variables: Record<string, string>;
    apiKeys: {
      openai?: string;
      gemini?: string;
      providerA: 'openai' | 'gemini' | 'mock';
      providerB: 'openai' | 'gemini' | 'mock';
    };
    userEmail: string;
  }
  ```

#### Server to Client
- **`token-a`**: Emitted as text tokens arrive from Model A.
- **`token-b`**: Emitted as text tokens arrive from Model B.
- **`done-a`**: Emitted upon completion of Prompt A with `{ latency, tokensCount, cost }`.
- **`done-b`**: Emitted upon completion of Prompt B with `{ latency, tokensCount, cost }`.
- **`comparison-finished`**: Emitted when both streams finish and evaluation is computed, sending the final `PromptRun` record.
- **`error`**: Dispatched if LLM API rate limits, invalid keys, or network failures occur.

---

## 🧠 Automated Evaluation Engine

PromptFlow includes an evaluation engine designed to provide repeatable, comparative assessments of outputs:

$$\text{Overall Score} = \frac{\text{Tone} + \text{Accuracy} + \text{Length Score} + \text{Grammar}}{4}$$

1. **Tone Score ($1 - 10$)**: Evaluates sentiment alignment, professional demeanor, and persona consistency.
2. **Accuracy Score ($1 - 10$)**: Measures semantic coherence against the user's intended instruction and variable constraints.
3. **Length & Density ($1 - 10$)**: Penalizes excessive verbosity while ensuring critical details are not truncated.
4. **Grammar & Formatting ($1 - 10$)**: Evaluates syntax correctness, Markdown hierarchy, code block formatting, and readability.

The engine analyzes both outputs, establishes latency differentials, evaluates score deltas, and awards the **Winner Badge (Option A / Option B / Tie)**.

---

## 🔒 Security & Privacy

- **API Keys**: Stored locally in the user's browser session or injected directly via environment variables. Keys are never hardcoded or transmitted to external third parties.
- **Isolated User Workspaces**: Database queries are strictly scoped by user email headers (`x-user-email`).
- **No Sensitive Credential Tracking**: `.gitignore` is pre-configured to strictly ignore `.env`, local databases, and temporary development cache files.

---

## 🤝 Contributing

Contributions, feature requests, and feedback are welcome!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/perrryplatipus-dev">perrryplatipus-dev</a> for developers building the future of AI.</sub>
</div>
