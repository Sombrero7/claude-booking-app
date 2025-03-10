// apps/booking-service/package.json
{
  "name": "@booking-platform/booking-service",
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
    "axios": "^1.4.0",
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

// apps/booking-service/tsconfig.json
{
  "extends": "@booking-platform/typescript-config/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}

// apps/booking-service/.env.example
NODE_ENV=development
PORT=4003
MONGODB_URI=mongodb://localhost:27017/booking-platform
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
PAYMENT_SERVICE_URL=http://localhost:4004
EVENT_SERVICE_URL=http://localhost:4002

// apps/booking-service/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectToDatabase } from '@booking-platform/database';

// Load environment variables
dotenv.config();

// Import routes
import bookingRoutes from './routes/booking.routes';
import requestRoutes from './routes/request.routes';

// Initialize Express app
const app = express();
const port = process.env.PORT || 4003;

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'booking-service' });
});

// Register routes
app.use('/api', bookingRoutes);
app.use('/api', requestRoutes);

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
      console.log(`Booking Service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// apps/booking-service/src/controllers/booking.controller.ts
import { Request, Response } from 'express';
import { BookingModel, EventModel } from '@booking-platform/database';
import { successResponse, errorResponse } from '@booking-platform/utils';
import axios from 'axios';
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
 * Create a new booking for an event
 */
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { eventId, eventDate, attendeesCount, specialRequirements } = req.body;

    // Validate required fields
    if (!eventId || !eventDate) {
      res.status(400).json(errorResponse('Missing required fields', 'MISSING_FIELDS'));
      return;
    }

    // Fetch event details to calculate total amount
    const event = await EventModel.findById(eventId);
    if (!event) {
      res.status(404).json(errorResponse('Event not found', 'EVENT_NOT_FOUND'));
      return;
    }

    // Check if event is active and public
    if (!event.isActive || !event.isPublic) {
      res.status(403).json(errorResponse('Event not available for booking', 'EVENT_NOT_AVAILABLE'));
      return;
    }

    // Calculate total amount
    const count = attendeesCount || 1;
    const totalAmount = event.pricePerStudent * count;

    // Check if there's space available
    const existingBookings = await BookingModel.find({
      eventId,
      eventDate: new Date(eventDate),
      status: { $ne: 'cancelled' }
    });

    const totalAttendees = existingBookings.reduce((sum, booking) => sum + booking.attendeesCount, 0);
    if (totalAttendees + count > event.maxCapacity) {
      res.status(400).json(errorResponse('Not enough spots available', 'CAPACITY_EXCEEDED'));
      return;
    }

    // Create new booking
    const newBooking = new BookingModel({
      userId: req.user.uid,
      eventId,
      eventDate: new Date(eventDate),
      status: 'pending',
      paymentStatus: 'unpaid',
      attendeesCount: count,
      totalAmount,
      specialRequirements
    });

    await newBooking.save();

    // Initiate payment process
    try {
      const paymentResponse = await axios.post(`${process.env.PAYMENT_SERVICE_URL}/api/payments/initiate`, {
        bookingId: newBooking._id,
        amount: totalAmount,
        currency: event.currency,
        description: `Booking for ${event.title}`,
        metadata: {
          eventId: event._id,
          eventTitle: event.title,
          bookingId: newBooking._id
        }
      });

      // Update booking with payment ID
      if (paymentResponse.data.success) {
        newBooking.paymentId = paymentResponse.data.data.paymentId;
        await newBooking.save();
      }

      res.status(201).json(successResponse({
        booking: newBooking,
        payment: paymentResponse.data.data
      }));
    } catch (paymentError) {
      console.error('Payment initiation error:', paymentError);
      // Still create the booking, but note that payment failed to initialize
      res.status(201).json(successResponse({
        booking: newBooking,
        paymentError: 'Failed to initialize payment. Please try paying later.'
      }));
    }
  } catch (error: any) {
    console.error('Create booking error:', error);
    res.status(500).json(errorResponse(error.message, 'BOOKING_CREATE_ERROR'));
  }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { id } = req.params;
    const booking = await BookingModel.findById(id);

    if (!booking) {
      res.status(404).json(errorResponse('Booking not found', 'BOOKING_NOT_FOUND'));
      return;
    }

    // Check if user is authorized to view this booking
    // Either the booker or the event creator/collaborator can view
    const event = await EventModel.findById(booking.eventId);

    if (booking.userId !== req.user.uid && 
        event?.leadCreatorId !== req.user.uid && 
        !event?.collaborators.some(collab => collab.creatorId === req.user?.uid)) {
      res.status(403).json(errorResponse('Not authorized to view this booking', 'NOT_AUTHORIZED'));
      return;
    }

    res.status(200).json(successResponse(booking));
  } catch (error: any) {
    console.error('Get booking error:', error);
    res.status(500).json(errorResponse(error.message, 'BOOKING_FETCH_ERROR'));
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['confirmed', 'cancelled'].includes(status)) {
      res.status(400).json(errorResponse('Invalid status', 'INVALID_STATUS'));
      return;
    }

    const booking = await BookingModel.findById(id);

    if (!booking) {
      res.status(404).json(errorResponse('Booking not found', 'BOOKING_NOT_FOUND'));
      return;
    }

    // Check if user is authorized to update this booking
    const event = await EventModel.findById(booking.eventId);

    const isCreator = event?.leadCreatorId === req.user.uid || 
                      event?.collaborators.some(collab => collab.creatorId === req.user?.uid);
    const isBooker = booking.userId === req.user.uid;

    // Only the creator can confirm, and either creator or booker can cancel
    if ((status === 'confirmed' && !isCreator) || 
        (status === 'cancelled' && !isCreator && !isBooker)) {
      res.status(403).json(errorResponse('Not authorized to update this booking', 'NOT_AUTHORIZED'));
      return;
    }

    // Handle cancellation payment refund logic through payment service
    if (status === 'cancelled' && booking.paymentStatus === 'paid') {
      try {
        await axios.post(`${process.env.PAYMENT_SERVICE_URL}/api/payments/refund`, {
          bookingId: booking._id
        });
        
        // Payment service will update the payment status asynchronously
      } catch (refundError) {
        console.error('Refund error:', refundError);
        // Continue with cancellation but note the refund issue
      }
    }

    booking.status = status;
    await booking.save();

    res.status(200).json(successResponse(booking));
  } catch (error: any) {
    console.error('Update booking status error:', error);
    res.status(500).json(errorResponse(error.message, 'BOOKING_UPDATE_ERROR'));
  }
};

/**
 * List user's bookings
 */
export const getUserBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { status, fromDate, toDate, page = 1, limit = 10 } = req.query;

    // Build query
    const query: any = { userId: req.user.uid };

    if (status) {
      query.status = status;
    }

    if (fromDate) {
      query.eventDate = { $gte: new Date(fromDate as string) };
    }

    if (toDate) {
      if (!query.eventDate) {
        query.eventDate = {};
      }
      query.eventDate.$lte = new Date(toDate as string);
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const bookings = await BookingModel.find(query)
      .sort({ eventDate: 1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await BookingModel.countDocuments(query);

    res.status(200).json(successResponse({
      bookings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    }));
  } catch (error: any) {
    console.error('Get user bookings error:', error);
    res.status(500).json(errorResponse(error.message, 'BOOKINGS_FETCH_ERROR'));
  }
};

/**
 * List bookings for an event (only for event creator/collaborator)
 */
export const getEventBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { eventId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Check if user is authorized to view these bookings
    const event = await EventModel.findById(eventId);

    if (!event) {
      res.status(404).json(errorResponse('Event not found', 'EVENT_NOT_FOUND'));
      return;
    }

    if (event.leadCreatorId !== req.user.uid && 
        !event.collaborators.some(collab => collab.creatorId === req.user?.uid)) {
      res.status(403).json(errorResponse('Not authorized to view bookings for this event', 'NOT_AUTHORIZED'));
      return;
    }

    // Build query
    const query: any = { eventId };

    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const bookings = await BookingModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await BookingModel.countDocuments(query);

    res.status(200).json(successResponse({
      bookings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    }));
  } catch (error: any) {
    console.error('Get event bookings error:', error);
    res.status(500).json(errorResponse(error.message, 'BOOKINGS_FETCH_ERROR'));
  }
};

// apps/booking-service/src/controllers/request.controller.ts
import { Request, Response } from 'express';
import { RequestModel, UserModel, SpaceModel } from '@booking-platform/database';
import { successResponse, errorResponse, calculatePlatformFee } from '@booking-platform/utils';
import admin from 'firebase-admin';

export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

/**
 * Create a new custom event request
 */
export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const {
      creatorId,
      spaceId,
      title,
      description,
      desiredDateTime,
      attendeesCount,
      specialRequirements
    } = req.body;

    // Validate required fields
    if (!creatorId || !spaceId || !title || !description || !desiredDateTime) {
      res.status(400).json(errorResponse('Missing required fields', 'MISSING_FIELDS'));
      return;
    }

    // Validate creator and space exist
    const creator = await UserModel.findOne({ firebaseId: creatorId });
    if (!creator) {
      res.status(404).json(errorResponse('Creator not found', 'CREATOR_NOT_FOUND'));
      return;
    }

    const space = await SpaceModel.findById(spaceId);
    if (!space) {
      res.status(404).json(errorResponse('Space not found', 'SPACE_NOT_FOUND'));
      return;
    }

    // Check if space is available on that date/time
    // This would be a more complex check in a real application

    // Calculate estimated price
    const venueFee = space.pricing.hourlyRate * 
                    ((new Date(desiredDateTime.end).getTime() - new Date(desiredDateTime.start).getTime()) / 3600000);
    const creatorFee = 100; // This would be determined by creator's rates
    const platformFee = calculatePlatformFee(venueFee + creatorFee);
    const totalCost = venueFee + creatorFee + platformFee;

    // Create new request
    const newRequest = new RequestModel({
      userId: req.user.uid,
      creatorId,
      spaceId,
      title,
      description,
      desiredDateTime,
      attendeesCount: attendeesCount || 1,
      status: 'pending',
      venueApproval: 'pending',
      creatorApproval: 'pending',
      priceBreakdown: {
        venueFee,
        creatorFee,
        platformFee,
        totalCost
      },
      paymentStatus: 'unpaid',
      specialRequirements
    });

    await newRequest.save();

    // Notify creator and venue owner
    // In a real app, you would trigger notifications here

    res.status(201).json(successResponse(newRequest));
  } catch (error: any) {
    console.error('Create request error:', error);
    res.status(500).json(errorResponse(error.message, 'REQUEST_CREATE_ERROR'));
  }
};

/**
 * Get request by ID
 */
export const getRequestById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { id } = req.params;
    const request = await RequestModel.findById(id);

    if (!request) {
      res.status(404).json(errorResponse('Request not found', 'REQUEST_NOT_FOUND'));
      return;
    }

    // Check if user is authorized to view this request
    // Either the requester, the creator, or the venue owner can view
    const space = await SpaceModel.findById(request.spaceId);

    if (request.userId !== req.user.uid && 
        request.creatorId !== req.user.uid && 
        space?.ownerId !== req.user.uid) {
      res.status(403).json(errorResponse('Not authorized to view this request', 'NOT_AUTHORIZED'));
      return;
    }

    res.status(200).json(successResponse(request));
  } catch (error: any) {
    console.error('Get request error:', error);
    res.status(500).json(errorResponse(error.message, 'REQUEST_FETCH_ERROR'));
  }
};

/**
 * Update request approval status (for creator or venue)
 */
export const updateRequestApproval = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { id } = req.params;
    const { approval, price } = req.body;

    if (!approval || !['accepted', 'rejected'].includes(approval)) {
      res.status(400).json(errorResponse('Invalid approval status', 'INVALID_APPROVAL'));
      return;
    }

    const request = await RequestModel.findById(id);

    if (!request) {
      res.status(404).json(errorResponse('Request not found', 'REQUEST_NOT_FOUND'));
      return;
    }

    // Determine if user is creator or venue owner
    const space = await SpaceModel.findById(request.spaceId);
    const isCreator = request.creatorId === req.user.uid;
    const isVenueOwner = space?.ownerId === req.user.uid;

    if (!isCreator && !isVenueOwner) {
      res.status(403).json(errorResponse('Not authorized to update this request', 'NOT_AUTHORIZED'));
      return;
    }

    // Update appropriate approval field
    if (isCreator) {
      request.creatorApproval = approval;
      
      // Update creator fee if provided
      if (price && approval === 'accepted') {
        request.priceBreakdown.creatorFee = price;
        request.priceBreakdown.totalCost = 
          request.priceBreakdown.venueFee + 
          price + 
          request.priceBreakdown.platformFee;
      }
    } else if (isVenueOwner) {
      request.venueApproval = approval;
      
      // Update venue fee if provided
      if (price && approval === 'accepted') {
        request.priceBreakdown.venueFee = price;
        request.priceBreakdown.totalCost = 
          price + 
          request.priceBreakdown.creatorFee + 
          request.priceBreakdown.platformFee;
      }
    }

    // Update overall status if both parties have responded
    if (request.creatorApproval !== 'pending' && request.venueApproval !== 'pending') {
      request.status = (request.creatorApproval === 'accepted' && request.venueApproval === 'accepted')
        ? 'accepted'
        : 'rejected';
    }

    await request.save();

    // If both accepted, initiate payment flow
    if (request.status === 'accepted') {
      // In a real app, initiate payment here
    }

    res.status(200).json(successResponse(request));
  } catch (error: any) {
    console.error('Update request approval error:', error);
    res.status(500).json(errorResponse(error.message, 'REQUEST_UPDATE_ERROR'));
  }
};

/**
 * List user's requests
 */
export const getUserRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query: any = { userId: req.user.uid };

    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const requests = await RequestModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await RequestModel.countDocuments(query);

    res.status(200).json(successResponse({
      requests,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    }));
  } catch (error: any) {
    console.error('Get user requests error:', error);
    res.status(500).json(errorResponse(error.message, 'REQUESTS_FETCH_ERROR'));
  }
};

/**
 * List pending requests for creator
 */
export const getCreatorRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query: any = { creatorId: req.user.uid };

    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const requests = await RequestModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await RequestModel.countDocuments(query);

    res.status(200).json(successResponse({
      requests,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    }));
  } catch (error: any) {
    console.error('Get creator requests error:', error);
    res.status(500).json(errorResponse(error.message, 'REQUESTS_FETCH_ERROR'));
  }
};

/**
 * List pending requests for venue
 */
export const getVenueRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    // First get all spaces owned by the user
    const spaces = await SpaceModel.find({ ownerId: req.user.uid });
    
    if (!spaces.length) {
      res.status(200).json(successResponse({
        requests: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0
        }
      }));
      return;
    }

    const spaceIds = spaces.map(space => space._id);
    const { status, page = 1, limit = 10 } = req.query;

    // Build query for requests
    const query: any = { spaceId: { $in: spaceIds } };

    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const requests = await RequestModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await RequestModel.countDocuments(query);

    res.status(200).json(successResponse({
      requests,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    }));
  } catch (error: any) {
    console.error('Get venue requests error:', error);
    res.status(500).json(errorResponse(error.message, 'REQUESTS_FETCH_ERROR'));
  }
};

// apps/booking-service/src/routes/booking.routes.ts
import { Router } from 'express';
import * as BookingController from '../controllers/booking.controller';

const router = Router();

// Booking endpoints
router.post('/bookings', BookingController.createBooking);
router.get('/bookings/me', BookingController.getUserBookings);
router.get('/bookings/:id', BookingController.getBookingById);
router.put('/bookings/:id/status', BookingController.updateBookingStatus);
router.get('/events/:eventId/bookings', BookingController.getEventBookings);

export default router;

// apps/booking-service/src/routes/request.routes.ts
import { Router } from 'express';
import * as RequestController from '../controllers/request.controller';

const router = Router();

// Request endpoints
router.post('/requests', RequestController.createRequest);
router.get('/requests/me', RequestController.getUserRequests);
router.get('/requests/creator', RequestController.getCreatorRequests);
router.get('/requests/venue', RequestController.getVenueRequests);
router.get('/requests/:id', RequestController.getRequestById);
router.put('/requests/:id/approval', RequestController.updateRequestApproval);

export default router;
