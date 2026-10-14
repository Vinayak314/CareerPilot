import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { conflict } from '../utils/httpError.js';

const emailSchema = z.string().trim().toLowerCase().email('Please include a valid email');
const passwordSchema = z.string().min(1, 'Password is required').refine(
  (value) => Buffer.byteLength(value, 'utf8') <= 72,
  'Password must be at most 72 bytes'
);
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema.refine((value) => value.length >= 8, 'Password must be at least 8 characters'),
});
export const loginSchema = z.object({ email: emailSchema, password: passwordSchema });

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      throw conflict('An account with this email already exists.');
    }

    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not defined');
    const user = await User.create({
      name,
      email,
      passwordHash: password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};
