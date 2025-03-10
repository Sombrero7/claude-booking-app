// apps/payment-service/package.json
{
  "name": "@booking-platform/payment-service",
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
    "morgan": "^1.10.0",
    "stripe": "^12.10.0"
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

// apps/payment-service/tsconfig.json
{
  "extends": "@booking-platform/typescript-config/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}

// apps/payment-service/.env.example
NODE_ENV=development
PORT=4004
MONGODB_URI=mongodb://localhost:27017/booking-platform
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
BOOKING_SERVICE_URL=http://localhost:4003

// apps/payment-service/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectToDatabase } from '@booking-platform/database';

// Load environment variables
dotenv.config();

// Import routes
import paymentRoutes from './routes/payment.routes';
import webhookRoutes from './routes/webhook.routes';

// Initialize Express app
const app = express();
const port = process.env.PORT || 4004;

// Apply middleware
app.use(helmet());
app.use(cors());

// Special handling for webhook route (needs raw body)
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// Standard middleware for other routes
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'payment-service' });
});

// Register routes
app.use('/api', paymentRoutes);
app.use('/api', webhookRoutes);

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
      console.log(`Payment Service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// apps/payment-service/src/services/stripe.service.ts
import Stripe from 'stripe';
import { calculateCollaboratorSplits } from '@booking-platform/utils';
import { UserModel, EventModel, TransactionModel } from '@booking-platform/database';

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-08-16'
});

/**
 * Create a Stripe customer
 */
export const createStripeCustomer = async (userId: string, email: string, name: string): Promise<string> => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId
      }
    });

    return customer.id;
  } catch (error) {
    console.error('Create Stripe customer error:', error);
    throw error;
  }
};

/**
 * Create a Stripe connected account for creators
 */
export const createStripeConnectedAccount = async (userId: string, email: string): Promise<string> => {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      metadata: {
        userId
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      }
    });

    return account.id;
  } catch (error) {
    console.error('Create Stripe connected account error:', error);
    throw error;
  }
};

/**
 * Create account link for onboarding
 */
export const createAccountLink = async (accountId: string, refreshUrl: string, returnUrl: string): Promise<string> => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    });

    return accountLink.url;
  } catch (error) {
    console.error('Create account link error:', error);
    throw error;
  }
};

/**
 * Create a payment intent
 */
export const createPaymentIntent = async (
  amount: number,
  currency: string,
  customerId: string,
  metadata: any
): Promise<Stripe.PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata,
      payment_method_types: ['card']
    });

    return paymentIntent;
  } catch (error) {
    console.error('Create payment intent error:', error);
    throw error;
  }
};

/**
 * Handle payment for booking with collaborator splits
 */
export const handleBookingPayment = async (bookingId: string, eventId: string, amount: number, currency: string): Promise<any> => {
  try {
    // Get event details to calculate splits
    const event = await EventModel.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Get lead creator's Stripe account
    const leadCreator = await UserModel.findOne({ firebaseId: event.leadCreatorId });
    if (!leadCreator || !leadCreator.stripe?.accountId) {
      throw new Error('Lead creator not found or Stripe account not set up');
    }

    // Calculate collaborator splits
    let collaboratorSplits: Array<{ creatorId: string; amount: number }> = [];
    let leadCreatorShare = amount;
    
    if (event.collaborators && event.collaborators.length > 0) {
      collaboratorSplits = calculateCollaboratorSplits(
        amount,
        event.collaborators
      );
      
      // Subtract collaborator amounts from lead creator share
      leadCreatorShare = amount - collaboratorSplits.reduce((sum, split) => sum + split.amount, 0);
    }

    // Store transaction record
    const transaction = new TransactionModel({
      bookingId,
      transactionType: 'booking',
      amount,
      currency,
      paymentMethod: 'stripe',
      collaboratorSplits,
      platformFee: 0, // Calculated elsewhere
      status: 'pending'
    });
    
    await transaction.save();

    // Get collaborator Stripe accounts
    const collaboratorPayments = [];
    
    for (const split of collaboratorSplits) {
      const collaborator = await UserModel.findOne({ firebaseId: split.creatorId });
      if (collaborator && collaborator.stripe?.accountId) {
        collaboratorPayments.push({
          creatorId: split.creatorId,
          stripeAccountId: collaborator.stripe.accountId,
          amount: split.amount
        });
      }
    }

    return {
      transactionId: transaction._id,
      leadCreatorShare,
      leadCreatorStripeAccount: leadCreator.stripe.accountId,
      collaboratorPayments
    };
  } catch (error) {
    console.error('Handle booking payment error:', error);
    throw error;
  }
};

/**
 * Process refund
 */
export const processRefund = async (paymentIntentId: string): Promise<Stripe.Refund> => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId
    });

    return refund;
  } catch (error) {
    console.error('Process refund error:', error);
    throw error;
  }
};

// apps/payment-service/src/controllers/payment.controller.ts
import { Request, Response } from 'express';
import { 
  TransactionModel, 
  BookingModel, 
  UserModel,
  RequestModel
} from '@booking-platform/database';
import { successResponse, errorResponse, calculatePlatformFee } from '@booking-platform/utils';
import * as stripeService from '../services/stripe.service';
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
 * Initiate a payment
 */
export const initiatePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      bookingId, 
      requestId,
      amount, 
      currency, 
      description, 
      metadata
    } = req.body;

    if ((!bookingId && !requestId) || !amount || !currency) {
      res.status(400).json(errorResponse('Missing required fields', 'MISSING_FIELDS'));
      return;
    }

    // Determine transaction type and get details
    let userId: string;
    let entityId: string;
    let transactionType: 'booking' | 'request';

    if (bookingId) {
      const booking = await BookingModel.findById(bookingId);
      if (!booking) {
        res.status(404).json(errorResponse('Booking not found', 'BOOKING_NOT_FOUND'));
        return;
      }
      userId = booking.userId;
      entityId = booking.eventId;
      transactionType = 'booking';
    } else {
      const request = await RequestModel.findById(requestId);
      if (!request) {
        res.status(404).json(errorResponse('Request not found', 'REQUEST_NOT_FOUND'));
        return;
      }
      userId = request.userId;
      entityId = request._id;
      transactionType = 'request';
    }

    // Get or create Stripe customer
    const user = await UserModel.findOne({ firebaseId: userId });
    if (!user) {
      res.status(404).json(errorResponse('User not found', 'USER_NOT_FOUND'));
      return;
    }

    let customerId = user.stripe?.customerId;
    
    if (!customerId) {
      customerId = await stripeService.createStripeCustomer(
        user.firebaseId,
        user.email,
        user.profile.name
      );
      
      // Update user with Stripe customer ID
      user.stripe = {
        ...user.stripe,
        customerId
      };
      await user.save();
    }

    // Calculate platform fee
    const platformFee = calculatePlatformFee(amount);
    const totalAmount = amount + platformFee;

    // Create new transaction record
    const transaction = new TransactionModel({
      bookingId: bookingId || undefined,
      requestId: requestId || undefined,
      transactionType,
      amount: totalAmount,
      currency: currency.toUpperCase(),
      paymentMethod: 'stripe',
      platformFee,
      status: 'pending'
    });

    await transaction.save();

    // Create Stripe payment intent
    const paymentIntent = await stripeService.createPaymentIntent(
      totalAmount,
      currency,
      customerId,
      {
        ...metadata,
        transactionId: transaction._id.toString()
      }
    );

    // Update transaction with payment intent ID
    transaction.stripePaymentIntentId = paymentIntent.id;
    await transaction.save();

    // If it's a booking, update booking with payment ID
    if (bookingId) {
      await BookingModel.findByIdAndUpdate(bookingId, {
        paymentId: transaction._id
      });
    } else if (requestId) {
      await RequestModel.findByIdAndUpdate(requestId, {
        paymentId: transaction._id
      });
    }

    res.status(200).json(successResponse({
      paymentId: transaction._id,
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
      currency: currency.toUpperCase()
    }));
  } catch (error: any) {
    console.error('Initiate payment error:', error);
    res.status(500).json(errorResponse(error.message, 'PAYMENT_INITIATE_ERROR'));
  }
};

/**
 * Process a payment confirmation
 */
export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      res.status(400).json(errorResponse('Missing payment intent ID', 'MISSING_PAYMENT_INTENT_ID'));
      return;
    }

    // Find transaction by payment intent ID
    const transaction = await TransactionModel.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!transaction) {
      res.status(404).json(errorResponse('Transaction not found', 'TRANSACTION_NOT_FOUND'));
      return;
    }

    // Update transaction status
    transaction.status = 'completed';
    await transaction.save();

    // Update the related booking or request
    if (transaction.bookingId) {
      await BookingModel.findByIdAndUpdate(transaction.bookingId, {
        paymentStatus: 'paid',
        status: 'confirmed'
      });
    } else if (transaction.requestId) {
      await RequestModel.findByIdAndUpdate(transaction.requestId, {
        paymentStatus: 'paid'
      });
    }

    res.status(200).json(successResponse({ message: 'Payment confirmed successfully' }));
  } catch (error: any) {
    console.error('Confirm payment error:', error);
    res.status(500).json(errorResponse(error.message, 'PAYMENT_CONFIRM_ERROR'));
  }
};

/**
 * Process a refund
 */
export const processRefund = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId, requestId } = req.body;

    if (!bookingId && !requestId) {
      res.status(400).json(errorResponse('Missing booking or request ID', 'MISSING_ID'));
      return;
    }

    // Find transaction
    const transaction = await TransactionModel.findOne({
      $or: [
        { bookingId },
        { requestId }
      ]
    });

    if (!transaction) {
      res.status(404).json(errorResponse('Transaction not found', 'TRANSACTION_NOT_FOUND'));
      return;
    }

    if (transaction.status !== 'completed') {
      res.status(400).json(errorResponse('Transaction not completed', 'TRANSACTION_NOT_COMPLETED'));
      return;
    }

    if (!transaction.stripePaymentIntentId) {
      res.status(400).json(errorResponse('No payment intent found', 'NO_PAYMENT_INTENT'));
      return;
    }

    // Process refund via Stripe
    const refund = await stripeService.processRefund(transaction.stripePaymentIntentId);

    // Update transaction status
    transaction.status = 'refunded';
    transaction.refundId = refund.id;
    await transaction.save();

    // Update the related booking or request
    if (transaction.bookingId) {
      await BookingModel.findByIdAndUpdate(transaction.bookingId, {
        paymentStatus: 'unpaid',
        status: 'cancelled'
      });
    } else if (transaction.requestId) {
      await RequestModel.findByIdAndUpdate(transaction.requestId, {
        paymentStatus: 'unpaid',
        status: 'rejected'
      });
    }

    res.status(200).json(successResponse({ 
      message: 'Refund processed successfully',
      refundId: refund.id
    }));
  } catch (error: any) {
    console.error('Process refund error:', error);
    res.status(500).json(errorResponse(error.message, 'REFUND_PROCESS_ERROR'));
  }
};

/**
 * Get transaction history for a user
 */
export const getUserTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    // Get all bookings and requests for this user
    const bookings = await BookingModel.find({ userId: req.user.uid });
    const requests = await RequestModel.find({ userId: req.user.uid });

    const bookingIds = bookings.map(booking => booking._id);
    const requestIds = requests.map(request => request._id);

    // Find all transactions related to these bookings and requests
    const transactions = await TransactionModel.find({
      $or: [
        { bookingId: { $in: bookingIds } },
        { requestId: { $in: requestIds } }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json(successResponse(transactions));
  } catch (error: any) {
    console.error('Get user transactions error:', error);
    res.status(500).json(errorResponse(error.message, 'TRANSACTIONS_FETCH_ERROR'));
  }
};

/**
 * Set up Stripe Connected Account for creators
 */
export const setupStripeAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('User not authenticated', 'AUTH_REQUIRED'));
      return;
    }

    const { returnUrl, refreshUrl } = req.body;

    if (!returnUrl || !refreshUrl) {
      res.status(400).json(errorResponse('Missing URLs', 'MISSING_URLS'));
      return;
    }

    // Get user
    const user = await UserModel.findOne({ firebaseId: req.user.uid });
    if (!user) {
      res.status(404).json(errorResponse('User not found', 'USER_NOT_FOUND'));
      return;
    }

    // Check if user is a provider
    if (user.role !== 'provider' && user.role !== 'admin') {
      res.status(403).json(errorResponse('Only providers can set up Stripe accounts', 'PROVIDER_ROLE_REQUIRED'));
      return;
    }

    // Check if user already has a Stripe account
    if (user.stripe?.accountId) {
      // Get account details to check if onboarding is complete
      // This would require additional Stripe API calls in a real implementation
      
      res.status(409).json(errorResponse('Stripe account already exists', 'ACCOUNT_EXISTS'));
      return;
    }

    // Create Stripe connected account
    const accountId = await stripeService.createStripeConnectedAccount(user.firebaseId, user.email);
    
    // Update user with Stripe account ID
    user.stripe = {
      ...user.stripe,
      accountId
    };
    await user.save();

    // Create account link for onboarding
    const accountLinkUrl = await stripeService.createAccountLink(accountId, refreshUrl, returnUrl);

    res.status(200).json(successResponse({
      accountId,
      accountLinkUrl
    }));
  } catch (error: any) {
    console.error('Setup Stripe account error:', error);
    res.status(500).json(errorResponse(error.message, 'STRIPE_SETUP_ERROR'));
  }
};

// apps/payment-service/src/controllers/webhook.controller.ts
import { Request, Response } from 'express';
import { TransactionModel, BookingModel, RequestModel } from '@booking-platform/database';
import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-08-16'
});

/**
 * Handle Stripe webhooks
 */
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res.status(400).send('Webhook Error: No signature provided');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    // Add more event handlers as needed
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
};

/**
 * Handle payment intent succeeded event
 */
const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent): Promise<void> => {
  try {
    const transactionId = paymentIntent.metadata.transactionId;
    
    if (!transactionId) {
      console.error('No transaction ID in payment intent metadata');
      return;
    }

    // Update transaction status
    const transaction = await TransactionModel.findById(transactionId);
    
    if (!transaction) {
      console.error(`Transaction not found for ID: ${transactionId}`);
      return;
    }

    transaction.status = 'completed';
    transaction.paymentMethodDetails = {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      capturedAt: new Date()
    };
    
    await transaction.save();

    // Update booking or request status
    if (transaction.bookingId) {
      await BookingModel.findByIdAndUpdate(transaction.bookingId, {
        paymentStatus: 'paid',
        status: 'confirmed'
      });
      
      // Notify booking service
      try {
        await axios.post(`${process.env.BOOKING_SERVICE_URL}/api/bookings/${transaction.bookingId}/payment-confirmation`, {
          paymentId: transaction._id
        });
      } catch (notifyError) {
        console.error('Error notifying booking service:', notifyError);
      }
    } else if (transaction.requestId) {
      await RequestModel.findByIdAndUpdate(transaction.requestId, {
        paymentStatus: 'paid'
      });
      
      // Notify booking service
      try {
        await axios.post(`${process.env.BOOKING_SERVICE_URL}/api/requests/${transaction.requestId}/payment-confirmation`, {
          paymentId: transaction._id
        });
      } catch (notifyError) {
        console.error('Error notifying booking service:', notifyError);
      }
    }

    console.log(`Payment successful for transaction: ${transactionId}`);
  } catch (error) {
    console.error('Error handling payment_intent.succeeded event:', error);
  }
};

/**
 * Handle payment intent failed event
 */
const handlePaymentIntentFailed = async (paymentIntent: Stripe.PaymentIntent): Promise<void> => {
  try {
    const transactionId = paymentIntent.metadata.transactionId;
    
    if (!transactionId) {
      console.error('No transaction ID in payment intent metadata');
      return;
    }

    // Update transaction status
    const transaction = await TransactionModel.findById(transactionId);
    
    if (!transaction) {
      console.error(`Transaction not found for ID: ${transactionId}`);
      return;
    }

    transaction.status = 'failed';
    transaction.paymentMethodDetails = {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      failedAt: new Date(),
      failureMessage: paymentIntent.last_payment_error?.message
    };
    
    await transaction.save();

    console.log(`Payment failed for transaction: ${transactionId}`);
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed event:', error);
  }
};

// apps/payment-service/src/routes/payment.routes.ts
import { Router } from 'express';
import * as PaymentController from '../controllers/payment.controller';

const router = Router();

// Payment endpoints
router.post('/payments/initiate', PaymentController.initiatePayment);
router.post('/payments/confirm', PaymentController.confirmPayment);
router.post('/payments/refund', PaymentController.processRefund);
router.get('/payments/transactions', PaymentController.getUserTransactions);
router.post('/payments/setup-stripe', PaymentController.setupStripeAccount);

export default router;

// apps/payment-service/src/routes/webhook.routes.ts
import { Router } from 'express';
import * as WebhookController from '../controllers/webhook.controller';

const router = Router();

// Webhook endpoint
router.post('/webhooks/stripe', WebhookController.handleStripeWebhook);

export default router;
