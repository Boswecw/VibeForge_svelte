# User Guide: AI-Powered Recommendations

Learn how to use VibeForge's AI features to get intelligent stack recommendations powered by large language models (LLMs).

---

## 🤖 Overview

VibeForge uses AI to help you choose the best technology stack for your project. Instead of browsing through dozens of options, get personalized recommendations based on your project's specific needs.

### How It Works

1. **You describe your project** (type, languages, complexity)
2. **AI analyzes your requirements** (using GPT or Claude)
3. **You receive tailored recommendations** (top 3 stacks with explanations)
4. **You select the best fit** (or browse all options)

---

## 🚀 Getting Started

### Prerequisites

To use AI features, you need an API key from at least one provider:

**Option 1: OpenAI (Recommended)**

- Models: GPT-3.5-turbo, GPT-4, GPT-4o
- Cost: $0.50 - $60 per million tokens
- Sign up: https://platform.openai.com/
- Create API key: Dashboard → API Keys → Create

**Option 2: Anthropic**

- Models: Claude Opus, Sonnet, Haiku
- Cost: $0.25 - $75 per million tokens
- Sign up: https://console.anthropic.com/
- Create API key: Settings → API Keys

**Option 3: Ollama (Free, Local)**

- Models: Llama 2 70B, 13B
- Cost: Free (uses your hardware)
- Install: https://ollama.ai/download
- Run: `ollama serve` in terminal

### Configure API Keys

1. Open VibeForge
2. Navigate to **Settings** → **AI Intelligence**
3. Enter your API key(s):
   - **OpenAI API Key:** `sk-proj-...`
   - **Anthropic API Key:** `sk-ant-...`
4. Click **Save**

**Security Note:** API keys are stored locally in your browser (localStorage). They're never sent to VibeForge servers—only directly to the LLM provider.

---

## 📝 Using AI in the Wizard

### Step 1: Project Intent

Fill out basic project information:

- **Project Name:** e.g., "TaskMaster Pro"
- **Description:** Brief overview of what you're building
- **Project Type:** Select from:
  - Web Application
  - Mobile Application
  - Desktop Application
  - API/Microservice
  - AI/ML System
  - Full-Stack Application
- **Team Size:** Number of developers
- **Timeline:** Estimated project duration

**Pro Tip:** More detailed descriptions lead to better recommendations. Include specific features, technologies you're familiar with, and any constraints.

---

### Step 2: Language Selection

Choose programming languages for your project.

**AI Enhancement:** Based on your project type, you'll see:

- ✨ **Recommended** badge on suggested languages
- 💡 Explanations of why each language fits
- ⚠️ **Warning** if incompatible combinations selected

**Example:**

```
Project Type: Web Application

Recommended Languages:
✨ JavaScript/TypeScript - Industry standard for web
✨ Python - Great for backend APIs and AI features

Compatible Pairs:
✓ JavaScript + Python (frontend + backend)
✓ TypeScript + Go (modern web + performance)
⚠️ Dart + Swift (both mobile-only)
```

---

### Step 3: Stack Selection (AI Magic ✨)

This is where AI shines! You'll see two sections:

#### **AI Recommendations** (Top)

3 personalized stack suggestions with:

**Example:**

```
┌─────────────────────────────────────────────────────────────┐
│  ⭐ AI Recommended: T3 Stack                                │
│                                                              │
│  Next.js + tRPC + Tailwind + Prisma                         │
│                                                              │
│  Why This Fits:                                             │
│  • Perfect for full-stack TypeScript development           │
│  • Type-safe API calls with tRPC                            │
│  • Modern UI with Tailwind CSS                              │
│  • Production-ready with Vercel deployment                  │
│                                                              │
│  Best For:                                                   │
│  • Medium-complexity projects                               │
│  • Teams familiar with React ecosystem                      │
│  • Projects needing rapid development                       │
│                                                              │
│  Score: 92/100                                               │
│  ├─ AI Intelligence: 40/40                                  │
│  ├─ Popularity: 28/30                                       │
│  ├─ Compatibility: 18/20                                    │
│  └─ Complexity Match: 6/10                                  │
│                                                              │
│  [Select This Stack]                                        │
└─────────────────────────────────────────────────────────────┘
```

**Score Breakdown:**

- **AI Intelligence (40%):** How well AI thinks it fits
- **Popularity (30%):** Community adoption and maturity
- **Compatibility (20%):** Matches selected languages
- **Complexity Match (10%):** Aligns with project complexity

#### **All Stacks** (Bottom)

Browse complete stack library if AI recommendations don't fit.

**Filtering:**

- By category (Web, Mobile, Desktop, API)
- By language compatibility
- By complexity level

---

## 💰 Cost Management

### Understanding Costs

AI recommendations cost money (except Ollama which is free).

**Typical Costs per Recommendation:**

- **GPT-3.5-turbo:** $0.0003 - $0.001 (~1,000 tokens)
- **GPT-4:** $0.003 - $0.01 (~1,000 tokens)
- **Claude Sonnet:** $0.0005 - $0.002 (~1,000 tokens)
- **Claude Haiku:** $0.0001 - $0.0005 (~1,000 tokens)
- **Ollama:** $0 (free, local processing)

**Monthly Budget Example:**

- 100 wizard runs with GPT-3.5: ~$0.50 - $1.00
- 100 wizard runs with GPT-4: ~$3.00 - $10.00
- 100 wizard runs with Claude Sonnet: ~$1.00 - $2.00

### Setting Budgets

Prevent overspending by configuring budgets:

1. Go to **Settings** → **AI Intelligence**
2. Scroll to **Budget Management**
3. Set limits:
   - **Daily Budget:** e.g., $1.00
   - **Weekly Budget:** e.g., $5.00
   - **Monthly Budget:** e.g., $20.00
4. Click **Save**

**What Happens When Budget Exceeded:**

- ⚠️ Warning displayed in wizard
- AI recommendations disabled
- Fallback to empirical (non-AI) mode
- Manual stack browsing still available

### Tracking Spending

Monitor costs in real-time:

1. Go to **Analytics** → **Overview**
2. Check **Total Cost** card
3. Review **Budget Tracker** progress bars
4. See **Cost by Model** breakdown

**Pro Tip:** Enable "Cost-Optimized" routing strategy to minimize spending automatically.

---

## ⚙️ Routing Strategies

Control how AI selects models for your requests.

### Available Strategies

**1. Cost-Optimized** (Cheapest)

- Prioritizes lowest-cost models
- Uses GPT-3.5-turbo or Claude Haiku
- Falls back to Ollama if over budget
- **Best for:** High volume, tight budgets

**2. Performance-Optimized** (Fastest)

- Prioritizes response speed
- Uses models with lowest latency
- May cost more for faster results
- **Best for:** User-facing features, real-time

**3. Quality-Focused** (Best Results)

- Prioritizes accuracy and detail
- Uses GPT-4 or Claude Opus
- Highest cost but best recommendations
- **Best for:** Complex projects, critical decisions

**4. Balanced** (Default)

- Weighs cost, performance, and quality
- Uses GPT-3.5-turbo or Claude Sonnet
- Best all-around choice
- **Best for:** Most use cases

**5. Custom** (Advanced)

- Define your own selection logic
- Requires JavaScript knowledge
- Full control over routing
- **Best for:** Power users, specific requirements

### Changing Strategy

1. Go to **Settings** → **AI Intelligence**
2. Find **Routing Strategy**
3. Select desired strategy
4. Click **Save**

Changes apply immediately to next recommendation.

---

## 🎯 Optimizing Recommendations

### Get Better Results

**1. Provide Detailed Descriptions**

```
❌ Bad: "A web app"
✅ Good: "A task management web app with real-time collaboration,
         similar to Asana. Needs user auth, notifications, and
         mobile-responsive design."
```

**2. Be Specific About Requirements**

```
❌ Bad: Project Type = Web Application
✅ Good: Project Type = Web Application
         + Mention: "Need SEO, fast page loads, and easy deployment"
```

**3. Indicate Familiarity**

```
✅ Good: "Team experienced with React, new to backend development"
```

**4. Note Constraints**

```
✅ Good: "Must use PostgreSQL (company standard)"
         "Deploy on AWS (existing infrastructure)"
```

### Understanding Scores

Higher scores = better fit for your project.

**Score Ranges:**

- **90-100:** Excellent fit, highly recommended
- **80-89:** Very good fit, safe choice
- **70-79:** Good fit, worth considering
- **60-69:** Acceptable fit, review carefully
- **<60:** Poor fit, probably not ideal

**When to Ignore Scores:**

- You have specific technology mandates
- Team already skilled in a stack
- Existing codebase to integrate with

---

## 🔍 Interpreting AI Explanations

### "Why This Fits" Section

AI explains reasoning behind each recommendation.

**Key Phrases to Look For:**

**"Perfect for..."**

- Strong alignment with your project type
- High confidence recommendation

**"Great for..."**

- Good fit but not perfect
- Consider other factors

**"Suitable for..."**

- Acceptable but may have trade-offs
- Review pros/cons carefully

### "Best For" Section

Identifies ideal use cases for the stack.

**Example:**

```
Best For:
• Teams with React experience
• Projects needing rapid MVP development
• Applications with complex state management
• Startups prioritizing time-to-market
```

**Match these with your situation:**

- ✅ 3-4 matches: Great fit
- ⚠️ 1-2 matches: Acceptable
- ❌ 0 matches: Probably not ideal

---

## 🚨 Troubleshooting

### "AI recommendations unavailable"

**Causes:**

1. No API key configured
2. Invalid API key
3. Budget exceeded
4. API provider outage
5. Network connectivity issues

**Solutions:**

1. Check Settings → AI Intelligence → API Keys
2. Verify key is valid (test in provider dashboard)
3. Increase budget or wait for next period
4. Check provider status page
5. Check internet connection

### "Error fetching recommendations"

**Causes:**

1. API request failed
2. Rate limit exceeded
3. Invalid project data

**Solutions:**

1. Try again (automatic retry after 5 seconds)
2. Wait 60 seconds and retry
3. Fill out all required wizard fields

### Recommendations seem off-topic

**Causes:**

1. Vague project description
2. Incompatible language selections
3. Wrong project type selected

**Solutions:**

1. Add more detail to description
2. Review language compatibility warnings
3. Double-check project type matches intent

### High costs

**Causes:**

1. Using expensive models (GPT-4)
2. Generating many recommendations
3. No budget limits set

**Solutions:**

1. Switch to "Cost-Optimized" routing
2. Use recommendations sparingly
3. Set daily/weekly budgets in Settings

---

## 📊 Monitoring AI Usage

### Analytics Dashboard

Track AI performance and costs:

1. **Overview Tab**
   - Total spending
   - Request counts
   - Average response times
   - Top models used

2. **Cost Analytics Tab**
   - Daily spending trends
   - Cost by provider
   - Cost by feature
   - Detailed cost table

3. **Model Usage Tab**
   - Request distribution
   - Acceptance rates
   - Success metrics

4. **Performance Tab**
   - Response time comparisons
   - Performance grades (A+ to D)
   - Error rates

**Access:** Navigate to `/analytics`

---

## 💡 Best Practices

### 1. Start with Balanced Strategy

- Good mix of cost/performance/quality
- Works for 80% of use cases
- Switch to specialized strategies as needed

### 2. Set Realistic Budgets

- Start with $5-10/month
- Monitor for 2 weeks
- Adjust based on usage patterns

### 3. Use Cost-Optimized for Exploration

- When browsing many stacks
- During learning/experimentation
- For non-critical decisions

### 4. Use Quality-Focused for Important Projects

- Production applications
- Client projects
- Complex architecture decisions

### 5. Review Analytics Monthly

- Check spending trends
- Identify expensive patterns
- Optimize routing strategy

### 6. Provide Context in Descriptions

- Mention team skills
- Note existing infrastructure
- Specify deployment requirements

### 7. Don't Over-Rely on AI

- Use AI as one input
- Combine with team expertise
- Consider business constraints

---

## 🔐 Privacy & Security

### Data Protection

- ✅ API keys stored locally (browser)
- ✅ Keys never sent to VibeForge servers
- ✅ Direct communication with LLM providers
- ✅ No telemetry or usage tracking
- ✅ All data stays on your device

### What Gets Sent to LLMs

- Project name
- Project description
- Selected languages
- Project type
- Complexity level
- Team size (optional)
- Timeline (optional)

### What NEVER Gets Sent

- Personal information
- Email addresses
- API keys (stored locally)
- Other projects' data
- Browsing history

---

## 📚 Related Guides

- [Analytics Dashboard Guide](./USER_GUIDE_ANALYTICS.md)
- [Budget Management Guide](./USER_GUIDE_BUDGET_MANAGEMENT.md)
- [Settings Configuration Guide](./USER_GUIDE_SETTINGS.md)

---

## ❓ FAQ

**Q: How much do AI recommendations cost?**  
A: Depends on model. GPT-3.5: ~$0.001/recommendation. GPT-4: ~$0.01/recommendation. Ollama: Free.

**Q: Can I use VibeForge without AI?**  
A: Yes! Browse all stacks manually in the wizard without AI recommendations.

**Q: Which model is best?**  
A: GPT-3.5-turbo for most cases. GPT-4 for complex projects. Claude Sonnet for balanced performance.

**Q: Is my data safe?**  
A: Yes. Everything is local. Only your API keys and prompts go to LLM providers (never VibeForge).

**Q: What if I run out of budget?**  
A: AI recommendations disable automatically. You can still browse stacks manually.

**Q: Can I use multiple providers?**  
A: Yes! Configure keys for OpenAI, Anthropic, and Ollama. Router picks best model automatically.

---

**Last Updated:** November 23, 2025  
**Version:** 1.0.0
