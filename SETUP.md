# CareerPilot Local Setup Guide

Welcome to CareerPilot! This guide will walk you through setting up the project locally, configuring the necessary API keys, and running both the frontend and backend.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **MongoDB** (You can use a local MongoDB instance or a free cloud cluster via MongoDB Atlas)

---

## 1. Backend Setup

The backend handles API requests, database interactions, and AI processing.

1. **Navigate to the server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a new file named `.env` in the `server` directory (you can copy the provided `.env.example`). Open it and configure the following variables:

   ```env
   # The port the backend will run on
   PORT=5000

   # Your MongoDB Connection URI
   # If using MongoDB Atlas, it looks like: mongodb+srv://<username>:<password>@cluster.mongodb.net/careerpilot
   MONGO_URI=mongodb://localhost:27017/careerpilot

   # A secure, random string used for signing JWT authentication tokens
   JWT_SECRET=your_secure_random_jwt_secret_here

   # Google Gemini API Key (REQUIRED for AI analysis and advisor features)
   # Get it here: https://aistudio.google.com/app/apikey
   GEMINI_API_KEY=your_gemini_api_key_here

   # Adzuna API Keys (Optional, required for the Job Match functionality)
   # Get it here: https://developer.adzuna.com/
   ADZUNA_APP_ID=your_adzuna_app_id
   ADZUNA_APP_KEY=your_adzuna_app_key
   ```

4. **Start the backend server**:
   ```bash
   npm run dev
   ```
   *The server should now be running on `http://localhost:5000`.*

---

## 2. Frontend Setup

The frontend is a React application powered by Vite.

1. **Open a new terminal window** and navigate to the client directory:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `client` directory (if not already present) to point the frontend to your local backend:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the frontend development server**:
   ```bash
   npm run dev
   ```
   *The frontend should now be running, typically on `http://localhost:5173`. Open this URL in your browser to view the application.*

---

## 3. How to Obtain API Keys

### Google Gemini API Key (AI Features)
CareerPilot uses Gemini to analyze resumes and generate interview questions.
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click on **"Get API key"** in the left sidebar.
4. Generate a new key and copy it into your `server/.env` file under `GEMINI_API_KEY`.

### Adzuna API Key (Job Matching)
This is used to fetch real-world job postings.
1. Go to the [Adzuna Developer Portal](https://developer.adzuna.com/).
2. Sign up for a free developer account.
3. Once registered, navigate to your dashboard to find your **App ID** and **App Key**.
4. Copy them into your `server/.env` file under `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`.

---

## Troubleshooting

- **MongoDB Connection Errors**: Ensure your MongoDB instance is running locally, or double-check your Atlas URI credentials and network access whitelist (allow IP `0.0.0.0/0` for testing).
- **CORS Issues**: Ensure the backend `PORT` matches the URL specified in the frontend's `VITE_API_URL`.
- **AI/LLM Failures**: If the resume analysis is failing, ensure your `GEMINI_API_KEY` is valid and has not exceeded its quota.
