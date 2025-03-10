// apps/api-gateway/package.json
{
  "name": "@booking-platform/api-gateway",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "dev": "nodemon src/index.ts",
    "lint": "eslint src --ext .ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "axios": "^1.4.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "firebase-admin": "^11.9.0",
    "helmet": "^7.0.0",
    "http-proxy-middleware": "^2.0.6",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "@booking-platform/eslint-config": "*",
    "@booking-platform/typescript-config": "*",
    "@types/cors": "^2.8.13",
    "@types/express": "^4.17.17",
    "@types/morgan": "^1.9.4",
    "@types/node": "^18.16.16",
    "eslint": "^8.42.0",
    "nodemon": "^2.0.22",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.3"
  }
}

// apps/api-gateway/tsconfig.json
{
  "extends": "@booking-platform/typescript-config/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}

// apps/api-gateway/.env.example
NODE_ENV=development
PORT=4000
USER_SERVICE_URL=http://localhost:4001
EVENT_SERVICE_URL=http://localhost:4002
BOOKING_SERVICE_URL=http://localhost:4003
PAYMENT_SERVICE_URL=http://localhost:4004
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

// apps/api-gateway/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Load environment variables
dotenv.config();

// Import middleware
import { authenticateUser } from './middleware/auth';

// Initialize Express app
const app = express();
const port = process.env.PORT || 4000;

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Setup service proxies
const userServiceProxy = createProxyMiddleware({
  target: process.env.USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/api' }
});

const eventServiceProxy = createProxyMiddleware({
  target: process.env.EVENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/events': '/api' },
  pathRewrite: { '^/api/spaces': '/api' }
});

const bookingServiceProxy = createProxyMiddleware({
  target: process.env.BOOKING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/bookings': '/api' },
  pathRewrite: { '^/api/requests': '/api' }
});

const paymentServiceProxy = createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/payments': '/api' }
});

// Authenticate all API routes
app.use('/api', authenticateUser);

// Set up proxy routes
app.use('/api/users', userServiceProxy);
app.use('/api/events', eventServiceProxy);
app.use('/api/spaces', eventServiceProxy);
app.use('/api/bookings', bookingServiceProxy);
app.use('/api/requests', bookingServiceProxy);
app.use('/api/payments', paymentServiceProxy);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});

// apps/api-gateway/src/middleware/auth.ts
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
