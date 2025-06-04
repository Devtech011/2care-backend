import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization') || req.header('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      throw new AppError('No authentication token provided', 401);
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "ai-test-task");
      const user = await User.findOne({ _id: (decoded as any).id });

      if (!user) {
        throw new AppError('User not found', 401);
      }

      req.user = user;
      next();
    } catch (jwtError) {
      throw new AppError('Invalid or expired token', 401);
    }
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
};

export const verifyApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
      throw new AppError('API key is required', 401);
    }

    const user = await User.findOne({ apiKey });
    
    if (!user) {
      throw new AppError('Invalid API key', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}; 