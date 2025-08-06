import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  balance: number;
  cardNumber: string;
  isActive: boolean;
  walletCards: {
    appleWallet?: {
      passTypeId: string;
      serialNumber: string;
      lastUpdated: Date;
    };
    googleWallet?: {
      objectId: string;
      lastUpdated: Date;
    };
  };
  metadata: {
    registrationSource: 'web' | 'pos' | 'admin';
    lastActivity: Date;
    totalTransactions: number;
    totalSpent: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  phone: {
    type: String,
    sparse: true,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Invalid phone format']
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  cardNumber: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v: string) {
        return !v || /^\d{12}$/.test(v);
      },
      message: 'Card number must be 12 digits'
    }
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  walletCards: {
    appleWallet: {
      passTypeId: String,
      serialNumber: String,
      lastUpdated: Date
    },
    googleWallet: {
      objectId: String,
      lastUpdated: Date
    }
  },
  metadata: {
    registrationSource: {
      type: String,
      enum: ['web', 'pos', 'admin'],
      required: true,
      default: 'web'
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    totalTransactions: {
      type: Number,
      default: 0,
      min: 0
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance

CustomerSchema.index({ 'metadata.lastActivity': -1 });
CustomerSchema.index({ createdAt: -1 });

// Virtual for full name
CustomerSchema.virtual('fullName').get(function() {
  return this.name;
});

// Pre-save middleware to generate card number
CustomerSchema.pre('save', async function(next) {
  if (this.isNew && !this.cardNumber) {
    this.cardNumber = await generateUniqueCardNumber();
  }
  next();
});

// Generate unique 12-digit card number
async function generateUniqueCardNumber(): Promise<string> {
  let cardNumber: string;
  let isUnique = false;
  
  while (!isUnique) {
    cardNumber = Math.random().toString().slice(2, 14).padStart(12, '0');
    const existing = await Customer.findOne({ cardNumber });
    if (!existing) {
      isUnique = true;
    }
  }
  
  return cardNumber!;
}

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
