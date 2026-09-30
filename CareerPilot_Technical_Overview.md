# CareerPilot — Technical Overview

## 1. Project Summary

**Problem:** Job seekers lose interviews not from lacking experience, but because resumes fail ATS screening or don't speak the language of a specific job description. Existing tools give a single opaque score with no actionable next step.

**Objective:** Build an AI-agent-driven MERN web app that analyzes a resume against a specific job description, identifies concrete gaps (keywords, skills, formatting), and produces targeted, ready-to-use outputs — rewritten resume content, interview-prep questions, and ranked job matches.

**Deliverables:**
- Deployed full-stack MERN application
- Resume upload & parsing
- Analyzer Agent → ATS match score + gap detection
- Advisor Agent → resume rewrites + interview-prep questions
- Job-matching feature ranking live postings by fit
- Application-tracking Kanban board
- Supporting documentation: architecture overview, setup instructions, project report

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React (Vite) + Tailwind CSS + React Router | Zustand/Redux for global state |
| Backend | Node.js + Express | REST API |
| Database | MongoDB Atlas + Mongoose | Document store fits variable resume/JSON structures |
| AI Agents | Gemini API (`gemini-2.0-flash` primary, `gemini-1.5-pro` for heavier reasoning) | via `@langchain/google-genai` |
| Orchestration | LangChain.js core + LangGraph.js | Agent graph, structured output, conditional/parallel execution |
| Schema Validation | Zod | Validates all structured LLM outputs |
| File Parsing | Gemini multimodal input (preferred) or `pdf-parse` / `mammoth` (fallback) | Avoids brittle manual PDF parsing |
| Auth | JWT + bcrypt | httpOnly cookie or localStorage token |
| Job Data Source | Adzuna API / JSearch (RapidAPI) | Live postings |
| Drag-and-drop | `@dnd-kit/core` | Kanban board |
| Observability | LangSmith | Trace/latency/token logging per agent run |
| Deployment | Vercel/Netlify (frontend), Render/Railway (backend), MongoDB Atlas (DB) | |

---

## 3. System Architecture

```
                        ┌─────────────────────────┐
                        │   React Frontend (SPA)  │
                        │  Upload / Dashboard /   │
                        │  Rewrite / Prep / Jobs / │
                        │  Kanban / Profile        │
                        └───────────┬─────────────┘
                                    │ REST (JWT auth)
                                    ▼
                        ┌─────────────────────────┐
                        │   Express API Gateway   │
                        │  Auth middleware         │
                        └───────────┬─────────────┘
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
     ┌────────────────┐   ┌──────────────────┐   ┌──────────────────┐
     │ Resume Service   │   │ LangGraph         │   │ Job Matching      │
     │ (parse & store)  │   │ Orchestrator      │   │ Service           │
     └────────┬─────────┘   │  ┌─────────────┐  │   └────────┬─────────┘
              │             │  │ Analyzer    │  │            │
              │             │  │ Node        │  │            ▼
              │             │  └──────┬──────┘  │   External Job API
              │             │   cond. │ edge     │   (Adzuna/JSearch)
              │             │  ┌──────▼──────┐  │
              │             │  │ Advisor      │  │
              │             │  │ Node (parallel│  │
              │             │  │ rewrite +    │  │
              │             │  │ interview)   │  │
              │             │  └─────────────┘  │
              │             └─────────┬─────────┘
              │                       │  (all call Gemini via LangChain)
              ▼                       ▼
                        ┌─────────────────────────┐
                        │      MongoDB Atlas       │
                        │ Users / Resumes /        │
                        │ Analyses / JobMatches /   │
                        │ Applications              │
                        └─────────────────────────┘
```

Agents are isolated as their own service/module layer — never called inline from controllers — so prompts, schemas, and models can be changed without touching route logic.

---

## 4. Agent Orchestration Design (LangGraph)

### Why an orchestration layer instead of raw API calls
- **Structured output validation** — Zod schemas bound directly to the model, no manual JSON parsing/regex stripping.
- **Conditional branching** — skip expensive calls when unnecessary (e.g., skip Advisor if ATS score is already high).
- **Parallel execution** — run rewrite generation and interview-prep generation concurrently instead of sequentially.
- **Observability** — LangSmith traces every node's input/output/latency/token count, useful evidence for the project report's evaluation section.
- **Retries** — LangChain retries automatically on malformed structured output.

### Graph flow

```
 [entry] → Analyzer Node
               │
     ats_score < 85 ? ──yes──► Advisor Node ──┬─► Rewrite sub-task
               │                               └─► Interview-prep sub-task
              no                                        │
               │                                         ▼
               └───────────────────────────────────► [END] → persist to DB
```

### Node responsibilities

| Node | Input | Output (Zod-validated) | Model temp |
|---|---|---|---|
| **Analyzer** | Parsed resume JSON + JD text | `ats_score`, `category_scores`, `missing_keywords`, `weak_bullets`, `formatting_issues` | 0.2 (consistency) |
| **Advisor — Rewrite** | Weak bullets + missing keywords | 2–3 rewritten variants per bullet (tone options) | 0.6–0.7 (creativity) |
| **Advisor — Interview Prep** | JD + resume gaps | 8–10 role-specific questions + talking points | 0.6–0.7 |
| **Job Fit Scorer** (separate chain, not part of main graph) | Resume summary + JD per posting | Fit % + matched/missing skills | 0.3 |

### Cost & performance controls
- Cache `Analysis` results by hash(resume + JD) — avoid re-analyzing unchanged pairs.
- Cheap local keyword-overlap pre-filter before invoking Gemini for job-fit scoring (only send top candidates to the LLM).
- Rate-limit AI-agent routes via Express middleware.
- Log token usage per LangGraph run (via LangSmith) for the cost/performance discussion in the report.

---

## 5. Repository Structure

```
careerpilot/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Dashboard.jsx        # Analysis results
│   │   │   ├── RewriteStudio.jsx
│   │   │   ├── InterviewPrep.jsx
│   │   │   ├── JobMatches.jsx
│   │   │   ├── Tracker.jsx          # Kanban board
│   │   │   └── Profile.jsx
│   │   ├── components/
│   │   │   ├── ScoreGauge.jsx
│   │   │   ├── GapChip.jsx
│   │   │   ├── KanbanCard.jsx
│   │   │   ├── JobMatchCard.jsx
│   │   │   ├── RewriteCompare.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── LoadingState.jsx
│   │   ├── store/                   # Zustand/Redux slices
│   │   ├── api/                     # axios instance + endpoint wrappers
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
│
├── server/                          # Express backend
│   ├── agents/
│   │   ├── analyzerAgent.js
│   │   ├── advisorAgent.js
│   │   ├── jobFitAgent.js
│   │   └── graph.js                 # LangGraph orchestrator
│   ├── services/
│   │   ├── gemini.js                # model + schema definitions
│   │   ├── resumeParser.js
│   │   ├── jobApiClient.js          # Adzuna/JSearch wrapper
│   │   └── cache.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Resume.js
│   │   ├── Analysis.js
│   │   ├── Rewrite.js
│   │   ├── JobMatch.js
│   │   └── Application.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── resumeController.js
│   │   ├── analyzeController.js
│   │   ├── advisorController.js
│   │   ├── jobController.js
│   │   └── applicationController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── resumeRoutes.js
│   │   ├── analyzeRoutes.js
│   │   ├── advisorRoutes.js
│   │   ├── jobRoutes.js
│   │   └── applicationRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── config/
│   │   └── db.js
│   ├── server.js
│   └── .env
│
├── docs/
│   ├── architecture-overview.md
│   ├── setup-instructions.md
│   └── project-report.md
│
├── .gitignore
├── README.md
└── package.json (root, if using workspaces)
```

---

## 6. Database Schema (MongoDB / Mongoose)

| Collection | Key Fields |
|---|---|
| **User** | `name, email, passwordHash, createdAt` |
| **Resume** | `userId, rawFileUrl, parsedJson, version, createdAt` |
| **Analysis** | `resumeId, jobDescriptionText, atsScore, categoryScores, missingKeywords, weakBullets, formattingIssues, createdAt` |
| **Rewrite** | `analysisId, originalBullet, suggestions[], acceptedVersion` |
| **JobMatch** | `userId, jobPostingId, title, company, fitScore, matchedSkills, missingSkills` |
| **Application** | `userId, jobMatchId, status (Saved/Applied/Interviewing/Offer/Rejected), notes, dateApplied` |

---

## 7. API Endpoints

```
POST   /api/auth/signup
POST   /api/auth/login

POST   /api/resumes/upload

POST   /api/analyze                    → invokes LangGraph (Analyzer → conditional Advisor)

POST   /api/advisor/rewrite            → direct call if user requests re-rewrite of a single bullet
POST   /api/advisor/interview-prep     → direct call if regenerating questions only

GET    /api/jobs/matches               → ranked postings for logged-in user's active resume

GET    /api/applications
POST   /api/applications
PATCH  /api/applications/:id           → status update (drag-and-drop on Kanban)
DELETE /api/applications/:id
```

---

## 8. Frontend Pages

1. **Landing** — hero, CTA, how-it-works, social proof
2. **Auth** — Login / Signup
3. **Upload** — resume + JD input, AI processing loading state
4. **Dashboard** — ATS score gauge, category breakdown, color-coded gap chips
5. **Rewrite Studio** — original vs AI-rewritten bullets, accept/edit/reject
6. **Interview Prep** — expandable AI-generated question list with talking points
7. **Job Matches** — ranked cards, fit %, matched/missing skills per posting
8. **Application Tracker (Kanban)** — drag-and-drop board across status columns
9. **Profile / Settings** — saved resume versions, account management

---

## 9. Core Module Implementation Notes

- **Resume Parsing:** Prefer sending the file directly to Gemini as multimodal input and requesting structured JSON output — avoids brittle PDF/DOCX text-extraction logic. Fallback: `pdf-parse`/`mammoth` extraction if multimodal parsing underperforms on a given format.
- **Analyzer Agent:** Low temperature (0.2–0.4) for scoring consistency; structured output bound via Zod; results cached by `hash(resume + JD)`.
- **Advisor Agent:** Higher temperature (0.6–0.7); rewrite and interview-prep sub-tasks run as parallel branches in the graph to cut latency.
- **Job Matching:** Two-tier scoring — cheap local keyword overlap first, then Gemini semantic scoring only on the shortlisted candidates to control API cost.
- **Kanban Tracker:** Standard CRUD; `@dnd-kit` handles drag events client-side, `PATCH` persists the new status.
- **Auth:** JWT issued on login/signup; Express middleware validates token on all protected routes.

---

## 10. Observability & Cost Control

- **LangSmith** (`LANGCHAIN_TRACING_V2=true`) traces every graph node's input/output/latency/tokens — provides evidence for the report's evaluation section.
- Response caching on Analyzer results (unchanged resume+JD pairs).
- Rate limiting on all `/api/analyze` and `/api/advisor/*` routes.
- Daily caching of job postings per user rather than re-fetching/re-scoring on every dashboard visit.

---

## 11. Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel or Netlify |
| Backend | Render or Railway |
| Database | MongoDB Atlas (free tier) |

**Environment variables:**
```
GEMINI_API_KEY=
LANGCHAIN_API_KEY=
LANGCHAIN_TRACING_V2=true
JOB_API_KEY=
JWT_SECRET=
MONGO_URI=
```

---

## 12. Build Milestones

| Week | Milestone |
|---|---|
| 1 | Auth + basic CRUD skeleton |
| 2 | Resume upload + structured parsing |
| 3 | Analyzer Agent + Dashboard UI |
| 4 | Advisor Agent (rewrites + interview prep) via LangGraph |
| 5 | Job Matching integration |
| 6 | Kanban Tracker |
| 7–8 | Polish, deploy, write documentation & project report |

---

## 13. Documentation Deliverables (for academic submission)

- `docs/architecture-overview.md` — this document (or a trimmed version)
- `docs/setup-instructions.md` — install steps, env vars, local run commands
- `docs/project-report.md` — problem statement, objectives, methodology, agent design rationale, evaluation (token usage, latency, ATS score accuracy samples), conclusion
