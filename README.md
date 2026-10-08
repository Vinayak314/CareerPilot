# CareerPilot

CareerPilot is a resume analysis and job search application. The React/Vite client is in `client/`; the Express/MongoDB API is in `server/`.

## Run locally

1. Configure `server/.env` using `server/.env.example`. MongoDB URI and JWT secret are required; Gemini enables AI features and Adzuna credentials enable live job search. LangSmith variables are optional for tracing.
2. Install dependencies with `npm install` in both `server/` and `client/`.
3. Start the API with `npm run dev` from `server/` (default `http://localhost:5000`).
4. Start the client with `npm run dev` from `client/` (default Vite URL). Set `VITE_API_URL` if the API is not at `http://localhost:5000/api`.

See [SETUP.md](SETUP.md) for full environment setup, API key links, and troubleshooting.

## Architecture

- **Frontend:** React single-page application built with Vite. API calls are centralized in `client/src/api/endpoints.js`; the Axios client in `client/src/api/axios.js` attaches the saved JWT.
- **Backend:** Node.js and Express REST API. Route modules in `server/routes` connect requests to controllers in `server/controllers`.
- **Data:** MongoDB accessed through Mongoose models for users, resumes, analyses, job matches, and applications.
- **AI workflows:** LangChain and LangGraph agents analyze resumes, generate rewrite suggestions, and prepare interview questions. Gemini is the model provider.
- **Supporting services:** Resume parsing, Adzuna job retrieval, input validation, authentication, upload limits, rate limiting, and centralized error handling live in `server/services` and `server/middleware`.

For production, configure secrets in the hosting provider's environment settings. Do not commit `.env` files. Use a strong `JWT_SECRET` and a production MongoDB deployment; the API stores application data in MongoDB and uses JWT authentication for protected routes.

All `/api` routes below return JSON except successful deletes, which return `204 No Content`. Protected routes require `Authorization: Bearer <token>`. Authentication responses provide the JWT token. Error responses use `{ "message": "..." }`.

## API endpoint reference

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | No | API process health message (`CareerPilot API is running...`). |

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | No | Create an account. JSON body: `{ name, email, password }`. Returns user identity and JWT. |
| `POST` | `/api/auth/login` | No | Sign in with `{ email, password }`. Returns user identity and JWT. |

### Resumes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/resumes/upload` | Yes | Upload and parse a resume. Multipart form field `resume`; accepts PDF, DOCX, or TXT up to 10 MB. Returns `{ resume }`. |
| `GET` | `/api/resumes` | Yes | List the signed-in user's resume summaries. |
| `DELETE` | `/api/resumes/:id` | Yes | Delete an owned resume. |

### Resume analysis

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/analyze` | Yes | Analyze a resume against a job description. Body: `{ resumeId, jobDescriptionText? , jobDescriptionUrl? }`; one job description input is required. Returns a saved analysis, reusing a matching cached result when available. Rate limited. |
| `POST` | `/api/analyses` | Yes | Alias of `POST /api/analyze` (same body and behavior). |
| `GET` | `/api/analyses` | Yes | List the user's analyses (large detail fields are omitted). |
| `GET` | `/api/analyses/latest` | Yes | Return the most recent analysis. |
| `GET` | `/api/analyses/:id` | Yes | Return one owned analysis, including detailed analyzer results. |

### AI advisor

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/advisor/rewrite` | Yes | Generate resume bullet alternatives. Body: `{ resumeId, analysisId }`. Returns `{ rewrites: [{ bullet, options }] }`. Rate limited. |
| `POST` | `/api/advisor/interview` | Yes | Generate role-specific interview questions. Body: `{ resumeId, analysisId }`. Returns `{ questions: [{ type, question, rationale, tips }] }`. Rate limited. |
| `POST` | `/api/advisor/orchestrate` | Yes | Run the full analysis and advisor workflow for `{ resumeId, jobDescriptionText? , jobDescriptionUrl? }`. Rate limited. |

### Job matches

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/jobs/find` | Yes | Fetch and score job postings for a resume. Body: `{ resumeId, query?, location? }`. Saves/upserts results and returns ranked matches. |
| `GET` | `/api/jobs` | Yes | List the signed-in user's saved matches, ranked by fit score. |
| `PATCH` | `/api/jobs/:id/status` | Yes | Change a match status. Body: `{ status }`, one of `Matched`, `Saved`, `Applied`, `Interviewing`, `Offer`, `Rejected`. |

### Application tracker

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/applications` | Yes | List tracked applications. |
| `POST` | `/api/applications` | Yes | Add a tracker card. Required: `{ title, company }`; optional: `location`, `url`, `status`, `appliedDate`, `fitScore` (0–100), `notes`, `jobMatchId`. |
| `GET` | `/api/applications/:id` | Yes | Get one owned application. |
| `PATCH` | `/api/applications/:id` | Yes | Update application fields, including status and notes. |
| `DELETE` | `/api/applications/:id` | Yes | Delete an owned application. |

### User account

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/profile` | Yes | Return the signed-in user's profile. |
| `PATCH` | `/api/users/profile` | Yes | Update `name` and/or `email`. |
| `DELETE` | `/api/users` | Yes | Delete the account and its associated resumes, analyses, matches, and applications. |

## Frontend integration notes

Advisor outputs are generated on demand because the API currently does not persist rewrite/interview results or expose read/update endpoints for them. Password changes and notification preferences are not currently provided by the backend.

For environment details, see [SETUP.md](SETUP.md) and [server/.env.example](server/.env.example). For the full design and implementation overview, see [CareerPilot_Technical_Overview.md](CareerPilot_Technical_Overview.md).
