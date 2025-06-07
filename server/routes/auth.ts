import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Google OAuth login
router.post('/google', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for tokens
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    // Get user info from Google
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
    );
    
    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info from Google');
    }

    const googleUser = await userInfoResponse.json();

    // Find or create user
    let user = await User.findOne({ googleId: googleUser.id });
    
    if (!user) {
      user = await User.create({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.id,
        avatar: googleUser.picture,
        preferences: {
          aiEnabled: false,
          theme: 'system'
        }
      });
    } else {
      // Update user info
      user.name = googleUser.name;
      user.avatar = googleUser.picture;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Verify token
router.get('/verify', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { aiEnabled, theme, apiKey } = req.body;
    
    const user = await User.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update preferences
    if (typeof aiEnabled === 'boolean') {
      user.preferences.aiEnabled = aiEnabled;
    }
    
    if (theme && ['light', 'dark', 'system'].includes(theme)) {
      user.preferences.theme = theme;
    }

    // Store user's OpenAI API key (encrypted in production)
    if (apiKey !== undefined) {
      user.apiKey = apiKey || undefined;
    }

    await user.save();

    res.json({
      success: true,
      preferences: user.preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Sign out (client-side handles token removal)
router.post('/signout', (req, res) => {
  res.json({ success: true, message: 'Signed out successfully' });
});

export default router;
