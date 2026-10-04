import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validate.js';
import {
  createApplicationSchema,
  updateApplicationSchema,
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication
} from '../controllers/applicationController.js';

const router = express.Router();

router.use(protect);

router.post('/', validateBody(createApplicationSchema), createApplication);
router.get('/', getApplications);
router.get('/:id', getApplicationById);
router.patch('/:id', validateBody(updateApplicationSchema), updateApplication);
router.delete('/:id', deleteApplication);

export default router;
