# Phase 3.4 Database Schema - Outcome Tracking

**Date:** November 30, 2025
**Phase:** 3.4 - Outcome Tracking & Feedback Loop
**Status:** Design Complete

---

## Overview

Database schema for tracking project outcomes, user feedback, and pattern success metrics to enable adaptive learning through the NeuroForge integration.

---

## Tables

### 1. `project_outcomes`

Tracks metadata and lifecycle status of scaffolded projects.

```sql
CREATE TABLE project_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Project Metadata
  project_name VARCHAR(255) NOT NULL,
  project_path TEXT NOT NULL,
  pattern_id VARCHAR(50) NOT NULL,
  pattern_name VARCHAR(100) NOT NULL,

  -- Scaffolding Details
  components_generated TEXT[], -- Array of component names
  files_created INTEGER NOT NULL DEFAULT 0,
  languages_used TEXT[], -- ['TypeScript', 'Python', 'Rust']
  dependencies_installed TEXT[], -- ['npm', 'cargo', 'pip']

  -- Project Health
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'deleted'
  last_build_status VARCHAR(20), -- 'success', 'failure', null
  last_build_timestamp TIMESTAMPTZ,
  test_pass_rate DECIMAL(5,2), -- Percentage (0-100)
  deployment_status VARCHAR(20), -- 'deployed', 'staging', 'local', null

  -- User Information
  user_id UUID, -- Future: link to user accounts
  workspace_id UUID, -- Future: multi-workspace support

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'archived', 'deleted')),
  CONSTRAINT valid_build_status CHECK (last_build_status IN ('success', 'failure') OR last_build_status IS NULL),
  CONSTRAINT valid_test_rate CHECK (test_pass_rate >= 0 AND test_pass_rate <= 100)
);

-- Indexes
CREATE INDEX idx_project_outcomes_pattern ON project_outcomes(pattern_id);
CREATE INDEX idx_project_outcomes_status ON project_outcomes(status);
CREATE INDEX idx_project_outcomes_created ON project_outcomes(created_at DESC);
CREATE INDEX idx_project_outcomes_user ON project_outcomes(user_id) WHERE user_id IS NOT NULL;
```

---

### 2. `user_feedback`

Collects post-scaffolding ratings and user satisfaction data.

```sql
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  project_outcome_id UUID NOT NULL REFERENCES project_outcomes(id) ON DELETE CASCADE,

  -- Ratings (1-5 scale)
  overall_satisfaction SMALLINT NOT NULL CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
  pattern_usefulness SMALLINT CHECK (pattern_usefulness >= 1 AND pattern_usefulness <= 5),
  code_quality SMALLINT CHECK (code_quality >= 1 AND code_quality <= 5),
  documentation_clarity SMALLINT CHECK (documentation_clarity >= 1 AND documentation_clarity <= 5),
  setup_ease SMALLINT CHECK (setup_ease >= 1 AND setup_ease <= 5),

  -- Qualitative Feedback
  positive_aspects TEXT[], -- Multi-select: ['fast', 'clean-code', 'good-docs', 'easy-setup']
  negative_aspects TEXT[], -- Multi-select: ['slow', 'buggy', 'poor-docs', 'complex']
  additional_comments TEXT,

  -- Feature Requests
  would_recommend BOOLEAN,
  likelihood_to_reuse SMALLINT CHECK (likelihood_to_reuse >= 1 AND likelihood_to_reuse <= 10), -- NPS scale
  feature_requests TEXT[],

  -- Context
  time_to_first_build INTEGER, -- Seconds from scaffolding to first successful build
  encountered_errors BOOLEAN DEFAULT FALSE,
  error_details JSONB, -- { "type": "dependency", "message": "...", "resolved": true }

  -- Metadata
  feedback_source VARCHAR(20) DEFAULT 'modal', -- 'modal', 'dashboard', 'email'
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_nps CHECK (likelihood_to_reuse >= 1 AND likelihood_to_reuse <= 10)
);

-- Indexes
CREATE INDEX idx_user_feedback_project ON user_feedback(project_outcome_id);
CREATE INDEX idx_user_feedback_satisfaction ON user_feedback(overall_satisfaction DESC);
CREATE INDEX idx_user_feedback_submitted ON user_feedback(submitted_at DESC);
CREATE INDEX idx_user_feedback_recommend ON user_feedback(would_recommend) WHERE would_recommend IS NOT NULL;
```

---

### 3. `pattern_analytics` (Aggregated View)

Materialized view for fast pattern performance queries.

```sql
CREATE MATERIALIZED VIEW pattern_analytics AS
SELECT
  po.pattern_id,
  po.pattern_name,

  -- Usage Metrics
  COUNT(DISTINCT po.id) AS total_projects,
  COUNT(DISTINCT po.id) FILTER (WHERE po.created_at >= NOW() - INTERVAL '30 days') AS projects_last_30_days,
  COUNT(DISTINCT po.id) FILTER (WHERE po.created_at >= NOW() - INTERVAL '7 days') AS projects_last_7_days,

  -- Health Metrics
  COUNT(*) FILTER (WHERE po.last_build_status = 'success') AS successful_builds,
  COUNT(*) FILTER (WHERE po.last_build_status = 'failure') AS failed_builds,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE po.last_build_status = 'success') /
    NULLIF(COUNT(*) FILTER (WHERE po.last_build_status IS NOT NULL), 0),
    2
  ) AS build_success_rate,

  -- Feedback Metrics
  COUNT(DISTINCT uf.id) AS feedback_count,
  ROUND(AVG(uf.overall_satisfaction), 2) AS avg_satisfaction,
  ROUND(AVG(uf.pattern_usefulness), 2) AS avg_usefulness,
  ROUND(AVG(uf.likelihood_to_reuse), 2) AS avg_nps,
  COUNT(*) FILTER (WHERE uf.would_recommend = TRUE) AS recommendation_count,

  -- Time Metrics
  ROUND(AVG(uf.time_to_first_build) / 60.0, 2) AS avg_time_to_build_minutes,

  -- Last Updated
  MAX(po.updated_at) AS last_activity

FROM project_outcomes po
LEFT JOIN user_feedback uf ON uf.project_outcome_id = po.id
GROUP BY po.pattern_id, po.pattern_name;

-- Index for fast lookups
CREATE UNIQUE INDEX idx_pattern_analytics_pattern ON pattern_analytics(pattern_id);

-- Refresh policy (run daily or on-demand)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY pattern_analytics;
```

---

## API Endpoints (VibeForge → DataForge)

### Project Outcomes

**POST `/api/outcomes`**
- Create new project outcome after scaffolding
- Body: `{ project_name, project_path, pattern_id, components_generated, files_created, languages_used }`

**GET `/api/outcomes`**
- List all project outcomes (paginated)
- Query params: `?status=active&pattern_id=rest-api&limit=20&offset=0`

**GET `/api/outcomes/:id`**
- Get single project outcome with full details

**PATCH `/api/outcomes/:id`**
- Update project health (build status, test results)
- Body: `{ last_build_status, test_pass_rate, deployment_status }`

**DELETE `/api/outcomes/:id`**
- Soft delete (set status = 'deleted')

---

### User Feedback

**POST `/api/feedback`**
- Submit feedback after scaffolding
- Body: `{ project_outcome_id, overall_satisfaction, pattern_usefulness, would_recommend, ... }`

**GET `/api/feedback`**
- List all feedback (admin/analytics)
- Query params: `?project_outcome_id=<uuid>&limit=20`

---

### Analytics

**GET `/api/analytics/patterns`**
- Get aggregated pattern performance metrics
- Response: Array of pattern analytics with success rates, NPS, recommendations

**GET `/api/analytics/patterns/:pattern_id`**
- Get detailed analytics for specific pattern
- Response: Full metrics + recent feedback + trend data

**GET `/api/analytics/trends`**
- Get time-series data for dashboard charts
- Query params: `?metric=satisfaction&period=30d`

---

## Data Flow

```
1. User scaffolds project
   ↓
2. VibeForge creates project_outcome record
   ↓
3. User receives feedback modal prompt (5min delay)
   ↓
4. User submits feedback → user_feedback record created
   ↓
5. Dashboard displays projects + aggregated analytics
   ↓
6. NeuroForge reads pattern_analytics for recommendations
   ↓
7. Future scaffolding uses historical data for suggestions
```

---

## Future Enhancements

1. **Build/Test Integration**
   - Webhook endpoints for CI/CD status updates
   - Automatic health tracking via file watchers
   - Git commit frequency tracking

2. **User Accounts**
   - Link outcomes to authenticated users
   - Multi-workspace support
   - Team analytics

3. **Advanced Analytics**
   - Pattern popularity trends over time
   - Language combination success rates
   - Deployment platform correlations

4. **ML Training Data**
   - Export feedback for model training
   - Pattern success prediction
   - Personalized recommendations

---

**© 2025 Boswell Digital Solutions LLC**
**All Rights Reserved**
