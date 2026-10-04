import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import analyzeRoutes from './routes/analyzeRoutes.js';
import advisorRoutes from './routes/advisorRoutes.js';
import jobMatchRoutes from './routes/jobMatchRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/analyses', analyzeRoutes); // the client expects some paths under /analyses
app.use('/api/advisor', advisorRoutes);
app.use('/api/jobs', jobMatchRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('CareerPilot API is running...');
});

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);
});
