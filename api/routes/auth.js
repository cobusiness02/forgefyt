const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Mock user database (replace with real database in production)
const users = [
  {
    id: '1',
    email: 'coach@fitcoachpro.com',
    password: '$2a$10$8ZvL1YPxo1OLFkE3HKf8.OD9.Uo8M0u6LtVOPj3qmK5Gv7xN2QrCa', // coach123
    role: 'coach',
    name: 'John Coach',
    avatar: null,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    isActive: true,
    profile: {
      specialization: 'Weight Training',
      experience: '5 years',
      certifications: ['NASM', 'ACE']
    }
  },
  {
    id: '2',
    email: 'admin@fitcoachpro.com',
    password: '$2a$10$8ZvL1YPxo1OLFkE3HKf8.OD9.Uo8M0u6LtVOPj3qmK5Gv7xN2QrCa', // admin123
    role: 'admin',
    name: 'Admin User',
    avatar: null,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    isActive: true,
    profile: {
      department: 'Platform Management',
      permissions: ['all']
    }
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'fitcoach-pro-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied', 
      message: 'No token provided' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid token', 
        message: 'Token verification failed' 
      });
    }
    req.user = user;
    next();
  });
};

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, deviceInfo } = req.body;

    // Find user
    const user = users.find(u => u.email === email && u.isActive);
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data and token
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        profile: user.profile,
        lastLogin: user.lastLogin
      },
      expiresIn: JWT_EXPIRES_IN
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Login failed'
    });
  }
});

// Register endpoint (for creating new coaches)
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isLength({ min: 2 }),
  body('role').isIn(['coach', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, name, role = 'coach', profile = {} } = req.body;

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Email is already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: (users.length + 1).toString(),
      email,
      password: hashedPassword,
      name,
      role,
      avatar: null,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true,
      profile
    };

    users.push(newUser);

    // Generate token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatar: newUser.avatar,
        profile: newUser.profile,
        createdAt: newUser.createdAt
      },
      expiresIn: JWT_EXPIRES_IN
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Registration failed'
    });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId && u.isActive);
  
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: 'User account no longer exists'
    });
  }

  res.json({
    success: true,
    valid: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      profile: user.profile,
      lastLogin: user.lastLogin
    }
  });
});

// Logout endpoint
router.post('/logout', authenticateToken, (req, res) => {
  // In a real app, you might want to blacklist the token
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Refresh token endpoint
router.post('/refresh', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId && u.isActive);
  
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: 'User account no longer exists'
    });
  }

  // Generate new token
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({
    success: true,
    token,
    expiresIn: JWT_EXPIRES_IN
  });
});

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId && u.isActive);
  
  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      profile: user.profile,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }
  });
});

// Update user profile
router.put('/profile', [
  authenticateToken,
  body('name').optional().isLength({ min: 2 }),
  body('profile').optional().isObject()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const user = users.find(u => u.id === req.user.userId && u.isActive);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const { name, profile } = req.body;

    if (name) user.name = name;
    if (profile) user.profile = { ...user.profile, ...profile };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Profile update failed'
    });
  }
});

module.exports = { router, authenticateToken };