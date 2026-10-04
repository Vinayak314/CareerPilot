# CareerPilot Backend

This is the Express.js and Node.js backend for CareerPilot. It provides a robust API for authenticating users, managing resumes, interacting with AI agents via LangGraph, matching jobs, and tracking applications.

## Architecture Overview

The backend uses a standard MVC-inspired architecture adapted for an agentic application:

- **Routes**: `server/routes` map HTTP requests to controllers.
- **Controllers**: `server/controllers` handle HTTP logic, validation via Zod, and error handling.
- **Models**: `server/models` define MongoDB schemas using Mongoose (User, Resume, Analysis, JobMatch, Application).
- **Services**: `server/services` handle core business logic, including the `jobProvider` (fetching from Adzuna), `resumeParser` (extracting text via PDF/DOCX libraries), and `gemini` (interacting with LLMs).
- **Agents**: `server/agents` orchestrate AI workflows using LangGraph and LangChain.
  - `analyzerAgent.js`: Evaluates resumes against job descriptions.
  - `advisorAgent.js`: Generates resume bullet rewrites and interview questions.
  - `orchestrator.js`: Defines the StateGraph that chains these agents together, fanning out parallel tasks where possible.
- **Middleware**: `server/middleware` provides JWT authentication, Multer file uploads, rate limiting, and centralized error handling.

## Setup Instructions

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB (local or Atlas cluster)

### 2. Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Fill in your required secrets:
- `MONGO_URI`: Your MongoDB connection string.
- `JWT_SECRET`: A strong random string for signing JWT tokens.
- `GEMINI_API_KEY`: Required for the AI agents to function.

### 3. Installation
Install the required dependencies:
```bash
npm install
```

### 4. Running the Server
Start the development server with hot-reloading:
```bash
npm run dev
```
The server will be available at `http://localhost:5000`.

## Production Deployment
For production, ensure that all secrets are set securely in your hosting provider's environment variables dashboard. Do not commit your `.env` file to version control. The app is stateless (other than DB) and can be scaled horizontally behind a load balancer. Ensure the `JWT_SECRET` is strong and the `MONGO_URI` points to a production-ready database cluster.
