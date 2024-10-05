import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import {appConfig} from '../config/app.config';

interface UserPayload {
  id: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      errors: [
        {
          status: '401',
          title: 'Authentication Error',
          detail: 'No token provided',
        },
      ],
    });
  }

  try {
    const decoded = jwt.verify(token, appConfig.jwtSecret) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      errors: [
        {status: '403', title: 'Authorization Error', detail: 'Invalid token'},
      ],
    });
  }
};
