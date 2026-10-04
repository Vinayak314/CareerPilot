import rateLimit from 'express-rate-limit';
import { tooManyRequests } from '../utils/httpError.js';

const createLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(tooManyRequests(options.message || 'Too many requests, please try again later.'));
    },
    // If you're behind a proxy (like Nginx or Heroku)
    // you need to set trust proxy in app.js
  });
};

export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

export const aiEndpointLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 AI calls per hour per IP
  message: 'Too many AI requests from this IP, please try again after an hour',
});

export const authLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 login/signup attempts per hour
  message: 'Too many authentication attempts, please try again after an hour',
});
