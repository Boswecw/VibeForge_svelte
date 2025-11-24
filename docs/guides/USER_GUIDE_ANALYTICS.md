# User Guide: Analytics Dashboard

Learn how to use VibeForge's Analytics Dashboard to monitor AI usage, track costs, and optimize performance.

---

## 📍 Accessing the Dashboard

Navigate to `/analytics` in VibeForge or click the **Analytics** link in the navigation menu.

---

## 📊 Dashboard Overview

The Analytics Dashboard consists of 4 main tabs:

1. **Overview** - High-level summary of AI usage
2. **Cost Analytics** - Detailed cost breakdowns
3. **Model Usage** - Usage patterns and acceptance rates
4. **Performance** - Response times and quality grades

### Date Range Selector

All analytics support date range filtering:

- **Last 7 Days** - Quick view of recent activity
- **Last 30 Days** - Monthly overview (default)
- **Last 90 Days** - Quarterly analysis

### Export Options

Export your data in two formats:

- **CSV** - Spreadsheet-friendly for Excel/Google Sheets
- **JSON** - Complete data structure for programmatic analysis

---

## 📈 Tab 1: Overview

The Overview tab provides a quick snapshot of your AI usage.

### Summary Cards

**Total Cost**

- Cumulative spending in selected date range
- Updates in real-time as you use AI features
- Example: `$12.45`

**Total Calls**

- Number of AI requests made
- Includes all providers (OpenAI, Anthropic, Ollama)
- Example: `248 calls`

**Avg Response Time**

- Average latency across all models
- Measured in milliseconds
- Example: `1,450ms`

**Top Model**

- Most frequently used model
- Shows provider and model name
- Example: `gpt-3.5-turbo`

### Budget Tracker Preview

Displays budget status for:

- **Daily Budget** - Spending today vs. daily limit
- **Weekly Budget** - Current week vs. weekly limit
- **Monthly Budget** - Current month vs. monthly limit

**Color Coding:**

- 🟢 Green: Under 75% of threshold (safe)
- 🟡 Yellow: 75-100% of threshold (warning)
- 🔴 Red: Over threshold (exceeded)

### Cost Analytics Preview (Compact)

Mini version of the Cost Analytics tab showing:

- Daily cost trend for last 7 days
- Top 3 providers by cost
- Top 3 categories by usage

---

## 💰 Tab 2: Cost Analytics

Detailed breakdown of where your AI budget is being spent.

### Daily Cost Trend

**Horizontal bar chart** showing daily spending over selected period.

- Each bar represents one day
- Hover to see exact cost
- Gradient color indicates spending level

**Example:**

```
2025-11-16  [$2.45]  ████████████████░░░░
2025-11-17  [$1.80]  ████████████░░░░░░░░
2025-11-18  [$3.20]  ████████████████████
```

### Cost by Provider

**Pie chart** showing distribution across LLM providers.

**Providers:**

- 🟢 OpenAI (green) - GPT models
- 🟠 Anthropic (orange) - Claude models
- 🔵 Ollama (indigo) - Local models (free)

**Example:**

```
OpenAI:    $8.20  (65.9%) ████████████████░░░░
Anthropic: $3.85  (30.9%) ████████░░░░░░░░░░░░
Ollama:    $0.40  (3.2%)  █░░░░░░░░░░░░░░░░░░░
```

### Cost by Category

**Pie chart** showing spending by feature type.

**Categories:**

- **Recommendation** - Stack suggestions in wizard
- **Explanation** - Technology descriptions
- **Validation** - Config validation
- **Analysis** - Code analysis
- **Code Generation** - Template generation (future)

### Cost by Model Table

**Detailed table** with columns:

- **Model** - Provider and model name
- **Calls** - Number of requests
- **Cost** - Total spending
- **Avg Cost** - Cost per request

**Sorting:** Click column headers to sort (descending by default for Cost)

---

## 📊 Tab 3: Model Usage

Understand which models you're using and how well they perform.

### Usage Distribution

**Horizontal bar chart** showing request counts per model.

**Example:**

```
gpt-3.5-turbo   [142 calls] (57%) ████████████████████░░░░
claude-sonnet   [68 calls]  (27%) ████████████░░░░░░░░░░░░
gpt-4o          [28 calls]  (11%) ████░░░░░░░░░░░░░░░░░░░░
claude-haiku    [10 calls]  (4%)  █░░░░░░░░░░░░░░░░░░░░░░░
```

### Acceptance Rate Cards

**Grid of cards** showing success rates per model.

**Card Contents:**

- Model name and provider
- Large acceptance rate percentage
- Color coding (green: ≥90%, yellow: 70-89%, red: <70%)

**Example:**

```
┌─────────────────────┐
│  GPT-3.5-Turbo      │
│      92.3%          │  🟢
│  (OpenAI)           │
└─────────────────────┘
```

### Detailed Statistics Table

**Complete metrics** with columns:

- **Model** - Full model name
- **Total Calls** - Request count
- **Accepted** - Successful requests (green)
- **Errors** - Failed requests (red)
- **Avg Response** - Mean latency (blue)
- **Acceptance Rate** - Success percentage

---

## ⚡ Tab 4: Performance

Monitor response times and evaluate model quality.

### Performance Grades

**Grid of grade cards** showing quality scores (A+ to D).

**Grading Algorithm:**

- **Response Time (40%):** Faster = better
- **Error Rate (30%):** Lower = better
- **Acceptance Rate (30%):** Higher = better

**Grade Scale:**

- **A+** (90-100): Excellent performance 🟢
- **A** (80-89): Excellent performance 🟢
- **B** (70-79): Good performance 🔵
- **C** (60-69): Fair performance 🟡
- **D** (<60): Poor performance 🔴

**Example:**

```
┌─────────────────────┐
│  Claude Haiku       │
│        A+           │  🟢
│     Score: 95       │
└─────────────────────┘
```

### Response Time Comparison

**Horizontal bar chart** comparing average latency.

**Color Coding:**

- 🟢 Green: <1 second (fast)
- 🟡 Yellow: 1-3 seconds (moderate)
- 🟠 Orange: >3 seconds (slow)

**Example:**

```
claude-haiku    [850ms]  ████████████░░░░░░░░  🟢
gpt-3.5-turbo   [1,450ms]████████████████████░░ 🟡
claude-sonnet   [1,800ms]████████████████████████ 🟡
gpt-4           [3,200ms]████████████████████████████████ 🟠
```

### Detailed Metrics Table

**Complete performance data** with columns:

- **Model** - Provider and model name
- **Avg Response** - Mean latency
- **p50** - Median (50th percentile)
- **p95** - 95th percentile
- **p99** - 99th percentile
- **Error Rate** - Failure percentage

**Percentiles Explained:**

- **p50 (Median):** Half of requests are faster
- **p95:** 95% of requests are faster (outlier threshold)
- **p99:** 99% of requests are faster (worst-case)

---

## 📤 Exporting Data

### CSV Export

**Use Case:** Import into Excel, Google Sheets, or data analysis tools.

**Format:**

```csv
Date,Provider,Model,Category,InputTokens,OutputTokens,Cost
2025-11-16,openai,gpt-3.5-turbo,recommendation,150,75,0.0003
2025-11-16,anthropic,claude-sonnet,explanation,200,100,0.0006
```

**Columns:**

- **Date:** Timestamp of request
- **Provider:** LLM provider name
- **Model:** Specific model used
- **Category:** Feature that triggered request
- **InputTokens:** Tokens sent to model
- **OutputTokens:** Tokens returned from model
- **Cost:** Dollar cost for this request

### JSON Export

**Use Case:** Programmatic analysis, custom visualizations, data pipelines.

**Format:**

```json
{
  "dateRange": {
    "start": "2025-10-24T00:00:00.000Z",
    "end": "2025-11-23T23:59:59.999Z"
  },
  "summary": {
    "totalCost": 12.45,
    "totalCalls": 248,
    "avgResponseTime": 1450
  },
  "costs": [
    {
      "timestamp": "2025-11-16T14:30:00.000Z",
      "provider": "openai",
      "model": "gpt-3.5-turbo",
      "category": "recommendation",
      "inputTokens": 150,
      "outputTokens": 75,
      "cost": 0.0003
    }
  ],
  "models": {
    "gpt-3.5-turbo": {
      "totalCount": 142,
      "acceptedCount": 131,
      "errorCount": 11,
      "avgResponseTime": 1450,
      "totalCost": 4.2
    }
  }
}
```

---

## 🎯 Common Use Cases

### 1. Monitor Monthly Spending

**Goal:** Stay within budget

**Steps:**

1. Go to Overview tab
2. Check Total Cost card
3. Review Budget Tracker for current month
4. If approaching limit (yellow/red), adjust usage

**Pro Tip:** Set realistic budgets in Settings to get early warnings.

---

### 2. Optimize Cost per Request

**Goal:** Reduce spending without sacrificing quality

**Steps:**

1. Go to Cost Analytics tab
2. Check Cost by Model table
3. Sort by Avg Cost (descending)
4. Identify expensive models
5. Go to Settings → Routing Strategy
6. Switch to "Cost-Optimized" or "Balanced"

**Pro Tip:** GPT-3.5-turbo and Claude Haiku are most cost-effective for simple tasks.

---

### 3. Identify Slow Models

**Goal:** Improve user experience with faster responses

**Steps:**

1. Go to Performance tab
2. Check Response Time Comparison
3. Note models with >2s average
4. Go to Settings → Routing Strategy
5. Switch to "Performance-Optimized"

**Pro Tip:** Claude Haiku typically has fastest response times.

---

### 4. Track Feature Usage

**Goal:** Understand which features use most AI

**Steps:**

1. Go to Cost Analytics tab
2. Check Cost by Category pie chart
3. Identify top categories
4. Review if usage aligns with expectations

**Pro Tip:** Recommendation category typically highest due to wizard usage.

---

### 5. Generate Monthly Report

**Goal:** Export data for stakeholders

**Steps:**

1. Set date range to "Last 30 Days"
2. Click "Export CSV"
3. Open in Excel/Google Sheets
4. Create pivot table for summary
5. Add charts for visualization

**Pro Tip:** Include Performance grades in report to show quality metrics.

---

## ⚙️ Settings Integration

Configure AI behavior from Settings → AI Intelligence:

### API Keys

- Add OpenAI API key for GPT models
- Add Anthropic API key for Claude models
- Leave empty to use Ollama (local) only

### Routing Strategy

- **Cost-Optimized:** Minimize spending
- **Performance-Optimized:** Fastest responses
- **Quality-Focused:** Best results
- **Balanced:** Middle ground (default)
- **Custom:** Advanced users only

### Budgets

- **Daily:** Limit spending per day
- **Weekly:** Limit spending per week
- **Monthly:** Limit spending per month

**Warning:** If budget exceeded, system falls back to empirical (non-AI) mode.

---

## 🔍 Troubleshooting

### No data showing

**Cause:** Haven't used AI features yet  
**Solution:** Use the wizard (Step 3: Stack Selection) to generate recommendations

### Export button disabled

**Cause:** No data in selected date range  
**Solution:** Adjust date range or generate more AI requests

### Budget showing as exceeded

**Cause:** Spending surpassed configured limit  
**Solution:** Increase budget in Settings or wait for next period (day/week/month)

### Some models missing from charts

**Cause:** Models not used in selected date range  
**Solution:** Expand date range or use those models in wizard

---

## 📚 Related Guides

- [LLM Configuration Guide](./USER_GUIDE_LLM_FEATURES.md)
- [Budget Management Guide](./USER_GUIDE_BUDGET_MANAGEMENT.md)
- [Wizard User Guide](./USER_GUIDE_WIZARD.md)

---

## 💡 Best Practices

1. **Check analytics regularly** - Monitor spending trends weekly
2. **Set realistic budgets** - Start with $10/month and adjust
3. **Use cost-optimized mode** - For non-critical recommendations
4. **Export monthly reports** - Track trends over time
5. **Watch acceptance rates** - Low rates indicate poor model fit
6. **Review performance grades** - Switch to A/A+ rated models
7. **Monitor error rates** - High errors suggest API issues

---

**Last Updated:** November 23, 2025  
**Version:** 1.0.0
