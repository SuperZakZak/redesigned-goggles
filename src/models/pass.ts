import { Schema, model, Types, Document } from 'mongoose';

export interface IPass extends Document {
  serialNumber: string;
  customerId: Types.ObjectId;
  deviceLibraryIdentifiers: string[]; // registered devices for push notifications
  updatedAt: Date;
}

const passSchema = new Schema<IPass>(
  {
    serialNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, required: true, ref: 'Customer', index: true },
    deviceLibraryIdentifiers: { type: [String], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Pass = model<IPass>('Pass', passSchema);
