import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { unauthorized } from '../utils/httpError.js';

export const protect = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) return next(unauthorized('Not authorized, no token'));
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  if (!match) return next(unauthorized('Not authorized, token failed'));
  if (!process.env.JWT_SECRET) return next(new Error('JWT_SECRET is not defined'));
  let decoded;
  try {
    decoded = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return next(unauthorized('Not authorized, token failed'));
  }
  if (!decoded || typeof decoded !== 'object' || !mongoose.isObjectIdOrHexString(decoded.id)) {
    return next(unauthorized('Not authorized, token failed'));
  }
  try {
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) return next(unauthorized('Not authorized, user no longer exists'));
    req.user = user;
  } catch (error) {
    return next(error);
  }
  return next();
};
