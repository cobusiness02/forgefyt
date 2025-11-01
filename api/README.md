# FitCoach Pro API Documentation

## Overview
The FitCoach Pro API is a RESTful service designed to work seamlessly with iOS applications. It provides comprehensive endpoints for fitness coaching platform management including authentication, coach dashboards, client management, and workout scheduling.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Demo Accounts
- **Coach**: `coach@fitcoachpro.com` / `coach123`
- **Admin**: `admin@fitcoachpro.com` / `admin123`

---

## Authentication Endpoints

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "coach@fitcoachpro.com",
  "password": "coach123",
  "deviceInfo": {
    "platform": "ios",
    "version": "1.0.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1",
    "email": "coach@fitcoachpro.com",
    "name": "John Coach",
    "role": "coach",
    "profile": {...}
  },
  "expiresIn": "7d"
}
```

### POST /api/auth/register
Register a new coach account.

### GET /api/auth/verify
Verify JWT token validity.

### POST /api/auth/logout
Logout current user.

### GET /api/auth/profile
Get current user profile.

---

## Coach Endpoints

### GET /api/coaches/dashboard
Get coach dashboard with stats and today's schedule.

**Response:**
```json
{
  "success": true,
  "data": {
    "coach": {
      "id": "1",
      "name": "John Coach",
      "specialization": "Weight Training"
    },
    "stats": {
      "totalClients": 25,
      "activeClients": 18,
      "completedSessions": 450,
      "rating": 4.8
    },
    "todaysSchedule": [...],
    "recentActivity": [...],
    "weeklyProgress": {...}
  }
}
```

### GET /api/coaches/profile
Get detailed coach profile.

### PUT /api/coaches/profile
Update coach profile information.

### PUT /api/coaches/schedule
Update coach availability schedule.

### GET /api/coaches/stats?period=month
Get coach statistics for specified period (week/month/quarter/year).

---

## Client Management Endpoints

### GET /api/clients
Get all clients with filtering and pagination.

**Query Parameters:**
- `status`: active/inactive/all
- `search`: Search term
- `page`: Page number
- `limit`: Items per page

### GET /api/clients/:id
Get specific client details.

### POST /api/clients
Create a new client.

**Request Body:**
```json
{
  "name": "Sarah Johnson",
  "email": "sarah@email.com",
  "phone": "+1-555-0123",
  "goals": ["Weight Loss", "Strength Building"],
  "fitnessLevel": "intermediate",
  "preferences": {
    "workoutTime": "morning",
    "workoutDuration": 60,
    "intensity": "high"
  }
}
```

### PUT /api/clients/:id
Update client information.

### DELETE /api/clients/:id
Deactivate a client (soft delete).

### GET /api/clients/:id/progress?period=month
Get client progress and statistics.

---

## Workout Management Endpoints

### GET /api/workouts
Get workouts with filtering and pagination.

**Query Parameters:**
- `date`: Filter by specific date (YYYY-MM-DD)
- `clientId`: Filter by client
- `type`: strength/cardio/flexibility/sports/rehabilitation
- `status`: scheduled/completed/cancelled/missed

### GET /api/workouts/calendar?month=11&year=2024
Get calendar view of workouts for specified month/year.

### GET /api/workouts/:id
Get specific workout details.

### POST /api/workouts
Create a new workout.

**Request Body:**
```json
{
  "clientId": "1",
  "clientName": "Sarah Johnson",
  "title": "Upper Body Strength",
  "type": "strength",
  "date": "2024-11-01",
  "time": "09:00",
  "duration": 60,
  "exercises": [
    {
      "name": "Bench Press",
      "sets": 3,
      "reps": 10,
      "weight": 60,
      "restTime": 90
    }
  ],
  "notes": "Focus on form"
}
```

### PUT /api/workouts/:id
Update workout details.

### DELETE /api/workouts/:id
Cancel a workout.

### GET /api/workouts/templates/list
Get workout templates.

---

## iOS-Specific Endpoints

### POST /api/ios/register-device
Register iOS device for push notifications.

**Request Body:**
```json
{
  "deviceToken": "64-character-hex-string",
  "platform": "ios",
  "appVersion": "1.0.0",
  "osVersion": "17.0"
}
```

### DELETE /api/ios/unregister-device
Unregister device from push notifications.

### POST /api/ios/send-notification
Send push notification to user.

### GET /api/ios/app-config
Get iOS app configuration and settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "apiVersion": "1.0.0",
    "features": {
      "pushNotifications": true,
      "biometricAuth": true,
      "offlineMode": false
    },
    "workoutTypes": [...],
    "settings": {...}
  }
}
```

### GET /api/ios/ios-health
iOS-specific health check.

### GET /api/ios/sync?lastSync=2024-11-01T00:00:00Z
Sync data for offline capabilities.

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Human readable error message",
  "details": [...] // Optional validation details
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (e.g., email already exists)
- `500`: Internal Server Error

---

## iOS Integration Example

### Swift URLSession Example
```swift
// Login example
let loginData = [
    "email": "coach@fitcoachpro.com",
    "password": "coach123"
]

var request = URLRequest(url: URL(string: "http://localhost:3000/api/auth/login")!)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.httpBody = try! JSONSerialization.data(withJSONObject: loginData)

URLSession.shared.dataTask(with: request) { data, response, error in
    // Handle response
}.resume()
```

### Authenticated Request Example
```swift
var request = URLRequest(url: URL(string: "http://localhost:3000/api/coaches/dashboard")!)
request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

URLSession.shared.dataTask(with: request) { data, response, error in
    // Handle response
}.resume()
```

---

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   cd api
   npm install
   ```

2. **Environment Setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Server:**
   ```bash
   npm start
   # Or for development:
   npm run dev
   ```

4. **Test API:**
   ```bash
   curl http://localhost:3000/health
   ```

The API server will be running on `http://localhost:3000` and ready for iOS app integration!

---

## CORS Configuration

The API is pre-configured for iOS development with these allowed origins:
- `capacitor://localhost` (Capacitor iOS apps)
- `ionic://localhost` (Ionic iOS apps)
- `http://localhost:8100` (Ionic development server)
- Local development servers

---

## Rate Limiting

- **100 requests per 15 minutes** per IP address
- Authentication endpoints may have stricter limits
- Exceeding limits returns `429 Too Many Requests`

---

## Data Models

### User/Coach
```typescript
interface Coach {
  id: string;
  email: string;
  name: string;
  role: 'coach' | 'admin';
  specialization: string;
  experience: string;
  certifications: string[];
  stats: CoachStats;
  schedule: WeeklySchedule;
}
```

### Client
```typescript
interface Client {
  id: string;
  name: string;
  email: string;
  goals: string[];
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  measurements: Measurements;
  progress: ClientProgress;
}
```

### Workout
```typescript
interface Workout {
  id: string;
  clientId: string;
  title: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'rehabilitation';
  date: string;
  time: string;
  duration: number;
  exercises: Exercise[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
}
```