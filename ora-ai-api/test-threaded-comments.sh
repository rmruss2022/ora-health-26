#!/bin/bash

# Test script for Threaded Comments API (ORA-040)
# Run this after starting the server with: npm run dev

BASE_URL="http://localhost:3000"
POST_ID="example-post-id"
USER_ID="test-user-id"

echo "🧪 Testing Threaded Comments API"
echo "================================"
echo ""

# Test 1: Get comments for a post
echo "1️⃣  GET /api/posts/:id/comments"
echo "   Fetching comments for post..."
curl -s -X GET "$BASE_URL/api/posts/$POST_ID/comments?userId=$USER_ID&limit=10" \
  -H "Content-Type: application/json" | jq '.' || echo "Error: Make sure server is running"
echo ""
echo ""

# Test 2: Add a top-level comment
echo "2️⃣  POST /api/posts/:id/comments"
echo "   Creating a new comment..."
COMMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/posts/$POST_ID/comments" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "content": "This is a test comment from the API test script!",
    "isAnonymous": false,
    "authorName": "Test User",
    "authorAvatar": "🧪"
  }')
echo "$COMMENT_RESPONSE" | jq '.'
COMMENT_ID=$(echo "$COMMENT_RESPONSE" | jq -r '.comment.id')
echo "Created comment ID: $COMMENT_ID"
echo ""
echo ""

# Test 3: Reply to the comment
if [ "$COMMENT_ID" != "null" ] && [ -n "$COMMENT_ID" ]; then
  echo "3️⃣  POST /api/comments/:id/reply"
  echo "   Replying to comment $COMMENT_ID..."
  REPLY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/comments/$COMMENT_ID/reply" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "'$USER_ID'",
      "content": "This is a nested reply to the test comment!",
      "isAnonymous": false,
      "authorName": "Reply User",
      "authorAvatar": "💬"
    }')
  echo "$REPLY_RESPONSE" | jq '.'
  REPLY_ID=$(echo "$REPLY_RESPONSE" | jq -r '.comment.id')
  echo "Created reply ID: $REPLY_ID"
  echo ""
  echo ""

  # Test 4: React to the comment
  echo "4️⃣  POST /api/comments/:id/react"
  echo "   Adding 'like' reaction to comment..."
  curl -s -X POST "$BASE_URL/api/comments/$COMMENT_ID/react" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "'$USER_ID'",
      "reactionType": "like"
    }' | jq '.'
  echo ""
  echo ""

  # Test 5: Get comment thread
  echo "5️⃣  GET /api/comments/:id/thread"
  echo "   Fetching full thread for comment..."
  curl -s -X GET "$BASE_URL/api/comments/$COMMENT_ID/thread?userId=$USER_ID" \
    -H "Content-Type: application/json" | jq '.'
  echo ""
  echo ""

  # Test 6: Delete the comment
  echo "6️⃣  DELETE /api/comments/:id"
  echo "   Soft deleting comment..."
  curl -s -X DELETE "$BASE_URL/api/comments/$COMMENT_ID?userId=$USER_ID" \
    -H "Content-Type: application/json" | jq '.'
  echo ""
  echo ""
fi

echo "✅ Test script complete!"
echo ""
echo "📝 Note: Replace POST_ID and USER_ID with actual IDs from your database"
echo "   Or create a post first using the community API"
