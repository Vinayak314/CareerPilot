import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import { aiEndpointLimiter } from '../middleware/rateLimiter.js';
import { advisorRequestSchema, getRewrites, getInterviewPrep, runFullWorkflow } from '../controllers/advisorController.js';
import { analyzeRequestSchema } from '../controllers/analyzeController.js';

const router = express.Router();

router.use(protect);

router.post('/rewrite', aiEndpointLimiter, validateBody(advisorRequestSchema), getRewrites);
router.post('/interview', aiEndpointLimiter, validateBody(advisorRequestSchema), getInterviewPrep);
router.post('/orchestrate', aiEndpointLimiter, validateBody(analyzeRequestSchema), runFullWorkflow);

export default router;
