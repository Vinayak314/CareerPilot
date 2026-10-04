import User from '../models/User.js';
import Resume from '../models/Resume.js';
import Analysis from '../models/Analysis.js';
import JobMatch from '../models/JobMatch.js';
import Application from '../models/Application.js';
import { notFound } from '../utils/httpError.js';
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Please include a valid email').optional(),
  // Add notification preferences or other settings here later
});

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) throw notFound('User not found');
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) throw notFound('User not found');
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Delete all associated data
    await Promise.all([
      Resume.deleteMany({ userId }),
      Analysis.deleteMany({ userId }),
      JobMatch.deleteMany({ userId }),
      Application.deleteMany({ userId }),
      User.findByIdAndDelete(userId)
    ]);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
