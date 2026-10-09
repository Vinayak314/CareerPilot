import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import { aiEndpointLimiter } from '../middleware/rateLimiter.js';
import { advisorRequestSchema, interviewFeedbackRequestSchema, getRewrites, getInterviewPrep, getInterviewAnswerFeedback, runFullWorkflow } from '../controllers/advisorController.js';
import { analyzeRequestSchema } from '../controllers/analyzeController.js';

const router = express.Router();

router.use(protect);

router.post('/rewrite', aiEndpointLimiter, validateBody(advisorRequestSchema), getRewrites);
router.post('/interview', aiEndpointLimiter, validateBody(advisorRequestSchema), getInterviewPrep);
router.post('/interview/feedback', aiEndpointLimiter, validateBody(interviewFeedbackRequestSchema), getInterviewAnswerFeedback);
router.post('/orchestrate', aiEndpointLimiter, validateBody(analyzeRequestSchema), runFullWorkflow);

export default router;
