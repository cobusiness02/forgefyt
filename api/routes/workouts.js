const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Mock workouts database
let workouts = [
  {
    id: '1',
    coachId: '1',
    clientId: '1',
    clientName: 'Sarah Johnson',
    title: 'Upper Body Strength',
    type: 'strength',
    date: '2024-11-01',
    time: '09:00',
    duration: 60,
    status: 'scheduled',
    location: 'Gym Floor A',
    exercises: [
      {
        name: 'Bench Press',
        sets: 3,
        reps: 10,
        weight: 60,
        restTime: 90
      },
      {
        name: 'Rows',
        sets: 3,
        reps: 12,
        weight: 50,
        restTime: 60
      },
      {
        name: 'Shoulder Press',
        sets: 3,
        reps: 8,
        weight: 30,
        restTime: 90
      }
    ],
    notes: 'Focus on form and controlled movements',
    completedAt: null,
    rating: null,
    feedback: null,
    createdAt: '2024-10-28T08:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    coachId: '1',
    clientId: '2',
    clientName: 'Mike Wilson',
    title: 'Leg Day Power',
    type: 'strength',
    date: '2024-11-01',
    time: '11:00',
    duration: 75,
    status: 'scheduled',
    location: 'Gym Floor B',
    exercises: [
      {
        name: 'Squats',
        sets: 4,
        reps: 8,
        weight: 100,
        restTime: 120
      },
      {
        name: 'Deadlifts',
        sets: 3,
        reps: 6,
        weight: 120,
        restTime: 180
      },
      {
        name: 'Leg Press',
        sets: 3,
        reps: 12,
        weight: 200,
        restTime: 90
      }
    ],
    notes: 'Watch knee positioning during squats',
    completedAt: null,
    rating: null,
    feedback: null,
    createdAt: '2024-10-29T08:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    coachId: '1',
    clientId: '3',
    clientName: 'Emma Davis',
    title: 'Cardio & Flexibility',
    type: 'cardio',
    date: '2024-11-01',
    time: '14:00',
    duration: 45,
    status: 'scheduled',
    location: 'Cardio Area',
    exercises: [
      {
        name: 'Treadmill',
        duration: 20,
        intensity: 'moderate',
        notes: 'Keep heart rate at 140-150 bpm'
      },
      {
        name: 'Stretching Routine',
        duration: 15,
        intensity: 'low',
        notes: 'Focus on hamstrings and hip flexors'
      },
      {
        name: 'Cool Down Walk',
        duration: 10,
        intensity: 'low',
        notes: 'Gradual heart rate reduction'
      }
    ],
    notes: 'Remember to keep inhaler nearby',
    completedAt: null,
    rating: null,
    feedback: null,
    createdAt: '2024-10-30T08:00:00Z',
    updatedAt: new Date().toISOString()
  }
];

// Get workouts (with filtering and pagination)
router.get('/', [
  authenticateToken,
  query('date').optional().isISO8601(),
  query('clientId').optional().isString(),
  query('type').optional().isIn(['strength', 'cardio', 'flexibility', 'sports', 'rehabilitation']),
  query('status').optional().isIn(['scheduled', 'completed', 'cancelled', 'missed']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], (req, res) => {
  try {
    const { date, clientId, type, status, page = 1, limit = 10 } = req.query;
    
    // Filter workouts by coach
    let filteredWorkouts = workouts.filter(workout => workout.coachId === '1');
    
    // Apply filters
    if (date) {
      filteredWorkouts = filteredWorkouts.filter(workout => workout.date === date);
    }
    
    if (clientId) {
      filteredWorkouts = filteredWorkouts.filter(workout => workout.clientId === clientId);
    }
    
    if (type) {
      filteredWorkouts = filteredWorkouts.filter(workout => workout.type === type);
    }
    
    if (status) {
      filteredWorkouts = filteredWorkouts.filter(workout => workout.status === status);
    }
    
    // Sort by date and time
    filteredWorkouts.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`);
      const dateTimeB = new Date(`${b.date}T${b.time}`);
      return dateTimeA - dateTimeB;
    });
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedWorkouts = filteredWorkouts.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedWorkouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredWorkouts.length,
        pages: Math.ceil(filteredWorkouts.length / limit)
      }
    });

  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get calendar view of workouts
router.get('/calendar', [
  authenticateToken,
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2030 })
], (req, res) => {
  try {
    const currentDate = new Date();
    const month = parseInt(req.query.month) || (currentDate.getMonth() + 1);
    const year = parseInt(req.query.year) || currentDate.getFullYear();
    
    // Filter workouts for the specified month/year
    const calendarWorkouts = workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate.getMonth() + 1 === month && 
             workoutDate.getFullYear() === year &&
             workout.coachId === '1';
    });
    
    // Group workouts by date
    const workoutsByDate = {};
    calendarWorkouts.forEach(workout => {
      if (!workoutsByDate[workout.date]) {
        workoutsByDate[workout.date] = [];
      }
      workoutsByDate[workout.date].push({
        id: workout.id,
        title: workout.title,
        clientName: workout.clientName,
        time: workout.time,
        duration: workout.duration,
        type: workout.type,
        status: workout.status
      });
    });
    
    res.json({
      success: true,
      month,
      year,
      data: workoutsByDate,
      summary: {
        totalWorkouts: calendarWorkouts.length,
        byType: {
          strength: calendarWorkouts.filter(w => w.type === 'strength').length,
          cardio: calendarWorkouts.filter(w => w.type === 'cardio').length,
          flexibility: calendarWorkouts.filter(w => w.type === 'flexibility').length
        },
        byStatus: {
          scheduled: calendarWorkouts.filter(w => w.status === 'scheduled').length,
          completed: calendarWorkouts.filter(w => w.status === 'completed').length,
          cancelled: calendarWorkouts.filter(w => w.status === 'cancelled').length
        }
      }
    });

  } catch (error) {
    console.error('Calendar error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get a specific workout
router.get('/:id', [
  authenticateToken,
  param('id').isString()
], (req, res) => {
  try {
    const { id } = req.params;
    
    const workout = workouts.find(w => w.id === id && w.coachId === '1');
    
    if (!workout) {
      return res.status(404).json({
        error: 'Workout not found'
      });
    }
    
    res.json({
      success: true,
      data: workout
    });

  } catch (error) {
    console.error('Get workout error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Create a new workout
router.post('/', [
  authenticateToken,
  body('clientId').isString(),
  body('title').isLength({ min: 2 }),
  body('type').isIn(['strength', 'cardio', 'flexibility', 'sports', 'rehabilitation']),
  body('date').isISO8601(),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('duration').isInt({ min: 15, max: 180 }),
  body('exercises').optional().isArray()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check for scheduling conflicts
    const conflictingWorkout = workouts.find(w => 
      w.coachId === '1' &&
      w.date === req.body.date &&
      w.time === req.body.time &&
      w.status !== 'cancelled'
    );

    if (conflictingWorkout) {
      return res.status(409).json({
        error: 'Scheduling conflict',
        message: 'A workout is already scheduled at this time'
      });
    }

    const newWorkout = {
      id: (workouts.length + 1).toString(),
      coachId: '1',
      clientId: req.body.clientId,
      clientName: req.body.clientName || 'Unknown Client',
      title: req.body.title,
      type: req.body.type,
      date: req.body.date,
      time: req.body.time,
      duration: req.body.duration,
      status: 'scheduled',
      location: req.body.location || '',
      exercises: req.body.exercises || [],
      notes: req.body.notes || '',
      completedAt: null,
      rating: null,
      feedback: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    workouts.push(newWorkout);

    res.status(201).json({
      success: true,
      message: 'Workout created successfully',
      data: newWorkout
    });

  } catch (error) {
    console.error('Create workout error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update a workout
router.put('/:id', [
  authenticateToken,
  param('id').isString(),
  body('title').optional().isLength({ min: 2 }),
  body('type').optional().isIn(['strength', 'cardio', 'flexibility', 'sports', 'rehabilitation']),
  body('date').optional().isISO8601(),
  body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('duration').optional().isInt({ min: 15, max: 180 }),
  body('status').optional().isIn(['scheduled', 'completed', 'cancelled', 'missed'])
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
    const workoutIndex = workouts.findIndex(w => w.id === id && w.coachId === '1');
    
    if (workoutIndex === -1) {
      return res.status(404).json({
        error: 'Workout not found'
      });
    }

    // Check for scheduling conflicts if time/date changed
    if (req.body.date || req.body.time) {
      const newDate = req.body.date || workouts[workoutIndex].date;
      const newTime = req.body.time || workouts[workoutIndex].time;
      
      const conflictingWorkout = workouts.find(w => 
        w.coachId === '1' &&
        w.id !== id &&
        w.date === newDate &&
        w.time === newTime &&
        w.status !== 'cancelled'
      );

      if (conflictingWorkout) {
        return res.status(409).json({
          error: 'Scheduling conflict',
          message: 'A workout is already scheduled at this time'
        });
      }
    }

    // Update workout data
    const allowedFields = ['title', 'type', 'date', 'time', 'duration', 'status', 'location', 'exercises', 'notes', 'rating', 'feedback'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        workouts[workoutIndex][field] = req.body[field];
      }
    });

    // Set completion time if status changed to completed
    if (req.body.status === 'completed' && workouts[workoutIndex].status !== 'completed') {
      workouts[workoutIndex].completedAt = new Date().toISOString();
    }

    workouts[workoutIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Workout updated successfully',
      data: workouts[workoutIndex]
    });

  } catch (error) {
    console.error('Update workout error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Delete a workout
router.delete('/:id', [
  authenticateToken,
  param('id').isString()
], (req, res) => {
  try {
    const { id } = req.params;
    const workoutIndex = workouts.findIndex(w => w.id === id && w.coachId === '1');
    
    if (workoutIndex === -1) {
      return res.status(404).json({
        error: 'Workout not found'
      });
    }

    // Soft delete - change status to cancelled
    workouts[workoutIndex].status = 'cancelled';
    workouts[workoutIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Workout cancelled successfully'
    });

  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get workout templates
router.get('/templates/list', authenticateToken, (req, res) => {
  try {
    const templates = [
      {
        id: '1',
        name: 'Upper Body Strength',
        type: 'strength',
        duration: 60,
        exercises: [
          { name: 'Bench Press', sets: 3, reps: 10, restTime: 90 },
          { name: 'Rows', sets: 3, reps: 12, restTime: 60 },
          { name: 'Shoulder Press', sets: 3, reps: 8, restTime: 90 },
          { name: 'Pull-ups', sets: 3, reps: 6, restTime: 120 }
        ]
      },
      {
        id: '2',
        name: 'HIIT Cardio',
        type: 'cardio',
        duration: 30,
        exercises: [
          { name: 'Burpees', duration: 30, restTime: 30 },
          { name: 'Mountain Climbers', duration: 30, restTime: 30 },
          { name: 'Jump Squats', duration: 30, restTime: 30 },
          { name: 'High Knees', duration: 30, restTime: 30 }
        ]
      },
      {
        id: '3',
        name: 'Flexibility & Mobility',
        type: 'flexibility',
        duration: 45,
        exercises: [
          { name: 'Dynamic Warm-up', duration: 10 },
          { name: 'Hip Flexor Stretch', duration: 60, sets: 2 },
          { name: 'Hamstring Stretch', duration: 60, sets: 2 },
          { name: 'Shoulder Mobility', duration: 60, sets: 2 }
        ]
      }
    ];

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Templates error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;