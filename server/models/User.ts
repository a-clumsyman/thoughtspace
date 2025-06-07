import mongoose from 'mongoose';

export interface IUser {
  _id: string;
  email: string;
  name: string;
  googleId: string;
  avatar?: string;
  apiKey?: string; // User's own OpenAI API key
  preferences: {
    aiEnabled: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  googleId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  avatar: String,
  apiKey: String, // Encrypted user's OpenAI API key
  preferences: {
    aiEnabled: { type: Boolean, default: false },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
userSchema.index({ email: 1, googleId: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
