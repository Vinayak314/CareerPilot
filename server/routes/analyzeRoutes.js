import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import { aiEndpointLimiter } from '../middleware/rateLimiter.js';
import { analyzeRequestSchema, createAnalysis, listAnalyses, getLatestAnalysis, getAnalysis } from '../controllers/analyzeController.js';

const router = express.Router();

router.use(protect);

router.post('/', aiEndpointLimiter, validateBody(analyzeRequestSchema), createAnalysis);
router.get('/', listAnalyses);
router.get('/latest', getLatestAnalysis);
router.get('/:id', getAnalysis);

export default router;
