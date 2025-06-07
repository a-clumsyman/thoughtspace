import mongoose from 'mongoose';

export interface IThought {
  _id: string;
  userId: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  category?: string;
  tags: string[];
  clusterId?: string;
  relevanceScore: number;
  version: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const thoughtSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  content: { 
    type: String, 
    required: true, 
    maxlength: 10000,
    validate: {
      validator: function(v: string) {
        return v && v.trim().length > 0;
      },
      message: 'Content cannot be empty'
    }
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  category: {
    type: String,
    enum: ['idea', 'feeling', 'memory', 'task', 'question', 'observation', 'reflection'],
    default: 'idea'
  },
  tags: [{ type: String, maxlength: 50 }],
  clusterId: String,
  relevanceScore: { 
    type: Number, 
    default: 1,
    min: 0,
    max: 1 
  },
  version: { 
    type: String, 
    default: '1.0' 
  },
  isDeleted: { 
    type: Boolean, 
    default: false,
    index: true 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
thoughtSchema.index({ userId: 1, timestamp: -1 });
thoughtSchema.index({ userId: 1, isDeleted: 1, timestamp: -1 });
thoughtSchema.index({ userId: 1, category: 1, timestamp: -1 });
thoughtSchema.index({ userId: 1, content: 'text' }); // Text search

// Pre-save middleware for validation
thoughtSchema.pre('save', function(next) {
  // Sanitize content
  if (this.content) {
    this.content = this.content.trim();
  }
  next();
});

export const Thought = mongoose.model<IThought>('Thought', thoughtSchema);
