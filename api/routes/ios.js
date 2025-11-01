const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Mock device registrations for push notifications
let deviceRegistrations = [];

// Register iOS device for push notifications
router.post('/register-device', [
  authenticateToken,
  body('deviceToken').isString().isLength({ min: 64, max: 64 }),
  body('platform').equals('ios'),
  body('appVersion').optional().isString(),
  body('osVersion').optional().isString()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { deviceToken, platform, appVersion, osVersion } = req.body;
    const userId = req.user.userId;

    // Remove existing registration for this user
    deviceRegistrations = deviceRegistrations.filter(reg => reg.userId !== userId);

    // Add new registration
    const newRegistration = {
      id: Date.now().toString(),
      userId,
      deviceToken,
      platform,
      appVersion: appVersion || 'unknown',
      osVersion: osVersion || 'unknown',
      registeredAt: new Date().toISOString(),
      isActive: true
    };

    deviceRegistrations.push(newRegistration);

    res.json({
      success: true,
      message: 'Device registered successfully for push notifications',
      data: {
        registrationId: newRegistration.id,
        userId: userId
      }
    });

  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Unregister device
router.delete('/unregister-device', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    
    const initialLength = deviceRegistrations.length;
    deviceRegistrations = deviceRegistrations.filter(reg => reg.userId !== userId);
    
    const removed = initialLength > deviceRegistrations.length;

    res.json({
      success: true,
      message: removed ? 'Device unregistered successfully' : 'No device registration found',
      removed
    });

  } catch (error) {
    console.error('Device unregistration error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Send push notification (mock implementation)
router.post('/send-notification', [
  authenticateToken,
  body('userId').optional().isString(),
  body('title').isString().isLength({ min: 1, max: 100 }),
  body('message').isString().isLength({ min: 1, max: 200 }),
  body('data').optional().isObject()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId, title, message, data } = req.body;
    const targetUserId = userId || req.user.userId;

    // Find device registration
    const deviceReg = deviceRegistrations.find(reg => 
      reg.userId === targetUserId && reg.isActive
    );

    if (!deviceReg) {
      return res.status(404).json({
        error: 'No device registration found for user'
      });
    }

    // Mock notification sending (in real app, use APNS)
    const notification = {
      id: Date.now().toString(),
      deviceToken: deviceReg.deviceToken,
      title,
      message,
      data: data || {},
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    console.log('Mock push notification sent:', notification);

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        notificationId: notification.id,
        deviceToken: deviceReg.deviceToken.substring(0, 8) + '...',
        sentAt: notification.sentAt
      }
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get iOS app configuration
router.get('/app-config', authenticateToken, (req, res) => {
  try {
    const config = {
      apiVersion: '1.0.0',
      minSupportedAppVersion: '1.0.0',
      features: {
        pushNotifications: true,
        biometricAuth: true,
        offlineMode: false,
        darkMode: true,
        multiLanguage: false
      },
      endpoints: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
        websocket: process.env.WS_URL || 'ws://localhost:3000'
      },
      settings: {
        sessionTimeout: 3600000, // 1 hour in ms
        maxRetries: 3,
        requestTimeout: 30000, // 30 seconds
        cacheExpiry: 300000 // 5 minutes
      },
      workoutTypes: [
        { id: 'strength', name: 'Strength Training', color: '#FF6B6B' },
        { id: 'cardio', name: 'Cardiovascular', color: '#4ECDC4' },
        { id: 'flexibility', name: 'Flexibility & Mobility', color: '#45B7D1' },
        { id: 'sports', name: 'Sports Training', color: '#96CEB4' },
        { id: 'rehabilitation', name: 'Rehabilitation', color: '#FECA57' }
      ]
    };

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('App config error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Health check specifically for iOS app
router.get('/ios-health', (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      platform: 'ios',
      services: {
        authentication: 'operational',
        database: 'operational',
        pushNotifications: 'operational',
        fileUpload: 'operational'
      },
      registeredDevices: deviceRegistrations.filter(reg => reg.isActive).length
    };

    res.json(health);

  } catch (error) {
    console.error('iOS health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Sync data for offline capabilities
router.get('/sync', [
  authenticateToken,
  body('lastSync').optional().isISO8601()
], (req, res) => {
  try {
    const { lastSync } = req.query;
    const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);

    // Mock sync data (in real app, return changed data since lastSync)
    const syncData = {
      timestamp: new Date().toISOString(),
      clients: {
        updated: [],
        deleted: []
      },
      workouts: {
        updated: [],
        deleted: []
      },
      profile: {
        updated: null
      }
    };

    res.json({
      success: true,
      data: syncData,
      nextSync: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;