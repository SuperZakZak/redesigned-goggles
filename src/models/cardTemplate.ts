import mongoose, { Schema, Document } from 'mongoose';

export interface ICardTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  design: {
    backgroundColor: string;
    foregroundColor: string;
    labelColor: string;
    logoUrl?: string;
    stripImage?: string;
    thumbnailImage?: string;
    iconImage?: string;
  };
  content: {
    organizationName: string;
    description: string;
    logoText?: string;
    fields: {
      balance: {
        label: string;
        position: 'primary' | 'secondary' | 'auxiliary' | 'back';
      };
      cardNumber: {
        label: string;
        position: 'primary' | 'secondary' | 'auxiliary' | 'back';
      };
      customerName: {
        label: string;
        position: 'primary' | 'secondary' | 'auxiliary' | 'back';
      };
    };
    backFields?: Array<{
      key: string;
      label: string;
      value: string;
    }>;
  };
  appleWallet: {
    passTypeIdentifier: string;
    teamIdentifier: string;
    webServiceURL?: string;
    authenticationToken?: string;
  };
  googleWallet: {
    issuerId: string;
    classId: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CardTemplateSchema = new Schema<ICardTemplate>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 255
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  isDefault: {
    type: Boolean,
    required: true,
    default: false
  },
  design: {
    backgroundColor: {
      type: String,
      required: true,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format']
    },
    foregroundColor: {
      type: String,
      required: true,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format']
    },
    labelColor: {
      type: String,
      required: true,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format']
    },
    logoUrl: {
      type: String,
      trim: true
    },
    stripImage: {
      type: String,
      trim: true
    },
    thumbnailImage: {
      type: String,
      trim: true
    },
    iconImage: {
      type: String,
      trim: true
    }
  },
  content: {
    organizationName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    logoText: {
      type: String,
      trim: true,
      maxlength: 20
    },
    fields: {
      balance: {
        label: {
          type: String,
          required: true,
          default: 'Balance'
        },
        position: {
          type: String,
          enum: ['primary', 'secondary', 'auxiliary', 'back'],
          required: true,
          default: 'primary'
        }
      },
      cardNumber: {
        label: {
          type: String,
          required: true,
          default: 'Card Number'
        },
        position: {
          type: String,
          enum: ['primary', 'secondary', 'auxiliary', 'back'],
          required: true,
          default: 'secondary'
        }
      },
      customerName: {
        label: {
          type: String,
          required: true,
          default: 'Member'
        },
        position: {
          type: String,
          enum: ['primary', 'secondary', 'auxiliary', 'back'],
          required: true,
          default: 'auxiliary'
        }
      }
    },
    backFields: [{
      key: {
        type: String,
        required: true,
        trim: true
      },
      label: {
        type: String,
        required: true,
        trim: true
      },
      value: {
        type: String,
        required: true,
        trim: true
      }
    }]
  },
  appleWallet: {
    passTypeIdentifier: {
      type: String,
      required: true,
      trim: true
    },
    teamIdentifier: {
      type: String,
      required: true,
      trim: true
    },
    webServiceURL: {
      type: String,
      trim: true
    },
    authenticationToken: {
      type: String,
      trim: true
    }
  },
  googleWallet: {
    issuerId: {
      type: String,
      required: true,
      trim: true
    },
    classId: {
      type: String,
      required: true,
      trim: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
CardTemplateSchema.index({ isActive: 1, isDefault: 1 });
CardTemplateSchema.index({ name: 1 });

// Ensure only one default template
CardTemplateSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await CardTemplate.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

export const CardTemplate = mongoose.model<ICardTemplate>('CardTemplate', CardTemplateSchema);
