import Application from '../models/Application.js';
import { notFound, badRequest } from '../utils/httpError.js';
import { z } from 'zod';

export const createApplicationSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  location: z.string().optional(),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  status: z.enum(['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected']).optional(),
  appliedDate: z.string().datetime().optional().or(z.literal('')),
  notes: z.string().optional(),
  jobMatchId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

export const updateApplicationSchema = createApplicationSchema.partial().extend({
  status: z.enum(['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected']).optional(),
});

export const createApplication = async (req, res, next) => {
  try {
    const data = req.body;
    const application = await Application.create({
      ...data,
      userId: req.user._id,
    });
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
};

export const getApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ userId: req.user._id })
      .sort({ updatedAt: -1 });
    res.json(applications);
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, userId: req.user._id });
    if (!application) throw notFound('Application not found');
    res.json(application);
  } catch (error) {
    next(error);
  }
};

export const updateApplication = async (req, res, next) => {
  try {
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!application) throw notFound('Application not found');
    res.json(application);
  } catch (error) {
    next(error);
  }
};

export const deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!application) throw notFound('Application not found');
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
