// packages/database/package.json
{
  "name": "@booking-platform/database",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "mongoose": "^7.3.0"
  },
  "devDependencies": {
    "@booking-platform/typescript-config": "*",
    "@types/node": "^18.16.16",
    "typescript": "^5.1.3"
  }
}

// packages/database/tsconfig.json
{
  "extends": "@booking-platform/typescript-config/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}

// packages/database/src/index.ts
export * from './connection';
export * from './models';

// packages/database/src/connection.ts
import mongoose from 'mongoose';

let isConnected = false;

export const connectToDatabase = async (uri: string): Promise<void> => {
  if (isConnected) {
    console.log('=> using existing database connection');
    return;
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log('=> using new database connection');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

export const disconnectFromDatabase = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('=> disconnected from database');
  } catch (error) {
    console.error('Database disconnection error:', error);
    throw error;
  }
};

// packages/database/src/models/index.ts
export * from './user.model';
export * from './space.model';
export * from './event.model';
export * from './booking.model';
export * from './request.model';
export * from './transaction.model';

// packages/database/src/models/user.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  firebaseId: string;
  email: string;
  role: 'provider' | 'customer' | 'admin';
  profile: {
    name: string;
    bio?: string;
    avatar?: string;
    phone?: string;
  };
  stripe?: {
    customerId?: string;
    accountId?: string;
  };
  followers: string[];
  following: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    role: { 
      type: String, 
      required: true, 
      enum: ['provider', 'customer', 'admin'],
      default: 'customer'
    },
    profile: {
      name: { type: String, required: true },
      bio: String,
      avatar: String,
      phone: String
    },
    stripe: {
      customerId: String,
      accountId: String
    },
    followers: [{ type: String }],
    following: [{ type: String }]
  },
  { timestamps: true }
);

// Only create the model if it doesn't exist (for hot reloading)
export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// packages/database/src/models/space.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ISpace extends Document {
  ownerId: string;
  title: string;
  description: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  capacity: number;
  amenities: string[];
  pricing: {
    hourlyRate: number;
    currency: string;
    minimumHours?: number;
    cleaningFee?: number;
  };
  availability: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
  photos: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SpaceSchema = new Schema<ISpace>(
  {
    ownerId: { type: String, required: true, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    capacity: { type: Number, required: true },
    amenities: [{ type: String }],
    pricing: {
      hourlyRate: { type: Number, required: true },
      currency: { type: String, required: true, default: 'USD' },
      minimumHours: Number,
      cleaningFee: Number
    },
    availability: [{
      dayOfWeek: { 
        type: String, 
        required: true,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true }
    }],
    photos: [{ type: String }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const SpaceModel = mongoose.models.Space || mongoose.model<ISpace>('Space', SpaceSchema);

// packages/database/src/models/event.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  leadCreatorId: string;
  collaborators: {
    creatorId: string;
    role: string;
    paymentType: 'percentage' | 'flat';
    paymentValue: number;
  }[];
  eventType: 'single' | 'recurring';
  schedule: {
    startDate: Date;
    endDate?: Date;
    daysOfWeek?: string[];
    timeSlot: {
      start: string;
      end: string;
    };
  };
  spaceId: string;
  pricePerStudent: number;
  currency: string;
  maxCapacity: number;
  attendees: string[];
  isPublic: boolean;
  isActive: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    leadCreatorId: { type: String, required: true, ref: 'User' },
    collaborators: [{
      creatorId: { type: String, required: true, ref: 'User' },
      role: { type: String, default: 'co-host' },
      paymentType: { 
        type: String, 
        required: true, 
        enum: ['percentage', 'flat'] 
      },
      paymentValue: { type: Number, required: true }
    }],
    eventType: {
      type: String,
      required: true,
      enum: ['single', 'recurring'],
      default: 'single'
    },
    schedule: {
      startDate: { type: Date, required: true },
      endDate: Date,
      daysOfWeek: [{
        type: String,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      }],
      timeSlot: {
        start: { type: String, required: true },
        end: { type: String, required: true }
      }
    },
    spaceId: { type: String, required: true, ref: 'Space' },
    pricePerStudent: { type: Number, required: true },
    currency: { type: String, required: true, default: 'USD' },
    maxCapacity: { type: Number, required: true },
    attendees: [{ type: String, ref: 'User' }],
    isPublic: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

export const EventModel = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

// packages/database/src/models/booking.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  userId: string;
  eventId: string;
  eventDate: Date;
  status: 'confirmed' | 'pending' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paymentId: string;
  attendeesCount: number;
  totalAmount: number;
  specialRequirements?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    userId: { type: String, required: true, ref: 'User' },
    eventId: { type: String, required: true, ref: 'Event' },
    eventDate: { type: Date, required: true },
    status: { 
      type: String, 
      required: true, 
      enum: ['confirmed', 'pending', 'cancelled'],
      default: 'pending'
    },
    paymentStatus: { 
      type: String, 
      required: true, 
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid'
    },
    paymentId: String,
    attendeesCount: { type: Number, required: true, default: 1 },
    totalAmount: { type: Number, required: true },
    specialRequirements: String
  },
  { timestamps: true }
);

export const BookingModel = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

// packages/database/src/models/request.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IRequest extends Document {
  userId: string;
  creatorId: string;
  spaceId: string;
  title: string;
  description: string;
  desiredDateTime: {
    start: Date;
    end: Date;
  };
  attendeesCount: number;
  status: 'pending' | 'accepted' | 'rejected';
  venueApproval: 'pending' | 'accepted' | 'rejected';
  creatorApproval: 'pending' | 'accepted' | 'rejected';
  priceBreakdown: {
    venueFee: number;
    creatorFee: number;
    platformFee: number;
    totalCost: number;
  };
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paymentId?: string;
  specialRequirements?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema = new Schema<IRequest>(
  {
    userId: { type: String, required: true, ref: 'User' },
    creatorId: { type: String, required: true, ref: 'User' },
    spaceId: { type: String, required: true, ref: 'Space' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    desiredDateTime: {
      start: { type: Date, required: true },
      end: { type: Date, required: true }
    },
    attendeesCount: { type: Number, required: true, default: 1 },
    status: { 
      type: String, 
      required: true, 
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    venueApproval: { 
      type: String, 
      required: true, 
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    creatorApproval: { 
      type: String, 
      required: true, 
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    priceBreakdown: {
      venueFee: { type: Number, required: true },
      creatorFee: { type: Number, required: true },
      platformFee: { type: Number, required: true },
      totalCost: { type: Number, required: true }
    },
    paymentStatus: { 
      type: String, 
      required: true, 
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid'
    },
    paymentId: String,
    specialRequirements: String
  },
  { timestamps: true }
);

export const RequestModel = mongoose.models.Request || mongoose.model<IRequest>('Request', RequestSchema);

// packages/database/src/models/transaction.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  bookingId?: string;
  requestId?: string;
  transactionType: 'booking' | 'request' | 'subscription';
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'bitcoin';
  paymentMethodDetails?: any;
  collaboratorSplits?: {
    creatorId: string;
    amount: number;
  }[];
  platformFee: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  bitcoinTransactionId?: string;
  refundId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    bookingId: { type: String, ref: 'Booking' },
    requestId: { type: String, ref: 'Request' },
    transactionType: {
      type: String,
      required: true,
      enum: ['booking', 'request', 'subscription']
    },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'USD' },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['stripe', 'bitcoin']
    },
    paymentMethodDetails: Schema.Types.Mixed,
    collaboratorSplits: [{
      creatorId: { type: String, required: true, ref: 'User' },
      amount: { type: Number, required: true }
    }],
    platformFee: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    stripePaymentIntentId: String,
    bitcoinTransactionId: String,
    refundId: String
  },
  { timestamps: true }
);

export const TransactionModel = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
