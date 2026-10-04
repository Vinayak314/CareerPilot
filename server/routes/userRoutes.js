import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import { getProfile, updateProfile, deleteAccount, updateProfileSchema } from '../controllers/userController.js';

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.patch('/profile', validateBody(updateProfileSchema), updateProfile);
router.delete('/', deleteAccount);

export default router;
