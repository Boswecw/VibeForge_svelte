# Phase 4: Advanced Intelligence - Implementation Plan

## Overview

**Phase**: Advanced Intelligence
**Status**: Planning
**Estimated Duration**: 4-6 weeks
**Start Date**: December 1, 2025
**Prerequisites**: ✅ Phases 1-3 + Phase 2.7 Complete

---

## Vision

Transform VibeForge from a personalized learning system into an advanced intelligence platform that provides:
- **Team-wide insights** across organizations
- **Predictive analytics** for project success
- **Intelligent model routing** for optimal AI assistance
- **Real-time adaptation** based on live metrics
- **Cross-project intelligence** for technology trend analysis

---

## Current State (As of Phase 3.7 + 2.7)

### ✅ What We Have

1. **DataForge (Long-term Memory)**:
   - PostgreSQL database with 5 core tables
   - Historical project data storage
   - Session logging and tracking
   - Outcome metrics collection
   - 95%+ test coverage

2. **NeuroForge (Reasoning Engine)**:
   - LLM-powered stack recommendations
   - Historical context integration
   - Weighted scoring algorithms
   - Explainable AI reasoning
   - Success prediction (6-factor model)

3. **VibeForge (User Interface)**:
   - Complete 5-step wizard
   - Runtime detection system
   - Dev environment management
   - Analytics dashboard with trends
   - Real-time data visualization

4. **Infrastructure**:
   - FastAPI backend (VibeForge + DataForge)
   - SvelteKit frontend (Tauri desktop app)
   - PostgreSQL for persistence
   - Caching layer (5-minute TTL)
   - Structured logging

### 🎯 What We Need

Phase 4 extends the learning system with:
1. **Multi-user intelligence** (beyond single-user personalization)
2. **Advanced ML models** (beyond simple weighted scoring)
3. **Dynamic model selection** (beyond fixed LLM usage)
4. **Streaming analytics** (beyond batch processing)
5. **Ecosystem insights** (beyond individual projects)

---

## Architecture

### New Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        VibeForge UI Layer                        │
│  • Team Dashboard (new)                                          │
│  • Predictive Insights Panel (new)                              │
│  • Technology Trends View (new)                                 │
│  • Model Performance Monitor (new)                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NeuroForge Intelligence Layer                 │
│  • Team Learning Aggregator (new)                               │
│  • Advanced Prediction Engine (new)                             │
│  • Model Router (new)                                           │
│  • Stream Processor (new)                                       │
│  • Pattern Analyzer (new)                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                         DataForge Layer                          │
│  • Team/Org tables (new)                                        │
│  • Model performance metrics (new)                              │
│  • Cross-project patterns (new)                                 │
│  • Technology trends (new)                                      │
│  • Real-time events stream (new)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Milestone Breakdown

### Milestone 4.1: Team & Organization Learning 👥

**Duration**: 5-7 days
**Goal**: Enable multi-user intelligence and team-wide insights

#### Database Schema Extensions

**New Tables**:

1. **teams**:
   ```sql
   CREATE TABLE teams (
     id UUID PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     description TEXT,
     created_at TIMESTAMP DEFAULT NOW(),
     settings JSONB DEFAULT '{}'
   );
   ```

2. **team_members**:
   ```sql
   CREATE TABLE team_members (
     team_id UUID REFERENCES teams(id),
     user_id VARCHAR(255),
     role VARCHAR(50), -- 'admin', 'member', 'viewer'
     joined_at TIMESTAMP DEFAULT NOW(),
     PRIMARY KEY (team_id, user_id)
   );
   ```

3. **team_projects**:
   ```sql
   CREATE TABLE team_projects (
     project_id UUID REFERENCES projects(id),
     team_id UUID REFERENCES teams(id),
     visibility VARCHAR(20) DEFAULT 'team', -- 'team', 'org', 'public'
     PRIMARY KEY (project_id, team_id)
   );
   ```

4. **org_settings**:
   ```sql
   CREATE TABLE org_settings (
     org_id UUID PRIMARY KEY,
     name VARCHAR(255),
     learning_enabled BOOLEAN DEFAULT true,
     data_sharing_level VARCHAR(20) DEFAULT 'team', -- 'none', 'team', 'org'
     preferences JSONB DEFAULT '{}'
   );
   ```

#### API Endpoints (DataForge)

**Team Management**:
- `POST /api/teams` - Create team
- `GET /api/teams/{team_id}` - Get team details
- `PUT /api/teams/{team_id}` - Update team
- `POST /api/teams/{team_id}/members` - Add member
- `DELETE /api/teams/{team_id}/members/{user_id}` - Remove member
- `GET /api/teams/{team_id}/projects` - List team projects

**Aggregated Insights**:
- `GET /api/teams/{team_id}/insights` - Team-wide patterns
- `GET /api/teams/{team_id}/popular-stacks` - Most used stacks
- `GET /api/teams/{team_id}/success-metrics` - Aggregate success rates
- `GET /api/teams/{team_id}/recommendations` - Team-informed suggestions

#### NeuroForge Integration

**Team Learning Aggregator** (`team_learning.py`):

```python
class TeamLearningAggregator:
    """Aggregates learning across team members."""

    async def get_team_context(self, team_id: str) -> TeamContext:
        """Build historical context from team's projects."""

    async def get_popular_choices(self, team_id: str) -> PopularChoices:
        """Identify most common stack/language selections."""

    async def calculate_team_success_patterns(self, team_id: str) -> SuccessPatterns:
        """Analyze what works best for the team."""

    async def get_team_recommendations(
        self,
        team_id: str,
        user_context: dict
    ) -> TeamRecommendations:
        """Generate recommendations informed by team patterns."""
```

**Key Features**:
- Weighted by project outcomes (successful projects influence more)
- Privacy-respecting (configurable data sharing levels)
- Individual + team blending (70% personal, 30% team by default)

#### UI Components (VibeForge)

1. **Team Dashboard** (`TeamDashboard.svelte`):
   - Team members list
   - Recent projects
   - Popular stacks visualization
   - Success metrics overview
   - Team insights panel

2. **Team Insights Widget** (wizard integration):
   - "Your team often uses..." recommendations
   - Success rate badges from team history
   - Optional team context toggle

#### Deliverables

- [ ] 4 new database tables + migrations
- [ ] 6 team management API endpoints
- [ ] 4 aggregated insights endpoints
- [ ] Team learning aggregator module
- [ ] Team dashboard UI component
- [ ] Wizard team insights integration
- [ ] E2E tests for team workflows
- [ ] Documentation

**Success Criteria**:
- Teams can be created and managed
- Team recommendations differ from individual recommendations
- Team insights visible in wizard
- 90%+ test coverage

---

### Milestone 4.2: Advanced Predictive Analytics 📊

**Duration**: 5-7 days
**Goal**: ML-based success prediction and risk assessment

#### Current Prediction System (Phase 3.6)

**Existing**:
- 6-factor weighted algorithm
- Simple linear scoring
- No ML training
- Static weights

**Factors**:
1. Team/Org Learning Experience (30%)
2. Historical Success Rate (25%)
3. Stack Maturity (15%)
4. Language Popularity (10%)
5. Complexity Match (10%)
6. Community Support (10%)

#### Enhanced Prediction Engine

**New Capabilities**:

1. **Feature Engineering**:
   - Project complexity score (derived from selections)
   - Developer experience level (from user profile)
   - Stack freshness score (time-based)
   - Cross-technology synergy scores
   - Historical failure pattern matching

2. **ML Models**:
   - **Logistic Regression** (baseline)
   - **Random Forest** (ensemble method)
   - **Gradient Boosting** (XGBoost/LightGBM)
   - **Neural Network** (optional, if dataset large enough)

3. **Training Pipeline**:
   ```python
   class PredictionModelTrainer:
       """Trains ML models on historical project outcomes."""

       async def prepare_training_data(self) -> pd.DataFrame:
           """Fetch and preprocess historical data."""

       def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
           """Create derived features."""

       def train_models(self, X_train, y_train) -> dict[str, Model]:
           """Train multiple models and compare."""

       def evaluate_models(self, X_test, y_test) -> ModelMetrics:
           """Evaluate on holdout set."""

       async def deploy_best_model(self, model: Model):
           """Save and deploy winning model."""
   ```

4. **Risk Assessment**:
   - Low risk (80%+ predicted success)
   - Medium risk (60-80%)
   - High risk (40-60%)
   - Very high risk (<40%)

   With actionable suggestions for high-risk projects.

#### Database Extensions

**New Table**:

```sql
CREATE TABLE model_versions (
  id UUID PRIMARY KEY,
  model_type VARCHAR(50), -- 'logistic_regression', 'random_forest', etc.
  version VARCHAR(20),
  metrics JSONB, -- accuracy, precision, recall, f1, auc
  feature_importance JSONB,
  training_date TIMESTAMP,
  deployed BOOLEAN DEFAULT false,
  model_path VARCHAR(500) -- file system path
);
```

#### API Endpoints

**Prediction**:
- `POST /api/predict/success` - Enhanced prediction with ML
- `POST /api/predict/risk-assessment` - Detailed risk analysis
- `GET /api/predict/confidence-breakdown` - Feature contribution

**Model Management** (Admin):
- `POST /api/ml/train` - Trigger model training
- `GET /api/ml/models` - List trained models
- `GET /api/ml/models/{id}/metrics` - Model performance
- `PUT /api/ml/models/{id}/deploy` - Deploy model version

#### UI Enhancements

1. **Prediction Confidence Panel** (Step 5):
   - ML-based success probability
   - Confidence intervals
   - Risk assessment badge
   - Top 3 factors influencing prediction
   - Suggestion list for high-risk projects

2. **Model Performance Dashboard** (Admin):
   - Prediction accuracy over time
   - Feature importance visualization
   - Model comparison metrics
   - Re-training triggers

#### Implementation

**Libraries**:
- **scikit-learn**: ML models (logistic regression, random forest)
- **xgboost** or **lightgbm**: Gradient boosting
- **pandas**: Data manipulation
- **joblib**: Model serialization
- **mlflow** (optional): Experiment tracking

**Training Strategy**:
- Initial training: Batch on all historical data
- Incremental updates: Weekly re-training
- A/B testing: Compare new model vs current
- Fallback: Always keep previous stable model

#### Deliverables

- [ ] Feature engineering pipeline
- [ ] ML model training script
- [ ] 3+ trained models (baseline, ensemble, boosting)
- [ ] Model evaluation framework
- [ ] Model persistence and loading
- [ ] Enhanced prediction API endpoints
- [ ] Risk assessment UI component
- [ ] Model performance dashboard
- [ ] Training automation (cron/scheduled)
- [ ] Documentation

**Success Criteria**:
- ML model outperforms simple weighted scoring
- Prediction accuracy >75% on holdout set
- Risk assessments validated by historical outcomes
- Models can be re-trained without downtime

---

### Milestone 4.3: Intelligent Model Routing 🧠

**Duration**: 4-5 days
**Goal**: Dynamic AI model selection based on task complexity

#### Current State

**Fixed Configuration**:
- NeuroForge always uses Claude 3.5 Sonnet
- No dynamic model selection
- No cost optimization
- No task-aware routing

#### Model Routing Architecture

**Supported Models** (Example):

1. **Fast Models** (Simple tasks):
   - Claude 3 Haiku
   - GPT-3.5 Turbo
   - Gemini Flash

2. **Balanced Models** (Standard tasks):
   - Claude 3.5 Sonnet
   - GPT-4 Turbo
   - Gemini Pro

3. **Advanced Models** (Complex reasoning):
   - Claude Opus
   - GPT-4o
   - O1 (reasoning)

#### Task Classification

**Task Complexity Levels**:

| Complexity | Example Tasks                           | Recommended Models |
| ---------- | --------------------------------------- | ------------------ |
| Simple     | Language compatibility check            | Haiku, GPT-3.5     |
| Simple     | Database selection for stack            | Haiku, GPT-3.5     |
| Medium     | Stack recommendation (basic)            | Sonnet, GPT-4      |
| Medium     | Environment variable suggestions        | Sonnet, GPT-4      |
| Complex    | Multi-stack comparison with reasoning   | Sonnet, GPT-4      |
| Complex    | Architecture pattern recommendations    | Opus, O1           |
| Very High  | Novel technology stack evaluation       | Opus, O1           |

#### Implementation

**Model Router** (`model_router.py`):

```python
class ModelRouter:
    """Routes requests to optimal AI model."""

    def __init__(self, config: RouterConfig):
        self.models = self._init_models(config)
        self.routing_strategy = config.strategy  # 'cost', 'performance', 'balanced'

    async def route_request(
        self,
        task: Task,
        context: dict
    ) -> ModelResponse:
        """Route task to appropriate model."""

        # 1. Classify task complexity
        complexity = self._classify_task(task, context)

        # 2. Select model based on strategy
        model = self._select_model(complexity, self.routing_strategy)

        # 3. Execute request
        response = await self._execute(model, task, context)

        # 4. Log performance metrics
        await self._log_metrics(model, task, response)

        return response

    def _classify_task(self, task: Task, context: dict) -> Complexity:
        """Determine task complexity."""
        # Factors: input length, context size, task type, user history

    def _select_model(self, complexity: Complexity, strategy: str) -> Model:
        """Select model based on complexity and strategy."""
        if strategy == 'cost':
            return self._cheapest_model(complexity)
        elif strategy == 'performance':
            return self._best_model(complexity)
        else:  # balanced
            return self._balanced_model(complexity)
```

#### Database Extensions

**New Table**:

```sql
CREATE TABLE model_metrics (
  id UUID PRIMARY KEY,
  model_name VARCHAR(100),
  task_type VARCHAR(100),
  complexity_level VARCHAR(20),
  response_time_ms INT,
  tokens_used INT,
  cost_usd DECIMAL(10, 6),
  quality_score DECIMAL(3, 2), -- 0-1, from user feedback or auto-eval
  timestamp TIMESTAMP DEFAULT NOW()
);
```

#### API Changes

**Enhanced Endpoints**:
- `POST /api/recommendations/stack` - Now uses model router
- `POST /api/advice/explain` - Routed by complexity
- `GET /api/models/performance` - Model performance metrics
- `PUT /api/settings/routing-strategy` - Change routing strategy

**New Endpoints**:
- `GET /api/models/available` - List available models
- `GET /api/models/metrics/{model_name}` - Model statistics
- `POST /api/models/test` - Test model with custom prompt

#### UI Components

1. **Model Selector** (Settings):
   - Routing strategy toggle (Cost / Balanced / Performance)
   - Available models list
   - Performance comparison chart
   - Cost tracking

2. **Request Inspection** (Debug mode):
   - Show which model was used
   - Response time
   - Token usage
   - Cost estimate

#### Cost Optimization

**Strategies**:

1. **Caching**: Cache common requests (5-15 min TTL)
2. **Batching**: Group similar requests
3. **Downgrading**: Use cheaper model when appropriate
4. **Fallback**: Switch to cheaper model on rate limits

**Expected Savings**:
- 30-50% cost reduction vs always using Sonnet
- <5% accuracy degradation
- Faster response times for simple tasks

#### Deliverables

- [ ] Model router implementation
- [ ] Task complexity classifier
- [ ] Multi-model client integration
- [ ] Model metrics tracking
- [ ] Routing strategy configuration
- [ ] UI for model selection
- [ ] Cost tracking dashboard
- [ ] Performance benchmarks
- [ ] Documentation

**Success Criteria**:
- Multiple models integrated (3+ providers)
- Routing decision latency <10ms
- 30%+ cost reduction vs baseline
- Quality maintained or improved

---

### Milestone 4.4: Real-Time Adaptation & Streaming 📡

**Duration**: 5-7 days
**Goal**: Live metrics processing and real-time insights

#### Current State

**Batch Processing Only**:
- Analytics updated on page load
- No live updates
- No streaming data
- No real-time alerts

#### Streaming Architecture

**Technology Stack**:

| Component               | Technology Options                 |
| ----------------------- | ---------------------------------- |
| Message Broker          | Redis Streams / Apache Kafka       |
| WebSocket Server        | FastAPI WebSockets / Socket.IO     |
| Stream Processing       | Python asyncio / Apache Flink      |
| Time-Series DB (future) | TimescaleDB / InfluxDB (optional)  |

**For Phase 4.4**: Start with **Redis Streams + FastAPI WebSockets + asyncio**

#### Event Types

**User Events**:
- `wizard_step_completed` - User progresses through wizard
- `stack_selected` - Stack choice made
- `project_generated` - Project creation successful
- `project_opened` - User opens previously generated project
- `feedback_submitted` - Outcome feedback provided

**System Events**:
- `prediction_computed` - ML prediction generated
- `model_routed` - Model selection decision
- `cache_hit` / `cache_miss` - Caching events
- `error_occurred` - System errors

**Analytics Events**:
- `popular_stack_trending` - Stack gaining popularity
- `success_rate_changed` - Aggregate success metric updated
- `new_pattern_detected` - Novel usage pattern identified

#### Implementation

**Event Producer** (`event_producer.py`):

```python
class EventProducer:
    """Publishes events to Redis Streams."""

    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    async def publish(self, stream: str, event: Event):
        """Publish event to stream."""
        await self.redis.xadd(
            stream,
            {
                'type': event.type,
                'timestamp': event.timestamp,
                'data': json.dumps(event.data)
            }
        )
```

**Event Consumer** (`event_consumer.py`):

```python
class EventConsumer:
    """Consumes events from Redis Streams."""

    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.handlers: dict[str, Callable] = {}

    def register_handler(self, event_type: str, handler: Callable):
        """Register event handler."""
        self.handlers[event_type] = handler

    async def start_consuming(self, stream: str):
        """Start consuming events."""
        while True:
            messages = await self.redis.xread({stream: '$'}, block=5000)
            for message in messages:
                await self._process_message(message)
```

**WebSocket Manager** (`websocket_manager.py`):

```python
class WebSocketManager:
    """Manages WebSocket connections and broadcasts."""

    def __init__(self):
        self.connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept new WebSocket connection."""

    async def disconnect(self, websocket: WebSocket, user_id: str):
        """Handle disconnection."""

    async def broadcast_to_user(self, user_id: str, message: dict):
        """Send message to specific user."""

    async def broadcast_to_team(self, team_id: str, message: dict):
        """Send message to all team members."""
```

#### API Endpoints

**WebSocket**:
- `WS /api/ws/events/{user_id}` - User-specific event stream
- `WS /api/ws/team/{team_id}` - Team event stream
- `WS /api/ws/analytics` - Global analytics stream (admin)

**REST (Event Management)**:
- `POST /api/events/track` - Track custom event
- `GET /api/events/recent` - Recent events (fallback for no WebSocket)

#### Real-Time Insights

**Live Updates**:

1. **Wizard Progress** (Step indicators):
   - "12 users currently on Step 3"
   - "FastAPI selected 45 times today"

2. **Trending Stacks** (Real-time badges):
   - "🔥 Trending Now" badge
   - "⬆️ +15% today" popularity indicator

3. **Team Activity** (Team dashboard):
   - "Sarah just created a SvelteKit project"
   - "Team success rate improved to 87%"

4. **Live Predictions** (Step 5):
   - Prediction updates as config changes
   - Live confidence score

#### UI Components

1. **Live Activity Feed** (`LiveActivityFeed.svelte`):
   - Real-time event stream
   - Filterable by event type
   - Collapsible widget

2. **WebSocket Connection Manager** (`WebSocketClient.ts`):
   ```typescript
   class WebSocketClient {
     private ws: WebSocket | null = null;

     connect(userId: string): void {
       this.ws = new WebSocket(`ws://localhost:8000/api/ws/events/${userId}`);
       this.ws.onmessage = this.handleMessage.bind(this);
     }

     handleMessage(event: MessageEvent): void {
       const data = JSON.parse(event.data);
       // Dispatch Svelte store update
     }
   }
   ```

3. **Live Metrics Component** (Analytics dashboard):
   - Updates automatically without refresh
   - Smooth animations for metric changes

#### Deliverables

- [ ] Redis Streams integration
- [ ] Event producer implementation
- [ ] Event consumer with handlers
- [ ] WebSocket server setup
- [ ] WebSocket client (TypeScript)
- [ ] Live activity feed component
- [ ] Real-time wizard updates
- [ ] Live analytics dashboard
- [ ] Connection management (reconnection logic)
- [ ] Documentation

**Success Criteria**:
- WebSocket connections stable
- Events delivered <100ms latency
- UI updates smoothly with live data
- Graceful handling of disconnections

---

### Milestone 4.5: Cross-Project Pattern Insights 🔍

**Duration**: 4-5 days
**Goal**: Ecosystem-wide technology trend analysis

#### Overview

Aggregate insights across **all projects** (not just user/team):
- Technology adoption trends
- Emerging stack combinations
- Success patterns by domain
- Community preferences

#### Database Extensions

**New Tables**:

```sql
CREATE TABLE technology_trends (
  id UUID PRIMARY KEY,
  technology_name VARCHAR(100), -- 'SvelteKit', 'FastAPI', etc.
  category VARCHAR(50), -- 'framework', 'language', 'database', etc.
  usage_count INT DEFAULT 0,
  success_rate DECIMAL(5, 2),
  trend_direction VARCHAR(10), -- 'up', 'down', 'stable'
  trend_percentage DECIMAL(5, 2), -- +15.3% this month
  aggregated_at TIMESTAMP
);

CREATE TABLE stack_combinations (
  id UUID PRIMARY KEY,
  technologies JSONB, -- ['SvelteKit', 'FastAPI', 'PostgreSQL']
  usage_count INT DEFAULT 0,
  avg_success_rate DECIMAL(5, 2),
  avg_complexity DECIMAL(3, 2),
  first_seen TIMESTAMP,
  last_seen TIMESTAMP
);

CREATE TABLE domain_patterns (
  id UUID PRIMARY KEY,
  domain VARCHAR(100), -- 'e-commerce', 'blog', 'saas', etc.
  popular_stacks JSONB,
  average_languages_count INT,
  success_metrics JSONB,
  sample_size INT
);
```

#### Aggregation Pipeline

**Pattern Analyzer** (`pattern_analyzer.py`):

```python
class CrossProjectPatternAnalyzer:
    """Analyzes patterns across all projects."""

    async def compute_technology_trends(self, time_window: str = '30d'):
        """Calculate trending technologies."""
        # Query projects from last 30 days vs previous 30 days
        # Calculate usage_count, success_rate, trend_direction

    async def identify_stack_combinations(self):
        """Find common stack combinations."""
        # Group projects by technology sets
        # Calculate success rates per combination

    async def analyze_domain_patterns(self):
        """Identify patterns by project domain."""
        # Group by project type
        # Aggregate popular choices

    async def detect_emerging_technologies(self):
        """Identify new technologies gaining traction."""
        # Technologies with increasing usage over time
```

**Scheduled Jobs**:
- Hourly: Update technology usage counts
- Daily: Recompute trends and patterns
- Weekly: Full pattern re-analysis

#### API Endpoints

**Public Insights**:
- `GET /api/insights/trending` - Trending technologies
- `GET /api/insights/popular-combinations` - Common stack combos
- `GET /api/insights/domain-patterns` - Patterns by project type
- `GET /api/insights/emerging` - Emerging technologies
- `GET /api/insights/technology/{name}` - Detailed tech stats

**Comparison**:
- `POST /api/insights/compare-stacks` - Compare 2-3 stacks
- `POST /api/insights/success-prediction` - Predict based on historical data

#### UI Components

1. **Technology Trends Dashboard** (`TrendsDashboard.svelte`):
   - Trending technologies chart (line graph)
   - Top 10 most used stacks
   - Emerging technologies list
   - Success rate heatmap

2. **Stack Combination Explorer** (`StackCombinations.svelte`):
   - Popular combinations grid
   - Success rate badges
   - "Try this combo" suggestions
   - Filter by domain

3. **Domain Insights** (Wizard Step 1 enhancement):
   - Show popular stacks for selected project type
   - "E-commerce projects typically use..." insight

4. **Ecosystem Overview** (Admin dashboard):
   - Total projects generated
   - Active users
   - Technology adoption timeline
   - Global success metrics

#### Privacy & Ethics

**Considerations**:

1. **Anonymization**: No user-identifiable data in public insights
2. **Opt-out**: Users can exclude projects from global aggregation
3. **Aggregation Threshold**: Only show patterns with 10+ samples
4. **Transparency**: Clearly label insights as "crowd-sourced"

**Settings** (`org_settings.data_sharing_level`):
- `'none'`: Don't contribute to global insights
- `'team'`: Share within team only
- `'org'`: Share within organization
- `'public'` (default): Contribute to global insights (anonymously)

#### Deliverables

- [ ] 3 new database tables + migrations
- [ ] Pattern analyzer implementation
- [ ] Scheduled aggregation jobs
- [ ] 5 public insights API endpoints
- [ ] Technology trends dashboard
- [ ] Stack combination explorer
- [ ] Domain insights integration (wizard)
- [ ] Privacy settings UI
- [ ] Documentation

**Success Criteria**:
- Trends updated within 1 hour of new data
- Insights accurate and actionable
- Privacy controls functional
- UI performant with large datasets

---

## Testing Strategy

### Unit Tests
- **Target**: 90%+ coverage for new code
- **Tools**: pytest (Python), Vitest (TypeScript)
- **Focus**: Core business logic, calculations, transformations

### Integration Tests
- **Scope**: API endpoints, database operations, external services
- **Tools**: pytest-asyncio, httpx
- **Focus**: Multi-component interactions

### E2E Tests
- **Scope**: Complete user workflows with new features
- **Tools**: Playwright
- **Scenarios**:
  - Team creation and member management
  - ML prediction with risk assessment
  - Real-time updates in wizard
  - Live analytics dashboard

### Performance Tests
- **Metrics**:
  - API response time <200ms p95
  - WebSocket message latency <100ms
  - ML prediction time <500ms
  - Dashboard render time <1s

---

## Deployment Plan

### Phase 4.1-4.2: Database Changes
1. Run migrations on staging
2. Backfill team data (if any)
3. Verify data integrity
4. Deploy to production

### Phase 4.3: Model Router
1. Deploy new models to model registry
2. A/B test model router (10% traffic)
3. Monitor cost and performance
4. Gradual rollout to 100%

### Phase 4.4: Real-Time Streaming
1. Deploy Redis Streams on staging
2. Test WebSocket connections under load
3. Deploy WebSocket server
4. Enable real-time features for beta users
5. Full rollout after stability confirmation

### Phase 4.5: Pattern Insights
1. Run initial aggregation job on historical data
2. Deploy insights APIs
3. Enable insights dashboard
4. Monitor aggregation job performance

---

## Risks & Mitigations

| Risk                           | Impact | Likelihood | Mitigation                                      |
| ------------------------------ | ------ | ---------- | ----------------------------------------------- |
| Insufficient data for ML       | High   | Medium     | Use synthetic data, longer data collection      |
| WebSocket stability issues     | Medium | Medium     | Thorough testing, fallback to polling           |
| Privacy concerns               | High   | Low        | Strong anonymization, clear opt-out             |
| Model routing cost overruns    | Medium | Low        | Aggressive caching, cost monitoring             |
| Real-time performance problems | Medium | Medium     | Load testing, horizontal scaling of event queue |
| Team feature adoption low      | Low    | Medium     | Good UX, clear value proposition                |

---

## Success Metrics

### Quantitative
- **Team Adoption**: 30%+ of users create/join teams by end of phase
- **ML Accuracy**: Prediction accuracy >75% on holdout set
- **Cost Reduction**: 30%+ reduction via model routing
- **Latency**: WebSocket events <100ms p95
- **Uptime**: 99.5%+ for real-time features

### Qualitative
- **User Feedback**: Positive sentiment on team features
- **Insight Utility**: Users find trends/patterns useful
- **Prediction Trust**: Users trust ML predictions
- **Performance**: No user complaints about lag/delays

---

## Timeline

| Week | Milestones                      | Focus                                |
| ---- | ------------------------------- | ------------------------------------ |
| 1    | 4.1 (Team Learning)             | Database schema, team APIs, UI       |
| 2    | 4.2 (Predictive Analytics)      | ML training, feature engineering     |
| 3    | 4.3 (Model Routing)             | Multi-model integration, router      |
| 4    | 4.4 (Real-Time Streaming)       | WebSockets, event processing         |
| 5    | 4.5 (Cross-Project Insights)    | Pattern analysis, trends dashboard   |
| 6    | Testing, Polish, Documentation  | E2E tests, performance tuning, docs  |

**Total**: 6 weeks (4-6 weeks estimated in roadmap)

---

## Documentation Deliverables

- [ ] Phase 4 implementation guide (this document)
- [ ] Team management user guide
- [ ] ML prediction technical docs
- [ ] Model routing configuration guide
- [ ] WebSocket API reference
- [ ] Insights API documentation
- [ ] Admin dashboard guide
- [ ] Privacy & data sharing policy

---

## Next Steps

1. **Review & Approval**: Team review of this plan
2. **Kick-off**: Phase 4 launch meeting
3. **Sprint Planning**: Break milestones into 2-week sprints
4. **Begin 4.1**: Team & Organization Learning implementation

---

**Document Version**: 1.0
**Created**: December 1, 2025
**Author**: Claude (AI Assistant) + Charles
**Status**: Draft - Awaiting Review
