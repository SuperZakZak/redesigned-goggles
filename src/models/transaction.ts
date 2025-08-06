import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  type: 'credit' | 'debit';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  source: 'pos' | 'admin' | 'bonus' | 'refund' | 'purchase';
  metadata: {
    posTransactionId?: string;
    adminUserId?: string;
    orderId?: string;
    campaignId?: string;
    notes?: string;
  };
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
    validate: {
      validator: function(value: number) {
        return Number.isFinite(value) && value > 0;
      },
      message: 'Amount must be a positive number'
    }
  },
  balanceBefore: {
    type: Number,
    required: true,
    min: 0
  },
  balanceAfter: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  source: {
    type: String,
    enum: ['pos', 'admin', 'bonus', 'refund', 'purchase'],
    required: true
  },
  metadata: {
    posTransactionId: {
      type: String,
      trim: true
    },
    adminUserId: {
      type: String,
      trim: true
    },
    orderId: {
      type: String,
      trim: true
    },
    campaignId: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    required: true,
    default: 'pending'
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
TransactionSchema.index({ customerId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, createdAt: -1 });
TransactionSchema.index({ source: 1, createdAt: -1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ 'metadata.posTransactionId': 1 }, { sparse: true });

// Pre-save middleware to set processedAt when status changes to completed
TransactionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.processedAt) {
    this.processedAt = new Date();
  }
  next();
});

// Virtual for transaction display
TransactionSchema.virtual('displayAmount').get(function() {
  const sign = this.type === 'credit' ? '+' : '-';
  return `${sign}${this.amount.toFixed(2)}`;
});

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
