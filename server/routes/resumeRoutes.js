import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadFile, listResumes, deleteResume } from '../controllers/resumeController.js';

const router = express.Router();

router.use(protect);

router.post('/upload', uploadFile);
router.get('/', listResumes);
router.delete('/:id', deleteResume);

export default router;
