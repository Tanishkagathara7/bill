import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_for_dev_only', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (for Owners), Private (for Staff created by Owners)
export const registerUser = async (req, res) => {
  try {
    const { email, password, name, role, ownerId } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    let organizationId, actualOwnerId;

    if (role === 'Owner' || !role) {
      // Find max organizationId and increment
      const maxOrgUser = await User.findOne({}, { organizationId: 1 }).sort({ organizationId: -1 });
      organizationId = maxOrgUser && maxOrgUser.organizationId ? maxOrgUser.organizationId + 1 : 1;
      actualOwnerId = null;
    } else {
      // It's a Staff member, must be created by an Owner
      if (!ownerId) {
        return res.status(400).json({ success: false, message: 'Staff members must be created by an Owner' });
      }
      
      const owner = await User.findById(ownerId);
      if (!owner || owner.role !== 'Owner') {
        return res.status(400).json({ success: false, message: 'Invalid owner specified' });
      }
      
      organizationId = owner.organizationId;
      actualOwnerId = ownerId;
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      role: role || 'Owner',
      organizationId,
      ownerId: actualOwnerId
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data received' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        ownerId: user.ownerId,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    // req.user is set in authMiddleware
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
