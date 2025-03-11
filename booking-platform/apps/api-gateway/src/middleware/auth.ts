import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    })
  });
}

export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

/**
 * Middleware to authenticate users via Firebase tokens
 */
export const authenticateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Unauthorized: No token provided',
        code: 'AUTH_NO_TOKEN'
      }
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Unauthorized: Invalid token',
        code: 'AUTH_INVALID_TOKEN'
      }
    });
  }
};

/**
 * Middleware to authorize admin users
 */
export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.admin !== true) {
    res.status(403).json({
      success: false,
      error: {
        message: 'Forbidden: Admin access required',
        code: 'AUTH_ADMIN_REQUIRED'
      }
    });
    return;
  }
  
  next();
};