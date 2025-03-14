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

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
