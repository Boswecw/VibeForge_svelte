# VibeForge Phase 3 Testing Guide

**Learning Layer Frontend Integration - End-to-End Testing**

## Prerequisites

### 1. Backend Setup (DataForge)

Ensure DataForge backend is running with Phase 3.1 learning endpoints:

```bash
cd ../DataForge
# Start backend (FastAPI)
uvicorn app.main:app --reload --port 8001

# Verify backend health
curl http://localhost:8001/health
```

**Expected endpoints (30+)**:

- `POST /api/vibeforge/projects` - Create project
- `POST /api/vibeforge/sessions` - Create session
- `PUT /api/vibeforge/sessions/{session_id}` - Update session
- `POST /api/vibeforge/sessions/{session_id}/complete` - Complete session
- `GET /api/vibeforge/analytics/stack-success-rates` - Get success rates
- `GET /api/vibeforge/analytics/user-preferences/{user_id}` - Get preferences
- And 24+ more endpoints...

### 2. Frontend Setup (VibeForge)

```bash
cd vibeforge
pnpm install
pnpm dev
```

Access: http://localhost:5173

## Testing Checklist

### Phase 1: Project Initialization (Step 1-4)

#### Test 1.1: Start New Project

- [ ] Navigate to wizard (Step 1: Intent)
- [ ] Fill in project details:
  - Name: "Test Learning Project"
  - Type: "web"
  - Description: "Testing adaptive learning integration"
  - Team Size: "small"
  - Complexity: "intermediate"

**Expected**: No backend interaction yet (project created in Step 5)

#### Test 1.2: Language Selection with Learning (Step 2)

- [ ] View learning-based recommendations panel (if user has history)
  - Displays favorite languages from preferences
  - Shows total projects and completion rate
  - Allows quick-select of favorites
- [ ] View AI recommendations panel (from languages API)
- [ ] Select 2-3 languages (e.g., TypeScript, Python)
- [ ] Check browser console for learning tracking:
  ```
  learningStore.trackLanguageViewed(languageId)
  learningStore.trackLanguageConsidered(languageId)
  learningStore.syncSession()
  ```

**Expected**: Language selections tracked locally (not synced until Step 5)

#### Test 1.3: Stack Selection with Success Predictions (Step 3)

- [ ] View adaptive recommendations panel
  - Should show stacks with success rates
  - Confidence scores calculated from learning data
  - Detailed reasoning displayed
- [ ] View stack cards with success prediction badges
  - Green badge (>80% success)
  - Yellow badge (60-80% success)
  - Red badge (<60% success)
- [ ] View success metrics on expanded cards:
  - Build time (e.g., "2h")
  - Test pass rate (e.g., "95%")
  - User satisfaction (e.g., "4.8/5")
- [ ] Select a stack (e.g., "T3 Stack")
- [ ] Try comparing 2-3 stacks
- [ ] Check console for tracking:
  ```
  learningStore.trackStackViewed(stackId)
  learningStore.trackStackCompared(stackId)
  learningStore.syncSession()
  ```

**Expected**: Stack interactions tracked locally

#### Test 1.4: Configuration (Step 4)

- [ ] Configure project settings
- [ ] Check console:
  ```
  learningStore.trackStepCompleted(4)
  ```

**Expected**: Step 4 completion tracked

### Phase 2: Project Creation & Backend Integration (Step 5)

#### Test 2.1: Review and Initialize Learning

- [ ] Navigate to Step 5 (Review)
- [ ] Check console for project/session initialization:
  ```
  learningStore.startProject(...)
  learningStore.startSession(...)
  ```
- [ ] Verify backend calls in Network tab:
  - `POST /api/vibeforge/projects` (201 Created)
  - `POST /api/vibeforge/sessions` (201 Created)
- [ ] Check console for project ID and session ID

**Expected**: Project and session created in DataForge backend

#### Test 2.2: Generate Project with Session Completion

- [ ] Click "Generate Project" button
- [ ] Check console for completion:
  ```
  learningStore.completeSession(...)
  ```
- [ ] Verify backend call:
  - `POST /api/vibeforge/sessions/{session_id}/complete` (200 OK)
- [ ] Response should include:
  - `session_id`
  - `status: "completed"`
  - `languages_considered` (array)
  - `stacks_compared` (array)
  - `steps_completed` (array)

**Expected**: Session completed with all tracking data

### Phase 3: Analytics Dashboard

#### Test 3.1: View Analytics Dashboard

Create a separate analytics page/component that imports `AnalyticsDashboard.svelte`:

```svelte
<script>
  import AnalyticsDashboard from "$lib/components/wizard/AnalyticsDashboard.svelte";
</script>

<AnalyticsDashboard userId={null} />
```

- [ ] Navigate to analytics page
- [ ] Verify loading state shows spinner
- [ ] Check backend calls:
  - `GET /api/vibeforge/analytics/stack-success-rates`
  - `GET /api/vibeforge/analytics/user-preferences/{user_id}` (if userId provided)
  - `GET /api/vibeforge/analytics/abandoned-sessions?days=30`

**Expected**: Analytics data loads and displays

#### Test 3.2: Verify Analytics Sections

**Stack Success Rates**:

- [ ] Cards display for each stack
- [ ] Each card shows:
  - Stack name and icon
  - Success rate percentage (with color coding)
  - Total uses
  - Avg build time
  - Test pass rate
  - User satisfaction
- [ ] Empty state if no data: "No analytics data available yet"

**User Preferences**:

- [ ] Total Projects card
- [ ] Completion Rate card
- [ ] Avg Complexity card
- [ ] Total Sessions card
- [ ] Favorite Languages tags
- [ ] Favorite Stacks tags

**Session Statistics**:

- [ ] Total Sessions (last 30 days)
- [ ] Abandoned Sessions count
- [ ] Abandonment Rate (color-coded)

#### Test 3.3: Refresh Analytics

- [ ] Click "Refresh Analytics" button
- [ ] Verify loading state
- [ ] Check backend calls repeat
- [ ] Data updates with latest values

**Expected**: Analytics refresh successfully

### Phase 4: Adaptive Recommendations Validation

#### Test 4.1: Stack Recommendations with Real Data

Complete 2-3 projects through the wizard with different outcomes:

**Project 1**: Success

- Stack: T3 Stack
- Outcome: successful=true, build_time=7200, test_pass_rate=0.95, satisfaction=5

**Project 2**: Partial Success

- Stack: MERN Stack
- Outcome: successful=true, build_time=10800, test_pass_rate=0.75, satisfaction=4

**Project 3**: Failure

- Stack: Django Stack
- Outcome: successful=false, build_time=14400, test_pass_rate=0.50, satisfaction=2

Then start a new project:

- [ ] Go to Step 3 (Stack Selection)
- [ ] View adaptive recommendations
- [ ] Verify T3 Stack ranked highest (best success rate)
- [ ] Verify reasoning includes:
  - "100% success rate across 1 projects" (or similar)
  - "Average setup time: 2 hours"
  - "95% average test pass rate"
  - "User satisfaction: 5.0/5 stars"
- [ ] Verify confidence score reflects success rate

**Expected**: Real historical data drives recommendations

#### Test 4.2: Language Recommendations with User Preferences

After completing projects with Python and TypeScript:

- [ ] Go to Step 2 (Languages)
- [ ] Verify learning-based recommendations panel shows:
  - Favorite languages: Python, TypeScript
  - Total projects completed
  - Success rate percentage
- [ ] Quick-select a favorite language
- [ ] Verify it's added to selection

**Expected**: User's favorite languages recommended based on history

### Phase 5: Error Handling & Edge Cases

#### Test 5.1: Backend Unavailable

- [ ] Stop DataForge backend
- [ ] Start new wizard session
- [ ] Navigate through steps
- [ ] Verify graceful fallback:
  - Analytics dashboard shows error with retry button
  - AdaptiveRecommendation uses mock data
  - Console warnings (not errors)
  - Wizard still functional

**Expected**: Frontend works without backend (degraded mode)

#### Test 5.2: Empty Learning Data

- [ ] Clear backend database (or use fresh user)
- [ ] Start wizard with no historical data
- [ ] Verify:
  - Analytics dashboard shows "No analytics data available"
  - Stack cards don't show success predictions
  - Recommendations fall back to rule-based or mock data

**Expected**: Graceful handling of empty data

#### Test 5.3: Session Abandonment

- [ ] Start wizard session
- [ ] Navigate to Step 3
- [ ] Close browser/navigate away
- [ ] Start new session
- [ ] Check backend for abandoned session:
  ```bash
  curl http://localhost:8001/api/vibeforge/analytics/abandoned-sessions?days=1
  ```

**Expected**: Previous session marked as abandoned (if backend implements auto-abandonment)

### Phase 6: Performance Testing

#### Test 6.1: Analytics Loading Performance

- [ ] Open browser DevTools > Network tab
- [ ] Load analytics dashboard
- [ ] Measure:
  - Time to first render
  - API response times
  - Total load time
- [ ] Target: < 2 seconds for full dashboard load

#### Test 6.2: Wizard Responsiveness

- [ ] Navigate through all 5 wizard steps
- [ ] Measure step transition times
- [ ] Verify no blocking operations
- [ ] Target: < 100ms for step transitions

### Phase 7: Data Integrity Validation

#### Test 7.1: Verify Database Entries

After completing a project:

```bash
# Connect to DataForge database
# PostgreSQL example:
psql -d dataforge -c "SELECT * FROM vibeforge_projects ORDER BY created_at DESC LIMIT 1;"
psql -d dataforge -c "SELECT * FROM project_sessions ORDER BY created_at DESC LIMIT 1;"
psql -d dataforge -c "SELECT * FROM stack_outcomes ORDER BY created_at DESC LIMIT 1;"
```

Verify:

- [ ] Project record created with correct data
- [ ] Session record with all tracking data:
  - `languages_considered`
  - `stacks_compared`
  - `steps_completed`
  - `duration` (seconds)
- [ ] Stack outcome record with:
  - Final stack selection
  - Success metrics

#### Test 7.2: Analytics Calculations

After 5+ projects:

```bash
# Check stack success rate calculation
curl http://localhost:8001/api/vibeforge/analytics/stack-success-rates
```

Verify:

- [ ] Success rates calculated correctly (successful_projects / total_projects)
- [ ] Average metrics accurate (build_time, test_pass_rate, satisfaction)
- [ ] Total uses count matches project count

### Phase 8: Integration Testing

#### Test 8.1: Full Wizard Flow (Happy Path)

Complete end-to-end flow:

1. [ ] Step 1: Enter project intent
2. [ ] Step 2: Select 2 languages (view learning recommendations)
3. [ ] Step 3: Select stack (view success predictions)
4. [ ] Step 4: Configure settings
5. [ ] Step 5: Review and generate
6. [ ] Verify project created successfully
7. [ ] Check analytics dashboard reflects new project

**Expected**: Seamless flow with all learning features active

#### Test 8.2: Multi-Session Testing

Complete 3 consecutive projects:

- [ ] Project A: Web app with TypeScript + T3 Stack
- [ ] Project B: API with Python + FastAPI
- [ ] Project C: Web app with TypeScript + Next.js

After each project:

- [ ] Verify analytics update
- [ ] Verify recommendations improve
- [ ] Verify success predictions refine

**Expected**: Learning layer improves recommendations over time

## Success Criteria

### Core Functionality (Must Pass)

- [x] All 8 tasks in Phase 3 completed
- [ ] Project creation with learning tracking works
- [ ] Session lifecycle (start, update, complete) functional
- [ ] Analytics dashboard displays real data
- [ ] Adaptive recommendations use historical data
- [ ] Success predictions show on stack cards
- [ ] Backend integration stable (no errors in happy path)

### User Experience (Should Pass)

- [ ] Learning recommendations feel helpful
- [ ] Success predictions are accurate (>80% match historical data)
- [ ] Dashboard provides actionable insights
- [ ] Error states handled gracefully
- [ ] Performance meets targets (<2s load, <100ms transitions)

### Data Quality (Should Pass)

- [ ] Tracking data accurate (languages, stacks, steps)
- [ ] Analytics calculations correct
- [ ] No data loss or corruption
- [ ] Session abandonment handled properly

## Troubleshooting

### Issue: Analytics dashboard shows empty

**Check**:

- Backend running on port 8001?
- Database has data? (`SELECT COUNT(*) FROM vibeforge_projects;`)
- CORS enabled on backend?
- Network tab shows successful API calls?

### Issue: Recommendations not appearing

**Check**:

- `stackSuccessRates` store populated? (console: `learningStore.subscribe(console.log)`)
- Learning data fetched? (Network tab: `/api/vibeforge/analytics/stack-success-rates`)
- Any console errors?

### Issue: Session not completing

**Check**:

- Project ID and Session ID set? (console logs)
- `/sessions/{id}/complete` endpoint returns 200?
- Request body includes all required fields?

### Issue: Success predictions not showing

**Check**:

- `stackSuccessRates` array has matching `stack_id`?
- Stack ID matches between frontend and backend? (case-sensitive)
- Console logs show `successData` for stack cards?

## Test Data Generator

To generate test data for analytics:

```bash
cd ../DataForge/scripts
python generate_test_learning_data.py --projects 20 --stacks 5 --users 3
```

This creates realistic test data for:

- 20 projects across 3 users
- 5 different stacks
- Varied outcomes (success/failure)
- Realistic metrics (build times, test pass rates, satisfaction scores)

## Reporting

After completing all tests, document:

1. **Pass Rate**: X/Y tests passed
2. **Critical Issues**: Any blockers or must-fix bugs
3. **Performance Metrics**: Load times, response times
4. **User Experience Notes**: Qualitative feedback on learning features
5. **Next Steps**: Recommendations for Phase 4 (if applicable)

---

**Phase 3 Status**: 87.5% Complete (7/8 tasks)
**Last Updated**: 2025-01-XX
**Tester**: [Your Name]
**Environment**: Development (Local)
