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
