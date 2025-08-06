import mongoose, { Schema, Document } from 'mongoose';
import { ObjectId } from 'mongodb';

/**
 * Interface for WalletDevice document
 */
export interface IWalletDevice extends Document {
  customerId: ObjectId;
  serialNumber: string;
  deviceLibraryIdentifier: string;
  pushToken: string;
  passTypeIdentifier: string;
  registeredAt: Date;
  lastUpdated: Date;
  isActive: boolean;
}

/**
 * WalletDevice schema for storing Apple Wallet device registrations
 */
const walletDeviceSchema = new Schema<IWalletDevice>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceLibraryIdentifier: {
      type: String,
      required: true,
      index: true,
    },
    pushToken: {
      type: String,
      required: true,
    },
    passTypeIdentifier: {
      type: String,
      required: true,
      index: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'wallet_devices',
  }
);

// Compound indexes for efficient queries
walletDeviceSchema.index({ 
  deviceLibraryIdentifier: 1, 
  passTypeIdentifier: 1 
});

walletDeviceSchema.index({ 
  serialNumber: 1, 
  passTypeIdentifier: 1 
});

walletDeviceSchema.index({ 
  customerId: 1, 
  isActive: 1 
});

// Update lastUpdated on save
walletDeviceSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  next();
});

/**
 * WalletDevice model
 */
export const WalletDevice = mongoose.model<IWalletDevice>(
  'WalletDevice',
  walletDeviceSchema
);

export default WalletDevice;
