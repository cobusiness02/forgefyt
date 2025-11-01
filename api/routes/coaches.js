const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Mock coaches database
let coaches = [
  {
    id: '1',
    name: 'John Coach',
    email: 'coach@fitcoachpro.com',
    specialization: 'Weight Training',
    experience: '5 years',
    certifications: ['NASM', 'ACE'],
    avatar: null,
    bio: 'Experienced personal trainer specializing in strength training and body composition.',
    stats: {
      totalClients: 25,
      activeClients: 18,
      completedSessions: 450,
      rating: 4.8
    },
    schedule: {
      monday: { start: '06:00', end: '20:00', available: true },
      tuesday: { start: '06:00', end: '20:00', available: true },
      wednesday: { start: '06:00', end: '20:00', available: true },
      thursday: { start: '06:00', end: '20:00', available: true },
      friday: { start: '06:00', end: '18:00', available: true },
      saturday: { start: '08:00', end: '16:00', available: true },
      sunday: { start: '10:00', end: '14:00', available: false }
    },
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
    isActive: true
  }
];

// Get coach dashboard stats
router.get('/dashboard', authenticateToken, (req, res) => {
  try {
    const coach = coaches.find(c => c.email === req.user.email);
    
    if (!coach) {
      return res.status(404).json({
        error: 'Coach not found'
      });
    }

    // Mock recent activity
    const recentActivity = [
      {
        id: '1',
        type: 'session_completed',
        clientName: 'Sarah Johnson',
        description: 'Completed Upper Body Strength workout',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        duration: 60
      },
      {
        id: '2',
        type: 'client_registered',
        clientName: 'Mike Wilson',
        description: 'New client registered',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'session_scheduled',
        clientName: 'Emma Davis',
        description: 'Cardio session scheduled for tomorrow',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Mock today's schedule
    const todaysSchedule = [
      {
        id: '1',
        clientName: 'Sarah Johnson',
        workoutType: 'Strength Training',
        time: '09:00',
        duration: 60,
        status: 'confirmed'
      },
      {
        id: '2',
        clientName: 'Tom Brown',
        workoutType: 'Cardio',
        time: '11:00',
        duration: 45,
        status: 'confirmed'
      },
      {
        id: '3',
        clientName: 'Lisa Garcia',
        workoutType: 'Flexibility',
        time: '14:00',
        duration: 30,
        status: 'pending'
      }
    ];

    res.json({
      success: true,
      data: {
        coach: {
          id: coach.id,
          name: coach.name,
          avatar: coach.avatar,
          specialization: coach.specialization
        },
        stats: coach.stats,
        recentActivity,
        todaysSchedule,
        weeklyProgress: {
          sessionsCompleted: 12,
          sessionsScheduled: 15,
          newClients: 2,
          revenue: 1200
        }
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to load dashboard'
    });
  }
});

// Get coach profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const coach = coaches.find(c => c.email === req.user.email);
    
    if (!coach) {
      return res.status(404).json({
        error: 'Coach not found'
      });
    }

    res.json({
      success: true,
      data: coach
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update coach profile
router.put('/profile', [
  authenticateToken,
  body('name').optional().isLength({ min: 2 }),
  body('bio').optional().isLength({ max: 500 }),
  body('specialization').optional().isLength({ min: 2 }),
  body('experience').optional().isLength({ min: 1 }),
  body('certifications').optional().isArray()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const coachIndex = coaches.findIndex(c => c.email === req.user.email);
    
    if (coachIndex === -1) {
      return res.status(404).json({
        error: 'Coach not found'
      });
    }

    const { name, bio, specialization, experience, certifications } = req.body;

    // Update coach data
    if (name) coaches[coachIndex].name = name;
    if (bio) coaches[coachIndex].bio = bio;
    if (specialization) coaches[coachIndex].specialization = specialization;
    if (experience) coaches[coachIndex].experience = experience;
    if (certifications) coaches[coachIndex].certifications = certifications;
    
    coaches[coachIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: coaches[coachIndex]
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update coach schedule
router.put('/schedule', [
  authenticateToken,
  body('schedule').isObject()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const coachIndex = coaches.findIndex(c => c.email === req.user.email);
    
    if (coachIndex === -1) {
      return res.status(404).json({
        error: 'Coach not found'
      });
    }

    const { schedule } = req.body;

    // Validate schedule format
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const isValidSchedule = Object.keys(schedule).every(day => 
      daysOfWeek.includes(day.toLowerCase()) &&
      schedule[day].hasOwnProperty('start') &&
      schedule[day].hasOwnProperty('end') &&
      schedule[day].hasOwnProperty('available')
    );

    if (!isValidSchedule) {
      return res.status(400).json({
        error: 'Invalid schedule format'
      });
    }

    coaches[coachIndex].schedule = schedule;
    coaches[coachIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: {
        schedule: coaches[coachIndex].schedule
      }
    });

  } catch (error) {
    console.error('Schedule update error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get coach's clients overview
router.get('/clients-overview', authenticateToken, (req, res) => {
  try {
    // Mock client data
    const clientsOverview = {
      totalClients: 25,
      activeClients: 18,
      newThisMonth: 3,
      retentionRate: 85,
      averageSessionsPerWeek: 2.5,
      topPerformers: [
        { name: 'Sarah Johnson', sessionsCompleted: 45, progressScore: 92 },
        { name: 'Mike Wilson', sessionsCompleted: 38, progressScore: 88 },
        { name: 'Emma Davis', sessionsCompleted: 42, progressScore: 85 }
      ],
      recentActivity: [
        { clientName: 'Tom Brown', action: 'Completed workout', timestamp: new Date().toISOString() },
        { clientName: 'Lisa Garcia', action: 'Scheduled session', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
      ]
    };

    res.json({
      success: true,
      data: clientsOverview
    });

  } catch (error) {
    console.error('Clients overview error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get coach statistics
router.get('/stats', [
  authenticateToken,
  query('period').optional().isIn(['week', 'month', 'quarter', 'year'])
], (req, res) => {
  try {
    const period = req.query.period || 'month';
    
    // Mock statistics based on period
    const stats = {
      week: {
        sessionsCompleted: 12,
        newClients: 1,
        revenue: 840,
        averageRating: 4.8,
        totalWorkoutHours: 15
      },
      month: {
        sessionsCompleted: 52,
        newClients: 3,
        revenue: 3640,
        averageRating: 4.7,
        totalWorkoutHours: 65
      },
      quarter: {
        sessionsCompleted: 156,
        newClients: 8,
        revenue: 10920,
        averageRating: 4.8,
        totalWorkoutHours: 195
      },
      year: {
        sessionsCompleted: 624,
        newClients: 25,
        revenue: 43680,
        averageRating: 4.8,
        totalWorkoutHours: 780
      }
    };

    res.json({
      success: true,
      period,
      data: stats[period] || stats.month
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;