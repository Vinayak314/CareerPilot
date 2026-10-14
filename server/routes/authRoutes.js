import express from 'express';
import { registerUser, loginUser, registerSchema, loginSchema } from '../controllers/authController.js';

import { validateBody } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authLimiter);
router.post('/signup', validateBody(registerSchema), registerUser);
router.post('/login', validateBody(loginSchema), loginUser);

export default router;
