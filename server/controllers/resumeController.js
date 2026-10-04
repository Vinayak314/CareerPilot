import { uploadResume } from '../middleware/upload.js';
import { parseResume } from '../services/resumeParser.js';
import { textHash } from '../utils/hash.js';
import Resume from '../models/Resume.js';
import { badRequest, notFound } from '../utils/httpError.js';

export const uploadFile = async (req, res, next) => {
  uploadResume(req, res, async (err) => {
    if (err) return next(err);
    try {
      if (!req.file) throw badRequest('No resume file provided.');

      const userId = req.user._id;
      const buffer = req.file.buffer;
      const fileName = req.file.originalname;
      const mimeType = req.file.mimetype;
      const size = req.file.size;
      const fileHash = textHash(buffer.toString('base64'));

      // Dedupe exact identical file uploads for this user
      const existing = await Resume.findOne({ userId, fileHash });
      if (existing) {
        return res.status(200).json({ resume: existing.toSummary({ message: 'Resume already uploaded.' }) });
      }

      // Parse the resume
      const { text, fileType, parsed } = await parseResume(buffer, fileName);
      const hash = textHash(text);

      // Check versioning (if they upload a new file with the same name)
      const prevVersions = await Resume.countDocuments({ userId, fileName });

      const resume = await Resume.create({
        userId,
        fileName,
        mimeType,
        fileType,
        size,
        fileHash,
        textHash: hash,
        rawText: text,
        parsed,
        version: prevVersions + 1,
      });

      res.status(201).json({ resume: resume.toSummary() });
    } catch (error) {
      next(error);
    }
  });
};

export const listResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-rawText -parsed.bullets -parsed.experience');
    res.json(resumes.map((r) => r.toSummary()));
  } catch (error) {
    next(error);
  }
};

export const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!resume) throw notFound('Resume not found.');
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
