const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Mock clients database
let clients = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1-555-0123',
    dateOfBirth: '1990-05-15',
    coachId: '1',
    avatar: null,
    status: 'active',
    joinDate: '2024-01-15T08:00:00Z',
    goals: ['Weight Loss', 'Strength Building'],
    fitnessLevel: 'intermediate',
    medicalNotes: 'No known allergies or conditions',
    emergencyContact: {
      name: 'John Johnson',
      phone: '+1-555-0124',
      relationship: 'Spouse'
    },
    measurements: {
      height: 165, // cm
      weight: 68, // kg
      bodyFat: 22, // %
      lastUpdated: '2024-10-15T08:00:00Z'
    },
    preferences: {
      workoutTime: 'morning',
      workoutDuration: 60,
      intensity: 'high',
      workoutTypes: ['strength', 'cardio']
    },
    progress: {
      sessionsCompleted: 45,
      totalHours: 67.5,
      averageRating: 4.8,
      lastSession: '2024-10-28T09:00:00Z'
    },
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Mike Wilson',
    email: 'mike.wilson@email.com',
    phone: '+1-555-0125',
    dateOfBirth: '1985-08-22',
    coachId: '1',
    avatar: null,
    status: 'active',
    joinDate: '2024-02-01T08:00:00Z',
    goals: ['Muscle Building', 'Athletic Performance'],
    fitnessLevel: 'advanced',
    medicalNotes: 'Previous knee injury - avoid high impact exercises',
    emergencyContact: {
      name: 'Lisa Wilson',
      phone: '+1-555-0126',
      relationship: 'Spouse'
    },
    measurements: {
      height: 180,
      weight: 85,
      bodyFat: 15,
      lastUpdated: '2024-10-20T08:00:00Z'
    },
    preferences: {
      workoutTime: 'evening',
      workoutDuration: 75,
      intensity: 'high',
      workoutTypes: ['strength', 'flexibility']
    },
    progress: {
      sessionsCompleted: 38,
      totalHours: 57,
      averageRating: 4.9,
      lastSession: '2024-10-29T18:00:00Z'
    },
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Emma Davis',
    email: 'emma.davis@email.com',
    phone: '+1-555-0127',
    dateOfBirth: '1992-12-10',
    coachId: '1',
    avatar: null,
    status: 'active',
    joinDate: '2024-03-10T08:00:00Z',
    goals: ['Weight Loss', 'Flexibility'],
    fitnessLevel: 'beginner',
    medicalNotes: 'Asthma - keep inhaler nearby',
    emergencyContact: {
      name: 'Robert Davis',
      phone: '+1-555-0128',
      relationship: 'Father'
    },
    measurements: {
      height: 160,
      weight: 72,
      bodyFat: 28,
      lastUpdated: '2024-10-10T08:00:00Z'
    },
    preferences: {
      workoutTime: 'afternoon',
      workoutDuration: 45,
      intensity: 'moderate',
      workoutTypes: ['cardio', 'flexibility']
    },
    progress: {
      sessionsCompleted: 28,
      totalHours: 35,
      averageRating: 4.6,
      lastSession: '2024-10-27T14:00:00Z'
    },
    createdAt: '2024-03-10T08:00:00Z',
    updatedAt: new Date().toISOString()
  }
];

// Get all clients for a coach
router.get('/', [
  authenticateToken,
  query('status').optional().isIn(['active', 'inactive', 'all']),
  query('search').optional().isLength({ min: 1 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], (req, res) => {
  try {
    const { status = 'all', search = '', page = 1, limit = 10 } = req.query;
    
    // Filter clients by coach (in real app, get coachId from user)
    let filteredClients = clients.filter(client => client.coachId === '1');
    
    // Filter by status
    if (status !== 'all') {
      filteredClients = filteredClients.filter(client => client.status === status);
    }
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredClients = filteredClients.filter(client =>
        client.name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.goals.some(goal => goal.toLowerCase().includes(searchLower))
      );
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedClients = filteredClients.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedClients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredClients.length,
        pages: Math.ceil(filteredClients.length / limit)
      }
    });

  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get a specific client
router.get('/:id', [
  authenticateToken,
  param('id').isString()
], (req, res) => {
  try {
    const { id } = req.params;
    
    const client = clients.find(c => c.id === id && c.coachId === '1');
    
    if (!client) {
      return res.status(404).json({
        error: 'Client not found'
      });
    }
    
    res.json({
      success: true,
      data: client
    });

  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Create a new client
router.post('/', [
  authenticateToken,
  body('name').isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('dateOfBirth').optional().isISO8601(),
  body('goals').optional().isArray(),
  body('fitnessLevel').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('medicalNotes').optional().isLength({ max: 1000 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if client with email already exists
    const existingClient = clients.find(c => c.email === req.body.email);
    if (existingClient) {
      return res.status(409).json({
        error: 'Client already exists',
        message: 'A client with this email already exists'
      });
    }

    const newClient = {
      id: (clients.length + 1).toString(),
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone || '',
      dateOfBirth: req.body.dateOfBirth || null,
      coachId: '1', // In real app, get from authenticated user
      avatar: null,
      status: 'active',
      joinDate: new Date().toISOString(),
      goals: req.body.goals || [],
      fitnessLevel: req.body.fitnessLevel || 'beginner',
      medicalNotes: req.body.medicalNotes || '',
      emergencyContact: req.body.emergencyContact || {},
      measurements: req.body.measurements || {},
      preferences: req.body.preferences || {
        workoutTime: 'morning',
        workoutDuration: 60,
        intensity: 'moderate',
        workoutTypes: ['cardio']
      },
      progress: {
        sessionsCompleted: 0,
        totalHours: 0,
        averageRating: 0,
        lastSession: null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    clients.push(newClient);

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: newClient
    });

  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update a client
router.put('/:id', [
  authenticateToken,
  param('id').isString(),
  body('name').optional().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('goals').optional().isArray(),
  body('fitnessLevel').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('medicalNotes').optional().isLength({ max: 1000 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const clientIndex = clients.findIndex(c => c.id === id && c.coachId === '1');
    
    if (clientIndex === -1) {
      return res.status(404).json({
        error: 'Client not found'
      });
    }

    // Check for email conflicts
    if (req.body.email) {
      const emailConflict = clients.find(c => c.email === req.body.email && c.id !== id);
      if (emailConflict) {
        return res.status(409).json({
          error: 'Email already in use',
          message: 'Another client is already using this email'
        });
      }
    }

    // Update client data
    const allowedFields = ['name', 'email', 'phone', 'dateOfBirth', 'goals', 'fitnessLevel', 'medicalNotes', 'emergencyContact', 'measurements', 'preferences'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        clients[clientIndex][field] = req.body[field];
      }
    });

    clients[clientIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: clients[clientIndex]
    });

  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Delete a client
router.delete('/:id', [
  authenticateToken,
  param('id').isString()
], (req, res) => {
  try {
    const { id } = req.params;
    const clientIndex = clients.findIndex(c => c.id === id && c.coachId === '1');
    
    if (clientIndex === -1) {
      return res.status(404).json({
        error: 'Client not found'
      });
    }

    // Soft delete - change status to inactive
    clients[clientIndex].status = 'inactive';
    clients[clientIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Client deactivated successfully'
    });

  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get client progress/statistics
router.get('/:id/progress', [
  authenticateToken,
  param('id').isString(),
  query('period').optional().isIn(['week', 'month', 'quarter', 'year'])
], (req, res) => {
  try {
    const { id } = req.params;
    const period = req.query.period || 'month';
    
    const client = clients.find(c => c.id === id && c.coachId === '1');
    
    if (!client) {
      return res.status(404).json({
        error: 'Client not found'
      });
    }

    // Mock progress data based on period
    const progressData = {
      week: {
        sessionsCompleted: 2,
        totalHours: 3,
        averageRating: 4.5,
        weightChange: -0.5,
        goalsProgress: 85
      },
      month: {
        sessionsCompleted: 8,
        totalHours: 12,
        averageRating: 4.7,
        weightChange: -2.1,
        goalsProgress: 78
      },
      quarter: {
        sessionsCompleted: 24,
        totalHours: 36,
        averageRating: 4.6,
        weightChange: -5.8,
        goalsProgress: 72
      },
      year: {
        sessionsCompleted: 96,
        totalHours: 144,
        averageRating: 4.7,
        weightChange: -12.3,
        goalsProgress: 89
      }
    };

    res.json({
      success: true,
      period,
      data: {
        client: {
          id: client.id,
          name: client.name,
          goals: client.goals
        },
        progress: progressData[period] || progressData.month,
        measurements: client.measurements,
        recentSessions: [
          {
            date: '2024-10-29T09:00:00Z',
            type: 'Strength Training',
            duration: 60,
            rating: 5,
            notes: 'Great form improvement'
          },
          {
            date: '2024-10-26T09:00:00Z',
            type: 'Cardio',
            duration: 45,
            rating: 4,
            notes: 'Increased endurance'
          }
        ]
      }
    });

  } catch (error) {
    console.error('Client progress error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;