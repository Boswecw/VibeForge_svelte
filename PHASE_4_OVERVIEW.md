# Phase 4: Advanced Intelligence - Overview

**Status**: 🚧 **IN PROGRESS** (0%)  
**Start Date**: November 23, 2025  
**Estimated Duration**: 4-6 weeks  
**Prerequisites**: Phase 2.7 ✅, Phase 3 ✅

---

## Executive Summary

Phase 4 transforms VibeForge into an **intelligent AI-powered development assistant** by integrating multiple LLM providers, implementing advanced code analysis, building predictive analytics, and creating an intelligent model routing system. This phase bridges the gap between static recommendations and dynamic, context-aware guidance powered by large language models.

### Key Objectives

🎯 **LLM Integration**: Support multiple providers (OpenAI, Anthropic, Ollama, custom)  
🎯 **Intelligent Recommendations**: AI-powered stack selection with explanations  
🎯 **Code Analysis**: Analyze existing projects to generate profiles  
🎯 **Smart Routing**: Automatically select optimal model for each task  
🎯 **Predictive Analytics**: Forecast project success and technology trends

---

## Architecture Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                    VibeForge Frontend (Svelte)                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Wizard (Enhanced)│  │ Analytics        │  │ Code Analysis │ │
│  │ • AI suggestions │  │ Dashboard        │  │ UI            │ │
│  │ • Model selector │  │ • Predictions    │  │ • Upload repo │ │
│  │ • Explanations   │  │ • Trends         │  │ • View report │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              LLM Orchestration Layer (Python)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Model Router (intelligence.ts / llm_service.py)          │  │
│  │ • Provider abstraction (OpenAI, Anthropic, Ollama)       │  │
│  │ • Task classification (simple, moderate, complex)        │  │
│  │ • Cost/latency optimization                              │  │
│  │ • Streaming support                                      │  │
│  │ • Token counting & rate limiting                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Recommendation Engine (stack_advisor_llm.py)             │  │
│  │ • Historical context injection                           │  │
│  │ • Prompt engineering (Few-shot, Chain-of-Thought)        │  │
│  │ • Scoring algorithm (LLM + empirical)                    │  │
│  │ • Explanation generation                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Code Analysis Layer (Tauri/Rust)               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Analysis Service (backend-rs/src/services/analyzer.rs)   │  │
│  │ • Language detection (tree-sitter)                       │  │
│  │ • Framework identification (package.json, requirements)  │  │
│  │ • Dependency analysis                                    │  │
│  │ • Project structure profiling                            │  │
│  │ • LOC, complexity metrics                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                DataForge (PostgreSQL + Analytics)                │
│  • LLM usage tracking (provider, model, tokens, cost)           │
│  • Model performance metrics (latency, accuracy)                │
│  • A/B testing results                                          │
│  • Prediction accuracy over time                                │
│  • Technology trend analysis                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Milestone Breakdown

### Milestone 4.1: LLM Provider Integration (Week 1) - 0%

**Duration**: 1 week  
**Priority**: Critical (Foundation for all other milestones)

#### Components

**1. Provider Abstraction Layer** (`src/lib/services/llm/`)

- `BaseLLMProvider.ts` - Abstract interface
- `OpenAIProvider.ts` - OpenAI implementation
- `AnthropicProvider.ts` - Claude implementation
- `OllamaProvider.ts` - Local models support
- `CustomProvider.ts` - Generic HTTP provider

**Features**:

- Unified API: `chat()`, `stream()`, `countTokens()`, `getModels()`
- Automatic retry with exponential backoff
- Token counting (tiktoken for OpenAI, custom for others)
- Cost estimation per request
- Rate limiting per provider
- Error handling with fallbacks

**2. Configuration Management**

```typescript
interface LLMConfig {
  provider: "openai" | "anthropic" | "ollama" | "custom";
  apiKey?: string;
  baseUrl?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}
```

**3. Provider Selection UI**

- Settings page: Configure API keys, base URLs
- Model selector dropdown (filtered by provider)
- Cost calculator showing estimated token usage
- Test connection button with real API call

**Deliverables**:

- ✅ 5 provider implementations
- ✅ Provider factory pattern
- ✅ Configuration persistence (localStorage + backend)
- ✅ Provider selection UI component
- ✅ Integration tests with mock providers

---

### Milestone 4.2: Stack Recommendation Engine (Week 1-2) - 0%

**Duration**: 5-7 days  
**Priority**: High (Core intelligence feature)

#### Architecture

**Hybrid Scoring System**:

```
final_score = (
  llm_reasoning_score * 0.40 +      // AI-generated insights
  empirical_success_rate * 0.30 +   // Historical outcomes
  language_compatibility * 0.15 +   // Technical constraints
  user_preference * 0.10 +          // Personal history
  project_type_match * 0.05         // Category fit
)
```

#### LLM Prompt Engineering

**System Prompt Template**:

```
You are a senior software architect helping developers choose the best technology stack.

Context:
- Project Type: {project_type}
- Selected Languages: {languages}
- Team Size: {team_size}
- Timeline: {timeline}
- User's Past Successes: {historical_stacks}

Evaluate these stacks: {stack_candidates}

For each stack, provide:
1. Suitability Score (0-100)
2. Key Strengths (2-3 points)
3. Potential Concerns (1-2 points)
4. Best For (use case description)

Format: JSON with fields: stackId, score, strengths[], concerns[], bestFor
```

**Chain-of-Thought Reasoning**:

```
Step 1: Analyze project requirements
Step 2: Consider team constraints
Step 3: Evaluate technical alignment
Step 4: Score each stack
Step 5: Generate explanations
```

#### Components

**Backend** (`app/services/stack_advisor_llm.py`):

- `LLMStackAdvisor` class
- Prompt builder with context injection
- Response parser (JSON extraction)
- Fallback to rule-based if LLM fails
- Token usage logging

**Frontend** (`Step3StackSelection.svelte`):

- "🤖 AI Recommendations" section
- Expandable explanations per stack
- Confidence indicators (High/Medium/Low)
- "Why?" button showing reasoning
- Model badge (e.g., "Powered by GPT-4")

**Deliverables**:

- ✅ LLM-powered recommendation endpoint
- ✅ Prompt templates with few-shot examples
- ✅ Response parsing with validation
- ✅ UI for AI recommendations
- ✅ Explanation components
- ✅ A/B testing framework

---

### Milestone 4.3: Code Analysis Service (Week 2-3) - 0%

**Duration**: 7-10 days  
**Priority**: Medium (Enables "Analyze Existing Project" feature)

#### Rust Analysis Engine

**File**: `backend-rs/src/services/analyzer.rs`

**Capabilities**:

1. **Language Detection**:
   - File extension analysis
   - `tree-sitter` for syntax tree parsing
   - Confidence scoring per language

2. **Framework Identification**:
   - `package.json` → React, Next.js, Svelte
   - `requirements.txt` / `pyproject.toml` → Django, FastAPI
   - `Cargo.toml` → Rust frameworks
   - `go.mod` → Go frameworks
   - `.csproj` → .NET frameworks

3. **Dependency Analysis**:
   - Parse lock files for exact versions
   - Identify popular libraries (axios, pandas, etc.)
   - Detect database drivers (pg, mysql2, etc.)

4. **Structure Profiling**:
   - Directory tree analysis
   - Component count and naming patterns
   - Test file detection
   - Configuration files inventory

5. **Metrics**:
   - Lines of Code (LOC) per language
   - Cyclomatic complexity
   - File count per type
   - Import graph depth

**Output Format**:

```rust
struct ProjectAnalysis {
  languages: Vec<LanguageInfo>,      // Detected with %
  frameworks: Vec<FrameworkInfo>,    // Name + version
  dependencies: Vec<DependencyInfo>, // Direct deps
  structure: ProjectStructure,       // Dir tree + patterns
  metrics: ProjectMetrics,           // LOC, complexity
  suggested_stack: Option<String>,   // Best match stack ID
  confidence: f32,                   // 0.0-1.0
}
```

#### Frontend UI

**New Page**: `/analyze`

**Flow**:

1. User selects folder (via Tauri file dialog)
2. Backend analyzes project (progress indicator)
3. Display detailed report:
   - Language breakdown pie chart
   - Framework badges
   - Dependency list
   - Key metrics
   - Suggested stack with reasoning
4. "Create Similar Project" button → Pre-fill wizard

**Deliverables**:

- ✅ Rust analyzer service with tree-sitter
- ✅ Framework detection logic (10+ frameworks)
- ✅ Tauri command: `analyze_project(path)`
- ✅ Analysis report UI component
- ✅ Visualization charts (D3.js or Chart.js)
- ✅ Integration with wizard

---

### Milestone 4.4: Model Routing Intelligence (Week 3-4) - 0%

**Duration**: 5-7 days  
**Priority**: Medium (Optimization feature)

#### Intelligent Router

**Task Classification**:

```typescript
enum TaskComplexity {
  SIMPLE, // FAQ, simple questions → Fast/cheap models
  MODERATE, // Recommendations, comparisons → Mid-tier models
  COMPLEX, // Architecture design, analysis → Premium models
}

interface RoutingDecision {
  provider: string;
  model: string;
  reasoning: string;
  estimatedCost: number;
  estimatedLatency: number;
}
```

**Routing Algorithm**:

```
function selectModel(task: Task, constraints: Constraints): Model {
  // Classify task complexity
  complexity = classifyTask(task);

  // Get performance history
  history = getModelPerformance(task.type);

  // Filter by constraints
  candidates = models.filter(m =>
    m.cost <= constraints.maxCost &&
    m.latency <= constraints.maxLatency
  );

  // Score candidates
  scores = candidates.map(m =>
    (history[m].accuracy * 0.6) +
    (1 / m.cost * 0.2) +
    (1 / m.latency * 0.2)
  );

  return candidates[argmax(scores)];
}
```

**Model Performance Tracking**:

- Response time (p50, p95, p99)
- Token efficiency (output tokens / input tokens)
- User satisfaction (implicit: acceptance rate)
- Cost per successful recommendation
- Error rate

#### A/B Testing Framework

**Schema** (DataForge):

```sql
CREATE TABLE ab_tests (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  hypothesis TEXT,
  control_config JSONB,    -- Model A
  variant_config JSONB,    -- Model B
  traffic_split FLOAT,     -- % to variant
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status TEXT,
  winner TEXT,
  confidence FLOAT
);

CREATE TABLE ab_test_events (
  id UUID PRIMARY KEY,
  test_id UUID REFERENCES ab_tests(id),
  session_id UUID,
  variant TEXT,            -- 'control' or 'variant'
  outcome TEXT,            -- 'accepted', 'rejected', 'modified'
  metrics JSONB,
  created_at TIMESTAMP
);
```

**API**:

- `POST /api/v1/ab-tests` - Create test
- `GET /api/v1/ab-tests/:id/results` - Get results
- `POST /api/v1/ab-tests/:id/declare-winner` - End test

**Deliverables**:

- ✅ Model router with task classification
- ✅ Performance tracking system
- ✅ A/B testing framework (DB + API)
- ✅ Router configuration UI
- ✅ A/B test dashboard
- ✅ Automatic winner detection (statistical significance)

---

### Milestone 4.5: Predictive Analytics Dashboard (Week 4-5) - 0%

**Duration**: 7-10 days  
**Priority**: Low (Nice-to-have visualization)

#### Analytics Features

**1. Project Success Prediction**

**Input Features**:

- Selected stack
- Team size
- Timeline
- Developer experience level (from profile)
- Historical success rate for similar projects

**Model**: Simple logistic regression (scikit-learn)

**Output**: Success probability (0-100%) with confidence interval

**UI**:

- Gauge chart showing prediction
- Factors contributing to score
- Similar projects comparison

**2. Technology Trend Analysis**

**Metrics**:

- Language selection frequency over time
- Stack popularity trends
- Emerging technology adoption rate
- Recommendation acceptance rate per stack

**Visualizations**:

- Line charts (time series)
- Heatmaps (correlations)
- Bar charts (rankings)

**3. Recommendation Accuracy**

**Tracking**:

- Precision: % of accepted recommendations
- Recall: % of eventually-used stacks that were recommended
- F1 Score
- Mean Reciprocal Rank (MRR)

**Dashboard Widgets**:

- Model performance over time
- Per-stack accuracy
- Provider comparison

#### Implementation

**Backend** (`app/services/analytics_service.py`):

```python
class AnalyticsService:
  async def get_technology_trends(
    self,
    timeframe: str = "30d"
  ) -> TechnologyTrends:
    # Query DataForge for aggregated stats
    pass

  async def predict_project_success(
    self,
    project_profile: ProjectProfile
  ) -> SuccessPrediction:
    # Load ML model, run inference
    pass

  async def get_recommendation_metrics(
    self,
    model: str,
    period: str
  ) -> RecommendationMetrics:
    # Calculate precision, recall, F1
    pass
```

**Frontend** (`src/routes/analytics/+page.svelte`):

- Dashboard layout with 4-6 widgets
- Date range selector
- Filter by provider/model
- Export as PDF/CSV

**Deliverables**:

- ✅ Analytics API endpoints (5-7 endpoints)
- ✅ Prediction model training pipeline
- ✅ Analytics dashboard page
- ✅ Visualization components (charts, gauges)
- ✅ Data export functionality

---

### Milestone 4.6: Testing & Documentation (Week 5-6) - 0%

**Duration**: 5-7 days  
**Priority**: Critical (Quality assurance)

#### Testing Strategy

**1. Unit Tests**

- LLM provider implementations (mock responses)
- Model router logic
- Analytics calculations
- Prompt template rendering

**2. Integration Tests**

- End-to-end LLM recommendation flow
- Code analyzer with sample repos
- A/B test lifecycle
- Analytics data pipeline

**3. Performance Tests**

- LLM response time under load
- Analyzer performance on large repos (10k+ files)
- Dashboard rendering with large datasets

**4. Manual Testing**

- Test all LLM providers (OpenAI, Anthropic, Ollama)
- Analyze 5+ real-world projects
- Create projects with AI recommendations
- Review analytics dashboard accuracy

#### Documentation

**Files to Create**:

1. **PHASE_4_COMPLETION_SUMMARY.md** (detailed summary)
   - All milestones documented
   - Architecture diagrams
   - API reference
   - User guide
   - Developer guide
   - Performance benchmarks

2. **LLM_INTEGRATION_GUIDE.md** (user-facing)
   - How to configure providers
   - Best practices
   - Cost optimization tips
   - Troubleshooting

3. **CODE_ANALYSIS_GUIDE.md**
   - Supported languages/frameworks
   - Analysis accuracy notes
   - How to improve detection

4. **ANALYTICS_REFERENCE.md**
   - Dashboard features
   - Metrics definitions
   - Prediction model details

**Deliverables**:

- ✅ 50+ unit tests
- ✅ 20+ integration tests
- ✅ Performance benchmarks
- ✅ 4 documentation files
- ✅ Updated roadmap
- ✅ User guides

---

## Success Metrics

### Phase 4 KPIs

**Feature Adoption**:

- ✅ 80%+ users try AI recommendations
- ✅ 60%+ accept at least one AI suggestion
- ✅ 40%+ use code analysis feature

**Quality**:

- ✅ 90%+ test coverage
- ✅ <2s LLM response time (p95)
- ✅ <10s code analysis for medium projects

**Accuracy**:

- ✅ 70%+ recommendation acceptance rate
- ✅ 85%+ framework detection accuracy
- ✅ 60%+ success prediction accuracy (within 20% error)

**Performance**:

- ✅ <$0.10 average LLM cost per wizard session
- ✅ <5s analyzer startup time
- ✅ <200ms dashboard load time

---

## Technical Stack

### New Technologies

**LLM SDKs**:

- `openai` (Python SDK)
- `anthropic` (Python SDK)
- `ollama` (HTTP client)

**Code Analysis**:

- `tree-sitter` (Rust) - Syntax tree parsing
- `ignore` (Rust) - Gitignore-aware traversal

**Analytics**:

- `scikit-learn` (Python) - ML models
- `pandas` (Python) - Data processing
- `Chart.js` (TypeScript) - Visualizations

**Testing**:

- `vitest` (TypeScript unit tests)
- `pytest` (Python tests)
- `mockito` (Rust mocks)

---

## Risk Mitigation

### Identified Risks

**1. LLM Costs**

- **Risk**: High API costs with GPT-4
- **Mitigation**: Use cheaper models for simple tasks, implement caching, set budget limits

**2. LLM Latency**

- **Risk**: Slow responses impact UX
- **Mitigation**: Streaming responses, skeleton loaders, async processing, local fallbacks

**3. Analysis Accuracy**

- **Risk**: Incorrect framework detection
- **Mitigation**: Multiple detection methods, confidence scoring, user override option

**4. Model Availability**

- **Risk**: Provider outages
- **Mitigation**: Multiple provider support, graceful degradation, fallback to rule-based

**5. Privacy Concerns**

- **Risk**: Users uncomfortable sending code to LLMs
- **Mitigation**: Local analysis only, opt-in AI features, clear data usage policy

---

## Timeline

```
Week 1: Milestone 4.1 (LLM Providers)
Week 2: Milestone 4.2 (Stack Recommendations)
Week 3: Milestone 4.3 (Code Analysis)
Week 4: Milestone 4.4 (Model Routing)
Week 5: Milestone 4.5 (Analytics Dashboard)
Week 6: Milestone 4.6 (Testing & Docs)
```

**Buffer**: 1-2 weeks for polish and bug fixes

---

## Next Steps

**Immediate** (Milestone 4.1):

1. Create `src/lib/services/llm/` directory structure
2. Implement `BaseLLMProvider` interface
3. Build `OpenAIProvider` with chat + streaming
4. Create provider configuration UI
5. Test with real API calls

**Short-term** (Week 1-2):

1. Complete all provider implementations
2. Build stack recommendation endpoint
3. Design prompt templates
4. Integrate into Step 3 of wizard

**Medium-term** (Week 3-4):

1. Build Rust code analyzer
2. Implement model router
3. Create A/B testing framework

**Long-term** (Week 5-6):

1. Build analytics dashboard
2. Train prediction models
3. Write comprehensive documentation
4. Phase 4 completion

---

**Status**: Ready to begin Milestone 4.1 - LLM Provider Integration!

**Version**: Phase 4.0.0  
**Last Updated**: November 23, 2025
