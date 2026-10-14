import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import { findMatchesSchema, findMatches, getMatches, updateMatchStatusSchema, updateMatchStatus } from '../controllers/jobMatchController.js';

import { aiEndpointLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(protect);

router.post('/find', aiEndpointLimiter, validateBody(findMatchesSchema), findMatches);
router.get('/', getMatches);
router.patch('/:id/status', validateBody(updateMatchStatusSchema), updateMatchStatus);

export default router;
