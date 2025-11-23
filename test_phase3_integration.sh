#!/bin/bash

# VibeForge Phase 3 - Quick Integration Test
# Tests learning layer frontend integration with DataForge backend

set -e

echo "==================================================================="
echo "VibeForge Phase 3 Learning Layer Integration Test"
echo "==================================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8001"
FRONTEND_URL="http://localhost:5173"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper functions
pass_test() {
  TESTS_PASSED=$((TESTS_PASSED + 1))
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  echo -e "${GREEN}✓ PASS${NC}: $1"
}

fail_test() {
  TESTS_FAILED=$((TESTS_FAILED + 1))
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  echo -e "${RED}✗ FAIL${NC}: $1"
}

skip_test() {
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  echo -e "${YELLOW}⊘ SKIP${NC}: $1"
}

# Test 1: Backend Health Check
echo "Test 1: Backend Health Check"
if curl -s "${BACKEND_URL}/health" > /dev/null 2>&1; then
  pass_test "Backend is running at ${BACKEND_URL}"
else
  fail_test "Backend not accessible at ${BACKEND_URL}"
  echo "       Please start DataForge backend: cd ../DataForge && uvicorn app.main:app --reload --port 8001"
  exit 1
fi
echo ""

# Test 2: Frontend Health Check
echo "Test 2: Frontend Health Check"
if curl -s "${FRONTEND_URL}" > /dev/null 2>&1; then
  pass_test "Frontend is running at ${FRONTEND_URL}"
else
  fail_test "Frontend not accessible at ${FRONTEND_URL}"
  echo "       Please start VibeForge frontend: pnpm dev"
  exit 1
fi
echo ""

# Test 3: Learning API Endpoints
echo "Test 3: Learning API Endpoints"

# Test 3.1: Create Project
echo "  3.1: Create Project"
PROJECT_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/vibeforge/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Test Learning Project",
    "project_type": "web",
    "description": "Integration test project",
    "selected_languages": ["javascript-typescript", "python"],
    "team_size": "small",
    "project_complexity": 5
  }')

if echo "$PROJECT_RESPONSE" | grep -q "project_id"; then
  PROJECT_ID=$(echo "$PROJECT_RESPONSE" | grep -o '"project_id":[0-9]*' | grep -o '[0-9]*')
  pass_test "Project created (ID: ${PROJECT_ID})"
else
  fail_test "Project creation failed"
  echo "       Response: ${PROJECT_RESPONSE}"
fi
echo ""

# Test 3.2: Create Session
echo "  3.2: Create Session"
if [ -n "$PROJECT_ID" ]; then
  SESSION_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/vibeforge/sessions" \
    -H "Content-Type: application/json" \
    -d "{
      \"project_id\": ${PROJECT_ID},
      \"session_type\": \"wizard\"
    }")

  if echo "$SESSION_RESPONSE" | grep -q "session_id"; then
    SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"session_id":[0-9]*' | grep -o '[0-9]*')
    pass_test "Session created (ID: ${SESSION_ID})"
  else
    fail_test "Session creation failed"
    echo "       Response: ${SESSION_RESPONSE}"
  fi
else
  skip_test "Session creation (no project ID)"
fi
echo ""

# Test 3.3: Update Session
echo "  3.3: Update Session"
if [ -n "$SESSION_ID" ]; then
  UPDATE_RESPONSE=$(curl -s -X PUT "${BACKEND_URL}/api/vibeforge/sessions/${SESSION_ID}" \
    -H "Content-Type: application/json" \
    -d '{
      "languages_considered": ["javascript-typescript", "python"],
      "stacks_compared": ["t3-stack", "nextjs-fullstack"],
      "steps_completed": [1, 2, 3],
      "steps_revisited": []
    }')

  if echo "$UPDATE_RESPONSE" | grep -q "session_id"; then
    pass_test "Session updated"
  else
    fail_test "Session update failed"
    echo "       Response: ${UPDATE_RESPONSE}"
  fi
else
  skip_test "Session update (no session ID)"
fi
echo ""

# Test 3.4: Complete Session
echo "  3.4: Complete Session"
if [ -n "$SESSION_ID" ]; then
  COMPLETE_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/vibeforge/sessions/${SESSION_ID}/complete" \
    -H "Content-Type: application/json" \
    -d '{
      "final_languages": ["javascript-typescript", "python"],
      "final_stack": "t3-stack",
      "wizard_completed": true
    }')

  if echo "$COMPLETE_RESPONSE" | grep -q '"status":"completed"'; then
    pass_test "Session completed"
  else
    fail_test "Session completion failed"
    echo "       Response: ${COMPLETE_RESPONSE}"
  fi
else
  skip_test "Session completion (no session ID)"
fi
echo ""

# Test 4: Create Stack Outcome
echo "Test 4: Create Stack Outcome"
if [ -n "$PROJECT_ID" ]; then
  OUTCOME_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/vibeforge/outcomes" \
    -H "Content-Type: application/json" \
    -d "{
      \"project_id\": ${PROJECT_ID},
      \"stack_id\": \"t3-stack\",
      \"languages_used\": [\"javascript-typescript\"],
      \"successful\": true,
      \"build_time\": 7200,
      \"test_pass_rate\": 0.95,
      \"deployment_success\": true,
      \"user_satisfaction\": 5,
      \"notes\": \"Integration test outcome\"
    }")

  if echo "$OUTCOME_RESPONSE" | grep -q "outcome_id"; then
    pass_test "Stack outcome created"
  else
    fail_test "Stack outcome creation failed"
    echo "       Response: ${OUTCOME_RESPONSE}"
  fi
else
  skip_test "Stack outcome creation (no project ID)"
fi
echo ""

# Test 5: Analytics Endpoints
echo "Test 5: Analytics Endpoints"

# Test 5.1: Stack Success Rates
echo "  5.1: Stack Success Rates"
SUCCESS_RATES=$(curl -s "${BACKEND_URL}/api/vibeforge/analytics/stack-success-rates")
if echo "$SUCCESS_RATES" | grep -q "stack_id"; then
  STACK_COUNT=$(echo "$SUCCESS_RATES" | grep -o '"stack_id"' | wc -l)
  pass_test "Stack success rates retrieved (${STACK_COUNT} stacks)"
else
  fail_test "Stack success rates retrieval failed"
  echo "       Response: ${SUCCESS_RATES}"
fi
echo ""

# Test 5.2: User Preferences (if user ID available)
echo "  5.2: User Preferences"
if [ -n "$PROJECT_ID" ]; then
  # Assuming user_id = 1 for testing
  PREFERENCES=$(curl -s "${BACKEND_URL}/api/vibeforge/analytics/user-preferences/1")
  if echo "$PREFERENCES" | grep -q "total_projects"; then
    pass_test "User preferences retrieved"
  else
    fail_test "User preferences retrieval failed"
    echo "       Response: ${PREFERENCES}"
  fi
else
  skip_test "User preferences (no user ID)"
fi
echo ""

# Test 5.3: Abandoned Sessions
echo "  5.3: Abandoned Sessions"
ABANDONED=$(curl -s "${BACKEND_URL}/api/vibeforge/analytics/abandoned-sessions?days=30")
if echo "$ABANDONED" | grep -q "total_sessions"; then
  pass_test "Abandoned sessions analytics retrieved"
else
  fail_test "Abandoned sessions retrieval failed"
  echo "       Response: ${ABANDONED}"
fi
echo ""

# Test 6: Frontend Components Check
echo "Test 6: Frontend Components Check"

# Test 6.1: Check if learning store file exists
echo "  6.1: Learning Store"
if [ -f "src/lib/stores/learning.ts" ]; then
  pass_test "Learning store exists"
else
  fail_test "Learning store not found"
fi
echo ""

# Test 6.2: Check if API client exists
echo "  6.2: VibeForge API Client"
if [ -f "src/lib/api/vibeforgeClient.ts" ]; then
  pass_test "VibeForge API client exists"
else
  fail_test "VibeForge API client not found"
fi
echo ""

# Test 6.3: Check if learning types exist
echo "  6.3: Learning Types"
if [ -f "src/lib/types/learning.ts" ]; then
  pass_test "Learning types exist"
else
  fail_test "Learning types not found"
fi
echo ""

# Test 6.4: Check if analytics dashboard exists
echo "  6.4: Analytics Dashboard"
if [ -f "src/lib/components/wizard/AnalyticsDashboard.svelte" ]; then
  pass_test "Analytics dashboard exists"
else
  fail_test "Analytics dashboard not found"
fi
echo ""

# Test 6.5: Check if adaptive recommendation exists
echo "  6.5: Adaptive Recommendation"
if [ -f "src/lib/components/wizard/AdaptiveRecommendation.svelte" ]; then
  pass_test "Adaptive recommendation component exists"
else
  fail_test "Adaptive recommendation component not found"
fi
echo ""

# Summary
echo "==================================================================="
echo "Test Summary"
echo "==================================================================="
echo ""
echo "Total Tests:  ${TESTS_TOTAL}"
echo -e "${GREEN}Passed:       ${TESTS_PASSED}${NC}"
echo -e "${RED}Failed:       ${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  echo ""
  echo "Phase 3 Learning Layer Integration: ✓ READY"
  echo ""
  echo "Next Steps:"
  echo "1. Run manual UI tests (see PHASE_3_TESTING_GUIDE.md)"
  echo "2. Test wizard flow with learning tracking"
  echo "3. Verify analytics dashboard with real data"
  echo "4. Test adaptive recommendations"
  echo ""
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  echo ""
  echo "Please fix the failed tests and try again."
  echo "See PHASE_3_TESTING_GUIDE.md for troubleshooting."
  echo ""
  exit 1
fi
