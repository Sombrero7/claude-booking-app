// apps/user-service/package.json
{
  "name": "@booking-platform/user-service",
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
    "@booking-platform/database": "*",
    "@booking-platform/utils": "*",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "firebase-admin": "^11.9.0",
    "helmet": "^7.0.0",
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

// apps/user-service/tsconfig.json
{
  "extends": "@booking-platform/typescript-config/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}

// apps/user-service/.env.example
NODE_ENV=development
PORT=4001
MONGODB_URI=mongodb://localhost:27017/booking-platform
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

// apps/user-service/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectToDatabase } from '@booking-platform/database';

// Load environment variables
dotenv.config();

// Import routes
import userRoutes from './routes/user.routes';

// Initialize Express app
const app = express();
const port = process.env.PORT || 4001;

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

// Register routes
app.use('/api', userRoutes);

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

// Connect to database and start the server
const startServer = async () => {
  try {
    await connectToDatabase(process.env.MONGODB_URI as string);
    app.listen(port, () => {
      console.log(`User Service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// apps/user-service/src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { UserModel } from '@booking-platform/database';
import { successResponse, errorResponse } from '@booking-platform/utils';
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
 * Create a new user
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, profile } = req.body;

    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ firebaseId: req.user.uid });
    if (existingUser) {
      res.status(409).json(errorResponse('User already exists', 'USER_EXISTS'));
      return;
    }

    // Create new user
    const newUser = new UserModel({
      firebaseId: req.user.uid,
      email: req.user.email,
      role: role || 'customer',
      profile: {
        name: profile.name || req.user.name || 'User',
        bio: profile.bio || '',
        avatar: profile.avatar || req.user.picture || '',
        phone: profile.phone || ''
      },
      followers: [],
      following: []
    });

    await newUser.save();
    res.status(201).json(successResponse(newUser));
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(500).json(errorResponse(error.message, 'USER_CREATE_ERROR'));
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const user = await UserModel.findOne({ firebaseId: req.user.uid });
    if (!user) {
      res.status(404).json(errorResponse('User not found', 'USER_NOT_FOUND'));
      return;
    }

    res.status(200).json(successResponse(user));
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json(errorResponse(error.message, 'USER_FETCH_ERROR'));
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await UserModel.findOne({ firebaseId: id });

    if (!user) {
      res.status(404).json(errorResponse('User not found', 'USER_NOT_FOUND'));
      return;
    }

    // Remove sensitive information
    const userData = user.toObject();
    delete userData.stripe;

    res.status(200).json(successResponse(userData));
  } catch (error: any) {
    console.error('Get user by ID error:', error);
    res.status(500).json(errorResponse(error.message, 'USER_FETCH_ERROR'));
  }
};

/**
 * Update user profile
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { profile } = req.body;
    
    const user = await UserModel.findOne({ firebaseId: req.user.uid });
    if (!user) {
      res.status(404).json(errorResponse('User not found', 'USER_NOT_FOUND'));
      return;
    }

    // Update profile fields
    if (profile) {
      user.profile = {
        ...user.profile,
        ...profile
      };
    }

    await user.save();
    res.status(200).json(successResponse(user));
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json(errorResponse(error.message, 'USER_UPDATE_ERROR'));
  }
};

/**
 * Follow a user
 */
export const followUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { userId } = req.params;
    
    // Get current user
    const currentUser = await UserModel.findOne({ firebaseId: req.user.uid });
    if (!currentUser) {
      res.status(404).json(errorResponse('User not found', 'USER_NOT_FOUND'));
      return;
    }

    // Get user to follow
    const userToFollow = await UserModel.findOne({ firebaseId: userId });
    if (!userToFollow) {
      res.status(404).json(errorResponse('User to follow not found', 'USER_NOT_FOUND'));
      return;
    }

    // Check if already following
    if (currentUser.following.includes(userId)) {
      res.status(400).json(errorResponse('Already following this user', 'ALREADY_FOLLOWING'));
      return;
    }

    // Update current user's following list
    currentUser.following.push(userId);
    await currentUser.save();

    // Update followed user's followers list
    userToFollow.followers.push(req.user.uid);
    await userToFollow.save();

    res.status(200).json(successResponse({ message: 'Successfully followed user' }));
  } catch (error: any) {
    console.error('Follow user error:', error);
    res.status(500).json(errorResponse(error.message, 'FOLLOW_ERROR'));
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { userId } = req.params;
    
    // Get current user
    const currentUser = await UserModel.findOne({ firebaseId: req.user.uid });
    if (!currentUser) {
      res.status(404).json(errorResponse('User not found', 'USER_NOT_FOUND'));
      return;
    }

    // Get user to unfollow
    const userToUnfollow = await UserModel.findOne({ firebaseId: userId });
    if (!userToUnfollow) {
      res.status(404).json(errorResponse('User to unfollow not found', 'USER_NOT_FOUND'));
      return;
    }

    // Check if following
    if (!currentUser.following.includes(userId)) {
      res.status(400).json(errorResponse('Not following this user', 'NOT_FOLLOWING'));
      return;
    }

    // Update current user's following list
    currentUser.following = currentUser.following.filter(id => id !== userId);
    await currentUser.save();

    // Update unfollowed user's followers list
    userToUnfollow.followers = userToUnfollow.followers.filter(id => id !== req.user?.uid);
    await userToUnfollow.save();

    res.status(200).json(successResponse({ message: 'Successfully unfollowed user' }));
  } catch (error: any) {
    console.error('Unfollow user error:', error);
    res.status(500).json(errorResponse(error.message, 'UNFOLLOW_ERROR'));
  }
};

/**
 * Get user's followers
 */
export const getUserFollowers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const user = await UserModel.findOne({ firebaseId: userId });
    if (!user) {
      res.status(404).json(errorResponse('User not found', 'USER_NOT_FOUND'));
      return;
    }

    // Get all followers
    const followers = await UserModel.find({ firebaseId: { $in: user.followers } });
    
    // Remove sensitive information
    const followersList = followers.map(follower => {
      const followerData = follower.toObject();
      delete followerData.stripe;
      return followerData;
    });

    res.status(200).json(successResponse(followersList));
  } catch (error: any) {
    console.error('Get followers error:', error);
    res.status(500).json(errorResponse(error.message, 'FOLLOWERS_FETCH_ERROR'));
  }
};

/**
 * Get user's following
 */
export const getUserFollowing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const user = await UserModel.findOne({ firebaseId: userId });
    if (!user) {
      res.status(404).json(errorResponse('User not found', 'USER_NOT_FOUND'));
      return;
    }

    // Get all following
    const following = await UserModel.find({ firebaseId: { $in: user.following } });
    
    // Remove sensitive information
    const followingList = following.map(followed => {
      const followedData = followed.toObject();
      delete followedData.stripe;
      return followedData;
    });

    res.status(200).json(successResponse(followingList));
  } catch (error: any) {
    console.error('Get following error:', error);
    res.status(500).json(errorResponse(error.message, 'FOLLOWING_FETCH_ERROR'));
  }
};

// apps/user-service/src/routes/user.routes.ts
import { Router } from 'express';
import * as UserController from '../controllers/user.controller';

const router = Router();

// User profile endpoints
router.post('/users', UserController.createUser);
router.get('/users/me', UserController.getCurrentUser);
router.get('/users/:id', UserController.getUserById);
router.put('/users/me', UserController.updateUser);

// Social endpoints
router.post('/users/:userId/follow', UserController.followUser);
router.delete('/users/:userId/follow', UserController.unfollowUser);
router.get('/users/:userId/followers', UserController.getUserFollowers);
router.get('/users/:userId/following', UserController.getUserFollowing);

export default router;
