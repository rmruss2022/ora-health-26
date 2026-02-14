#!/bin/bash

# Test script for Reactions API
# Make sure the API server is running first

API_BASE="http://localhost:3000"
TEST_USER_ID="test-user-123"
TEST_POST_ID="test-post-456"

echo "🧪 Testing Reactions API..."
echo ""

# Test 1: Add a reaction
echo "1. Adding ❤️ reaction..."
RESPONSE=$(curl -s -X POST "$API_BASE/api/reactions" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$TEST_USER_ID\",\"targetId\":\"$TEST_POST_ID\",\"targetType\":\"post\",\"emoji\":\"❤️\"}")
echo "Response: $RESPONSE"
echo ""

# Test 2: Add another reaction
echo "2. Adding 👍 reaction..."
RESPONSE=$(curl -s -X POST "$API_BASE/api/reactions" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$TEST_USER_ID\",\"targetId\":\"$TEST_POST_ID\",\"targetType\":\"post\",\"emoji\":\"👍\"}")
echo "Response: $RESPONSE"
echo ""

# Test 3: Get reactions
echo "3. Getting reactions for post..."
RESPONSE=$(curl -s "$API_BASE/api/reactions/$TEST_POST_ID?userId=$TEST_USER_ID")
echo "Response: $RESPONSE"
echo ""

# Test 4: Remove a reaction
echo "4. Removing ❤️ reaction..."
RESPONSE=$(curl -s -X DELETE "$API_BASE/api/reactions" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$TEST_USER_ID\",\"targetId\":\"$TEST_POST_ID\",\"emoji\":\"❤️\"}")
echo "Response: $RESPONSE"
echo ""

# Test 5: Get reactions again
echo "5. Getting reactions after removal..."
RESPONSE=$(curl -s "$API_BASE/api/reactions/$TEST_POST_ID?userId=$TEST_USER_ID")
echo "Response: $RESPONSE"
echo ""

echo "✅ Test complete!"
