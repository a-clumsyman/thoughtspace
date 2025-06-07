import express from 'express';
import { Thought } from '../models/Thought.js';
import { User } from '../models/User.js';
import { AuthRequest, rateLimitAuth } from '../middleware/auth.js';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const router = express.Router();

// Create DOMPurify instance for server-side
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

// Apply rate limiting to all routes
router.use(rateLimitAuth(200, 15 * 60 * 1000)); // 200 requests per 15 minutes

// Helper function to sanitize input
const sanitizeInput = (content: string): string => {
  if (!content || typeof content !== 'string') {
    throw new Error('Content must be a non-empty string');
  }
  
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    throw new Error('Content cannot be empty');
  }
  
  if (trimmed.length > 10000) {
    throw new Error('Content too long (max 10,000 characters)');
  }
  
  return purify.sanitize(trimmed);
};

// Get all thoughts for user with pagination
router.get('/', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 per page
    const category = req.query.category as string;
    const search = req.query.search as string;

    const query: any = { 
      userId: req.user!.id,
      isDeleted: false 
    };

    // Add category filter
    if (category && ['idea', 'feeling', 'memory', 'task', 'question', 'observation', 'reflection'].includes(category)) {
      query.category = category;
    }

    // Add text search
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    const skip = (page - 1) * limit;

    const [thoughts, total] = await Promise.all([
      Thought.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Thought.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: thoughts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {

    res.status(500).json({ error: 'Failed to fetch thoughts' });
  }
});

// Create new thought
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { content, category = 'idea' } = req.body;
    
    const sanitizedContent = sanitizeInput(content);

    // Validate category
    const validCategories = ['idea', 'feeling', 'memory', 'task', 'question', 'observation', 'reflection'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const thought = await Thought.create({
      userId: req.user!.id,
      content: sanitizedContent,
      category,
      timestamp: new Date(),
      tags: [],
      relevanceScore: 1,
      version: '1.0'
    });

    res.status(201).json({
      success: true,
      data: thought
    });

  } catch (error) {

    
    if (error instanceof Error) {
      if (error.message.includes('Content') || error.message.includes('empty')) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    res.status(500).json({ error: 'Failed to create thought' });
  }
});

// Update thought
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { content, category, tags } = req.body;

    const updateData: any = { updatedAt: new Date() };

    if (content !== undefined) {
      updateData.content = sanitizeInput(content);
    }

    if (category !== undefined) {
      const validCategories = ['idea', 'feeling', 'memory', 'task', 'question', 'observation', 'reflection'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
      }
      updateData.category = category;
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return res.status(400).json({ error: 'Tags must be an array' });
      }
      updateData.tags = tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
    }

    const thought = await Thought.findOneAndUpdate(
      { _id: id, userId: req.user!.id, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    );

    if (!thought) {
      return res.status(404).json({ error: 'Thought not found' });
    }

    res.json({
      success: true,
      data: thought
    });

  } catch (error) {

    
    if (error instanceof Error && error.message.includes('Content')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update thought' });
  }
});

// Soft delete thought
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const thought = await Thought.findOneAndUpdate(
      { _id: id, userId: req.user!.id, isDeleted: false },
      { isDeleted: true, updatedAt: new Date() },
      { new: true }
    );

    if (!thought) {
      return res.status(404).json({ error: 'Thought not found' });
    }

    res.json({
      success: true,
      message: 'Thought deleted successfully'
    });

  } catch (error) {
    console.error('Delete thought error:', error);
    res.status(500).json({ error: 'Failed to delete thought' });
  }
});

// Export user data
router.get('/export', async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user!.id);
    const thoughts = await Thought.find({ 
      userId: req.user!.id, 
      isDeleted: false 
    }).sort({ timestamp: -1 });

    const exportData = {
      user: {
        email: user?.email,
        name: user?.name,
        preferences: user?.preferences
      },
      thoughts: thoughts.map(t => ({
        id: t._id,
        content: t.content,
        category: t.category,
        timestamp: t.timestamp,
        tags: t.tags,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      })),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    res.json({
      success: true,
      data: exportData
    });

  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Import user data
router.post('/import', async (req: AuthRequest, res) => {
  try {
    const { thoughts: importThoughts } = req.body;

    if (!Array.isArray(importThoughts)) {
      return res.status(400).json({ error: 'Invalid import data format' });
    }

    const validThoughts = [];
    
    for (const thought of importThoughts) {
      try {
        const sanitizedContent = sanitizeInput(thought.content);
        validThoughts.push({
          userId: req.user!.id,
          content: sanitizedContent,
          category: thought.category || 'idea',
          timestamp: thought.timestamp ? new Date(thought.timestamp) : new Date(),
          tags: Array.isArray(thought.tags) ? thought.tags : [],
          relevanceScore: 1,
          version: '1.0'
        });
      } catch (e) {
        // Skip invalid thoughts
        continue;
      }
    }

    if (validThoughts.length === 0) {
      return res.status(400).json({ error: 'No valid thoughts to import' });
    }

    const imported = await Thought.insertMany(validThoughts);

    res.json({
      success: true,
      message: `Imported ${imported.length} thoughts`,
      imported: imported.length,
      skipped: importThoughts.length - imported.length
    });

  } catch (error) {
    console.error('Import data error:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Get user statistics
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const [totalThoughts, categoryStats, recentActivity] = await Promise.all([
      Thought.countDocuments({ userId: req.user!.id, isDeleted: false }),
      
      Thought.aggregate([
        { $match: { userId: req.user!.id, isDeleted: false } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      
      Thought.aggregate([
        { $match: { userId: req.user!.id, isDeleted: false } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
        { $limit: 30 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalThoughts,
        categoryBreakdown: categoryStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        recentActivity
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
