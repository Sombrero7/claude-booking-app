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