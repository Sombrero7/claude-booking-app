// apps/event-service/package.json
{
  "name": "@booking-platform/event-service",
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

// apps/event-service/tsconfig.json
{
  "extends": "@booking-platform/typescript-config/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}

// apps/event-service/.env.example
NODE_ENV=development
PORT=4002
MONGODB_URI=mongodb://localhost:27017/booking-platform
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

// apps/event-service/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectToDatabase } from '@booking-platform/database';

// Load environment variables
dotenv.config();

// Import routes
import eventRoutes from './routes/event.routes';
import spaceRoutes from './routes/space.routes';

// Initialize Express app
const app = express();
const port = process.env.PORT || 4002;

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'event-service' });
});

// Register routes
app.use('/api', eventRoutes);
app.use('/api', spaceRoutes);

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
      console.log(`Event Service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// apps/event-service/src/controllers/event.controller.ts
import { Request, Response } from 'express';
import { EventModel, UserModel } from '@booking-platform/database';
import { successResponse, errorResponse, generateOccurrences } from '@booking-platform/utils';
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
 * Create a new event
 */
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    // Get user to check if they exist and are a provider
    const user = await UserModel.findOne({ firebaseId: req.user.uid });
    if (!user) {
      res.status(404).json(errorResponse('User not found', 'USER_NOT_FOUND'));
      return;
    }

    if (user.role !== 'provider' && user.role !== 'admin') {
      res.status(403).json(errorResponse('Only providers can create events', 'PROVIDER_ROLE_REQUIRED'));
      return;
    }

    // Extract event data from request
    const {
      title,
      description,
      collaborators,
      eventType,
      schedule,
      spaceId,
      pricePerStudent,
      currency,
      maxCapacity,
      isPublic,
      tags
    } = req.body;

    // Validate required fields
    if (!title || !description || !schedule || !spaceId || pricePerStudent === undefined || !maxCapacity) {
      res.status(400).json(errorResponse('Missing required fields', 'MISSING_FIELDS'));
      return;
    }

    // Create new event
    const newEvent = new EventModel({
      title,
      description,
      leadCreatorId: req.user.uid,
      collaborators: collaborators || [],
      eventType: eventType || 'single',
      schedule,
      spaceId,
      pricePerStudent,
      currency: currency || 'USD',
      maxCapacity,
      attendees: [],
      isPublic: isPublic !== undefined ? isPublic : true,
      isActive: true,
      tags: tags || []
    });

    await newEvent.save();
    res.status(201).json(successResponse(newEvent));
  } catch (error: any) {
    console.error('Create event error:', error);
    res.status(500).json(errorResponse(error.message, 'EVENT_CREATE_ERROR'));
  }
};

/**
 * Get event by ID
 */
export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await EventModel.findById(id);

    if (!event) {
      res.status(404).json(errorResponse('Event not found', 'EVENT_NOT_FOUND'));
      return;
    }

    if (!event.isActive || !event.isPublic) {
      // Check if user is authorized to view this event
      // This would need to be enhanced with actual auth logic
      res.status(403).json(errorResponse('Event not available', 'EVENT_NOT_AVAILABLE'));
      return;
    }

    res.status(200).json(successResponse(event));
  } catch (error: any) {
    console.error('Get event error:', error);
    res.status(500).json(errorResponse(error.message, 'EVENT_FETCH_ERROR'));
  }
};

/**
 * Update event details
 */
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { id } = req.params;
    const event = await EventModel.findById(id);

    if (!event) {
      res.status(404).json(errorResponse('Event not found', 'EVENT_NOT_FOUND'));
      return;
    }

    // Check if user is authorized to update this event
    if (event.leadCreatorId !== req.user.uid) {
      const isCollaborator = event.collaborators.some(
        collab => collab.creatorId === req.user?.uid
      );

      if (!isCollaborator) {
        res.status(403).json(errorResponse('Not authorized to update this event', 'NOT_AUTHORIZED'));
        return;
      }
    }

    // Update fields that are provided in the request
    const updateData = req.body;
    Object.keys(updateData).forEach(key => {
      if (key !== 'leadCreatorId' && key !== '_id') {
        // @ts-ignore
        event[key] = updateData[key];
      }
    });

    await event.save();
    res.status(200).json(successResponse(event));
  } catch (error: any) {
    console.error('Update event error:', error);
    res.status(500).json(errorResponse(error.message, 'EVENT_UPDATE_ERROR'));
  }
};

/**
 * Delete/deactivate an event
 */
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { id } = req.params;
    const event = await EventModel.findById(id);

    if (!event) {
      res.status(404).json(errorResponse('Event not found', 'EVENT_NOT_FOUND'));
      return;
    }

    // Check if user is authorized to delete this event
    if (event.leadCreatorId !== req.user.uid) {
      res.status(403).json(errorResponse('Not authorized to delete this event', 'NOT_AUTHORIZED'));
      return;
    }

    // Soft delete by marking as inactive
    event.isActive = false;
    await event.save();

    res.status(200).json(successResponse({ message: 'Event deleted successfully' }));
  } catch (error: any) {
    console.error('Delete event error:', error);
    res.status(500).json(errorResponse(error.message, 'EVENT_DELETE_ERROR'));
  }
};

/**
 * List all public events with optional filtering
 */
export const listEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      creatorId, 
      spaceId, 
      fromDate, 
      toDate, 
      tags,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query: any = { isActive: true, isPublic: true };

    if (creatorId) {
      query.$or = [
        { leadCreatorId: creatorId },
        { 'collaborators.creatorId': creatorId }
      ];
    }

    if (spaceId) {
      query.spaceId = spaceId;
    }

    if (fromDate) {
      query['schedule.startDate'] = { $gte: new Date(fromDate as string) };
    }

    if (toDate) {
      query['schedule.endDate'] = { $lte: new Date(toDate as string) };
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const events = await EventModel.find(query)
      .sort({ 'schedule.startDate': 1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await EventModel.countDocuments(query);

    res.status(200).json(successResponse({
      events,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    }));
  } catch (error: any) {
    console.error('List events error:', error);
    res.status(500).json(errorResponse(error.message, 'EVENTS_FETCH_ERROR'));
  }
};

/**
 * Get events created by the current user
 */
export const getMyEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const events = await EventModel.find({
      $or: [
        { leadCreatorId: req.user.uid },
        { 'collaborators.creatorId': req.user.uid }
      ]
    }).sort({ 'schedule.startDate': 1 });

    res.status(200).json(successResponse(events));
  } catch (error: any) {
    console.error('Get my events error:', error);
    res.status(500).json(errorResponse(error.message, 'EVENTS_FETCH_ERROR'));
  }
};

/**
 * Get event occurrences (for recurring events)
 */
export const getEventOccurrences = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await EventModel.findById(id);

    if (!event) {
      res.status(404).json(errorResponse('Event not found', 'EVENT_NOT_FOUND'));
      return;
    }

    if (event.eventType !== 'recurring') {
      res.status(400).json(errorResponse('Not a recurring event', 'NOT_RECURRING_EVENT'));
      return;
    }

    const occurrences = generateOccurrences(event.schedule);
    res.status(200).json(successResponse(occurrences));
  } catch (error: any) {
    console.error('Get event occurrences error:', error);
    res.status(500).json(errorResponse(error.message, 'OCCURRENCES_FETCH_ERROR'));
  }
};

/**
 * Add a collaborator to an event
 */
export const addCollaborator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { id } = req.params;
    const { creatorId, role, paymentType, paymentValue } = req.body;

    const event = await EventModel.findById(id);

    if (!event) {
      res.status(404).json(errorResponse('Event not found', 'EVENT_NOT_FOUND'));
      return;
    }

    // Check if user is authorized to update this event
    if (event.leadCreatorId !== req.user.uid) {
      res.status(403).json(errorResponse('Not authorized to update this event', 'NOT_AUTHORIZED'));
      return;
    }

    // Check if collaborator already exists
    const existingCollaborator = event.collaborators.find(
      collab => collab.creatorId === creatorId
    );

    if (existingCollaborator) {
      res.status(409).json(errorResponse('Collaborator already exists', 'COLLABORATOR_EXISTS'));
      return;
    }

    // Check if collaborator exists as a user
    const collaborator = await UserModel.findOne({ firebaseId: creatorId });
    if (!collaborator) {
      res.status(404).json(errorResponse('Collaborator user not found', 'USER_NOT_FOUND'));
      return;
    }

    // Add collaborator
    event.collaborators.push({
      creatorId,
      role: role || 'co-host',
      paymentType,
      paymentValue
    });

    await event.save();
    res.status(200).json(successResponse(event));
  } catch (error: any) {
    console.error('Add collaborator error:', error);
    res.status(500).json(errorResponse(error.message, 'COLLABORATOR_ADD_ERROR'));
  }
};

/**
 * Remove a collaborator from an event
 */
export const removeCollaborator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { id, collaboratorId } = req.params;
    const event = await EventModel.findById(id);

    if (!event) {
      res.status(404).json(errorResponse('Event not found', 'EVENT_NOT_FOUND'));
      return;
    }

    // Check if user is authorized to update this event
    if (event.leadCreatorId !== req.user.uid) {
      res.status(403).json(errorResponse('Not authorized to update this event', 'NOT_AUTHORIZED'));
      return;
    }

    // Remove the collaborator
    event.collaborators = event.collaborators.filter(
      collab => collab.creatorId !== collaboratorId
    );

    await event.save();
    res.status(200).json(successResponse(event));
  } catch (error: any) {
    console.error('Remove collaborator error:', error);
    res.status(500).json(errorResponse(error.message, 'COLLABORATOR_REMOVE_ERROR'));
  }
};

// apps/event-service/src/controllers/space.controller.ts
import { Request, Response } from 'express';
import { SpaceModel, UserModel } from '@booking-platform/database';
import { successResponse, errorResponse } from '@booking-platform/utils';
import admin from 'firebase-admin';

export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

/**
 * Create a new space
 */
export const createSpace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    // Get user to check if they exist and are a provider
    const user = await UserModel.findOne({ firebaseId: req.user.uid });
    if (!user) {
      res.status(404).json(errorResponse('User not found', 'USER_NOT_FOUND'));
      return;
    }

    if (user.role !== 'provider' && user.role !== 'admin') {
      res.status(403).json(errorResponse('Only providers can create spaces', 'PROVIDER_ROLE_REQUIRED'));
      return;
    }

    // Extract space data from request
    const {
      title,
      description,
      location,
      capacity,
      amenities,
      pricing,
      availability,
      photos
    } = req.body;

    // Validate required fields
    if (!title || !description || !location || !capacity || !pricing || !availability) {
      res.status(400).json(errorResponse('Missing required fields', 'MISSING_FIELDS'));
      return;
    }

    // Create new space
    const newSpace = new SpaceModel({
      ownerId: req.user.uid,
      title,
      description,
      location,
      capacity,
      amenities: amenities || [],
      pricing,
      availability,
      photos: photos || [],
      isActive: true
    });

    await newSpace.save();
    res.status(201).json(successResponse(newSpace));
  } catch (error: any) {
    console.error('Create space error:', error);
    res.status(500).json(errorResponse(error.message, 'SPACE_CREATE_ERROR'));
  }
};

/**
 * Get space by ID
 */
export const getSpaceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const space = await SpaceModel.findById(id);

    if (!space) {
      res.status(404).json(errorResponse('Space not found', 'SPACE_NOT_FOUND'));
      return;
    }

    if (!space.isActive) {
      res.status(403).json(errorResponse('Space not available', 'SPACE_NOT_AVAILABLE'));
      return;
    }

    res.status(200).json(successResponse(space));
  } catch (error: any) {
    console.error('Get space error:', error);
    res.status(500).json(errorResponse(error.message, 'SPACE_FETCH_ERROR'));
  }
};

/**
 * Update space details
 */
export const updateSpace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { id } = req.params;
    const space = await SpaceModel.findById(id);

    if (!space) {
      res.status(404).json(errorResponse('Space not found', 'SPACE_NOT_FOUND'));
      return;
    }

    // Check if user is authorized to update this space
    if (space.ownerId !== req.user.uid) {
      res.status(403).json(errorResponse('Not authorized to update this space', 'NOT_AUTHORIZED'));
      return;
    }

    // Update fields that are provided in the request
    const updateData = req.body;
    Object.keys(updateData).forEach(key => {
      if (key !== 'ownerId' && key !== '_id') {
        // @ts-ignore
        space[key] = updateData[key];
      }
    });

    await space.save();
    res.status(200).json(successResponse(space));
  } catch (error: any) {
    console.error('Update space error:', error);
    res.status(500).json(errorResponse(error.message, 'SPACE_UPDATE_ERROR'));
  }
};

/**
 * Delete/deactivate a space
 */
export const deleteSpace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { id } = req.params;
    const space = await SpaceModel.findById(id);

    if (!space) {
      res.status(404).json(errorResponse('Space not found', 'SPACE_NOT_FOUND'));
      return;
    }

    // Check if user is authorized to delete this space
    if (space.ownerId !== req.user.uid) {
      res.status(403).json(errorResponse('Not authorized to delete this space', 'NOT_AUTHORIZED'));
      return;
    }

    // Soft delete by marking as inactive
    space.isActive = false;
    await space.save();

    res.status(200).json(successResponse({ message: 'Space deleted successfully' }));
  } catch (error: any) {
    console.error('Delete space error:', error);
    res.status(500).json(errorResponse(error.message, 'SPACE_DELETE_ERROR'));
  }
};

/**
 * List all active spaces with optional filtering
 */
export const listSpaces = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      ownerId, 
      city, 
      capacity, 
      amenities,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query: any = { isActive: true };

    if (ownerId) {
      query.ownerId = ownerId;
    }

    if (city) {
      query['location.city'] = city;
    }

    if (capacity) {
      query.capacity = { $gte: Number(capacity) };
    }

    if (amenities) {
      const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
      query.amenities = { $all: amenitiesArray };
    }

    if (minPrice) {
      query['pricing.hourlyRate'] = { $gte: Number(minPrice) };
    }

    if (maxPrice) {
      if (!query['pricing.hourlyRate']) {
        query['pricing.hourlyRate'] = {};
      }
      query['pricing.hourlyRate'].$lte = Number(maxPrice);
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const spaces = await SpaceModel.find(query)
      .sort({ 'pricing.hourlyRate': 1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await SpaceModel.countDocuments(query);

    res.status(200).json(successResponse({
      spaces,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    }));
  } catch (error: any) {
    console.error('List spaces error:', error);
    res.status(500).json(errorResponse(error.message, 'SPACES_FETCH_ERROR'));
  }
};

/**
 * Get spaces owned by the current user
 */
export const getMySpaces = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const spaces = await SpaceModel.find({ ownerId: req.user.uid });
    res.status(200).json(successResponse(spaces));
  } catch (error: any) {
    console.error('Get my spaces error:', error);
    res.status(500).json(errorResponse(error.message, 'SPACES_FETCH_ERROR'));
  }
};

/**
 * Check space availability for a specific time range
 */
export const checkSpaceAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime } = req.query;

    if (!date || !startTime || !endTime) {
      res.status(400).json(errorResponse('Missing required parameters', 'MISSING_PARAMS'));
      return;
    }

    const space = await SpaceModel.findById(id);

    if (!space || !space.isActive) {
      res.status(404).json(errorResponse('Space not found or not available', 'SPACE_UNAVAILABLE'));
      return;
    }

    // Check if the requested date falls on a day when the space is available
    const requestDate = new Date(date as string);
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][requestDate.getDay()];
    
    // Find availability for the requested day of week
    const dayAvailability = space.availability.find(
      avail => avail.dayOfWeek === dayOfWeek
    );

    if (!dayAvailability) {
      res.status(200).json(successResponse({ available: false, reason: 'Space not available on this day' }));
      return;
    }

    // Check if the requested time range falls within the available hours
    const spaceStartTime = dayAvailability.startTime;
    const spaceEndTime = dayAvailability.endTime;
    
    if (startTime < spaceStartTime || endTime > spaceEndTime) {
      res.status(200).json(successResponse({ 
        available: false, 
        reason: 'Time range outside of space operating hours',
        availableHours: {
          start: spaceStartTime,
          end: spaceEndTime
        }
      }));
      return;
    }

    // Here we would also check for conflicting bookings in a real system
    // This would require querying the booking service or database

    res.status(200).json(successResponse({ available: true }));
  } catch (error: any) {
    console.error('Check availability error:', error);
    res.status(500).json(errorResponse(error.message, 'AVAILABILITY_CHECK_ERROR'));
  }
};

// apps/event-service/src/routes/event.routes.ts
import { Router } from 'express';
import * as EventController from '../controllers/event.controller';

const router = Router();

// Event endpoints
router.post('/events', EventController.createEvent);
router.get('/events', EventController.listEvents);
router.get('/events/me', EventController.getMyEvents);
router.get('/events/:id', EventController.getEventById);
router.put('/events/:id', EventController.updateEvent);
router.delete('/events/:id', EventController.deleteEvent);
router.get('/events/:id/occurrences', EventController.getEventOccurrences);

// Collaborator endpoints
router.post('/events/:id/collaborators', EventController.addCollaborator);
router.delete('/events/:id/collaborators/:collaboratorId', EventController.removeCollaborator);

export default router;

// apps/event-service/src/routes/space.routes.ts
import { Router } from 'express';
import * as SpaceController from '../controllers/space.controller';

const router = Router();

// Space endpoints
router.post('/spaces', SpaceController.createSpace);
router.get('/spaces', SpaceController.listSpaces);
router.get('/spaces/me', SpaceController.getMySpaces);
router.get('/spaces/:id', SpaceController.getSpaceById);
router.put('/spaces/:id', SpaceController.updateSpace);
router.delete('/spaces/:id', SpaceController.deleteSpace);
router.get('/spaces/:id/availability', SpaceController.checkSpaceAvailability);

export default router;
