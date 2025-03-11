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
