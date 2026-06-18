import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`, err.stack);

  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    data: null
  });
}
