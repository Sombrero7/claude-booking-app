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