import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/userModel';
import { AppError } from '../middleware/errorHandler';
import crypto from 'crypto';
import { Document, Types } from 'mongoose';

interface UserDocument extends Document {
  _id: Types.ObjectId;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toObject(): any;
}

const signToken = (id: Types.ObjectId) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "ai-test-task",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    } as jwt.SignOptions
  );
};

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    const apiKey = crypto.randomBytes(32).toString('hex');

    const newUser = await User.create({
      name,
      email,
      password,
      apiKey
    }) as UserDocument;

    const token = signToken(newUser._id);

    const userResponse = newUser.toObject();
    const { password: _, ...userWithoutPassword } = userResponse;

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password') as UserDocument;
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    const token = signToken(user._id);

    const userResponse = user.toObject();
    const { password: _, ...userWithoutPassword } = userResponse;

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    next(error);
  }
}; 