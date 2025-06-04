import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
    return;
  }

  if (err.name === 'MongoError' && (err as any).code === 11000) {
    res.status(400).json({
      status: 'fail',
      message: 'Duplicate field value entered'
    });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again.'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      status: 'fail',
      message: 'Your token has expired. Please log in again.'
    });
    return;
  }

  console.error('ERROR ', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
}; 