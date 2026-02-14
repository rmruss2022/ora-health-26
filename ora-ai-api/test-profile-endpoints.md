# Profile Endpoints Test Plan

## Prerequisites
1. Server running on port 3000 (or configured PORT)
2. Valid user account with JWT token
3. Database migration 004 completed

## Test Endpoints

### 1. Save Quiz Responses
**POST /api/users/:id/quiz**

Headers:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

Body:
```json
{
  "user_id": "user-uuid-here",
  "quiz_version": "1.0",
  "completed_at": "2026-02-13T10:00:00.000Z",
  "started_at": "2026-02-13T09:55:00.000Z",
  "responses": {
    "q1_goals": {
      "selected": ["stress_anxiety", "personal_growth"]
    },
    "q2_focus_area": {
      "selected": "emotional_wellbeing"
    },
    "q3_reflection_style": {
      "selected": ["writing_journaling", "meditation_mindfulness"]
    },
    "q4_biggest_challenge": {
      "text": "Managing work stress",
      "skipped": false
    },
    "q5_checkin_frequency": {
      "selected": "daily"
    },
    "q6_preferred_time": {
      "selected": "morning"
    },
    "q7_therapy_background": {
      "selected": "no_prefer_selfguided"
    },
    "q8_stress_level": {
      "value": 7
    },
    "q9_motivation_drivers": {
      "selected": ["accountability_tracking", "encouragement", "data_insights"]
    },
    "q10_additional_context": {
      "text": "Looking forward to this journey",
      "skipped": false
    }
  },
  "metadata": {
    "time_to_complete_seconds": 180,
    "device_type": "web",
    "app_version": "1.0.0"
  }
}
```

Expected Response (200):
```json
{
  "success": true,
  "message": "Quiz responses saved successfully",
  "profile": {
    "id": "profile-uuid",
    "user_id": "user-uuid",
    "quiz_completed_at": "2026-02-13T10:00:00.000Z",
    "suggested_behaviors": ["breathing_exercises", "meditation", "body_scan", "grounding_techniques", "journaling", "self_reflection", "goal_setting", "values_clarification"],
    "notification_frequency": "daily",
    "preferred_check_in_time": "08:00",
    "content_difficulty_level": 4,
    "primary_goals": ["stress_anxiety", "personal_growth"],
    "focus_area": "emotional_wellbeing"
  }
}
```

### 2. Get User Profile
**GET /api/users/:id/profile**

Headers:
```
Authorization: Bearer <access_token>
```

Expected Response (200):
```json
{
  "success": true,
  "profile": {
    "id": "profile-uuid",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "Test User",
      "avatar_url": null
    },
    "quiz_data": {
      "responses": { ... },
      "completed_at": "2026-02-13T10:00:00.000Z",
      "started_at": "2026-02-13T09:55:00.000Z",
      "version": "1.0",
      "revision_count": 0
    },
    "personalization": {
      "suggested_behaviors": [...],
      "notification_frequency": "daily",
      "preferred_check_in_time": "08:00",
      "content_difficulty_level": 4,
      "primary_goals": ["stress_anxiety", "personal_growth"],
      "focus_area": "emotional_wellbeing",
      "reflection_styles": ["writing_journaling", "meditation_mindfulness"],
      "motivation_drivers": ["accountability_tracking", "encouragement", "data_insights"],
      "stress_baseline": 7
    },
    "created_at": "2026-02-13T10:00:00.000Z",
    "updated_at": "2026-02-13T10:00:00.000Z"
  }
}
```

### 3. Update Profile Settings
**PATCH /api/users/:id/profile**

Headers:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

Body:
```json
{
  "notification_frequency": "three_times_weekly",
  "preferred_check_in_time": "19:00",
  "content_difficulty_level": 6
}
```

Expected Response (200):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": {
    "id": "profile-uuid",
    "user_id": "user-uuid",
    "notification_frequency": "three_times_weekly",
    "preferred_check_in_time": "19:00",
    "suggested_behaviors": [...],
    "content_difficulty_level": 6,
    "updated_at": "2026-02-13T10:30:00.000Z"
  }
}
```

### 4. Get Personalized Recommendations
**GET /api/users/:id/recommendations**

Headers:
```
Authorization: Bearer <access_token>
```

Expected Response (200):
```json
{
  "success": true,
  "recommendations": {
    "behaviors": ["breathing_exercises", "meditation", ...],
    "exercises": ["Box Breathing (4-4-4-4)", "Guided Body Scan Meditation", ...],
    "content_tags": ["stress_anxiety", "personal_growth", "emotional_wellbeing"],
    "check_in_schedule": "daily"
  }
}
```

### 5. Delete Profile
**DELETE /api/users/:id/profile**

Headers:
```
Authorization: Bearer <access_token>
```

Expected Response (200):
```json
{
  "success": true,
  "message": "Profile deleted successfully"
}
```

## Error Cases

### 403 Forbidden - Wrong User
```json
{
  "error": "Forbidden",
  "message": "You can only update your own profile"
}
```

### 404 Not Found - No Profile
```json
{
  "error": "Profile not found",
  "message": "User profile does not exist. Please complete the quiz first."
}
```

### 400 Validation Error - Missing Required Fields
```json
{
  "error": "Validation error",
  "message": "Q1 (goals) is required"
}
```

## cURL Examples

### 1. Register a test user
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "name": "Test User"
  }'
```

### 2. Save quiz (replace USER_ID and ACCESS_TOKEN)
```bash
curl -X POST http://localhost:3000/api/users/USER_ID/quiz \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @quiz-payload.json
```

### 3. Get profile
```bash
curl -X GET http://localhost:3000/api/users/USER_ID/profile \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 4. Update profile
```bash
curl -X PATCH http://localhost:3000/api/users/USER_ID/profile \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notification_frequency": "weekly",
    "content_difficulty_level": 8
  }'
```

### 5. Get recommendations
```bash
curl -X GET http://localhost:3000/api/users/USER_ID/recommendations \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Validation Tests

### Test personalization mappings:
- **Q1 Goals → Behaviors**: stress_anxiety → breathing_exercises, meditation, body_scan, grounding_techniques
- **Q5 Frequency → Notification**: daily → daily, few_times_week → three_times_weekly
- **Q6 Time → Check-in**: morning → 08:00, afternoon → 14:00, evening → 19:00
- **Q8 Stress → Difficulty**: stress 7 → difficulty 4 (inverse relationship)

### Test edge cases:
- Quiz submission with missing optional fields (Q4, Q10)
- Update profile before completing quiz (should fail)
- Access another user's profile (should fail with 403)
- Invalid content_difficulty_level (< 1 or > 10)
