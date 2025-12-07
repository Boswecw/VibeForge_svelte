# Cortex Multi-AI Planning Orchestrator - User Guide

**Last Updated:** December 6, 2025
**Version:** 1.0.0
**Feature Status:** ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Using the Planning Orchestrator](#using-the-planning-orchestrator)
4. [Understanding Planning Workflows](#understanding-planning-workflows)
5. [API Key Configuration](#api-key-configuration)
6. [Deliverables](#deliverables)
7. [License Tiers & Quotas](#license-tiers--quotas)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

### What is Cortex?

Cortex is VibeForge's **Multi-AI Planning Orchestrator** - a collaborative system that uses multiple AI models (ChatGPT and Claude) to create comprehensive implementation plans for your software projects.

### How It Works

Cortex uses a **4-stage workflow** where ChatGPT and Claude alternate to:
1. **Initial Planning** (ChatGPT): Creates the first implementation plan
2. **Review** (Claude): Identifies gaps, concerns, and improvements
3. **Refinement** (ChatGPT): Addresses feedback and enhances the plan
4. **Final Deliverable** (Claude): Generates two production-ready files

### Key Features

- ✅ **Multi-AI Collaboration**: ChatGPT ↔ Claude working together
- ✅ **4-Stage Workflow**: Initial → Review → Refinement → Final
- ✅ **Two-File Deliverable**: Implementation Plan + Claude Code Prompt
- ✅ **Real-Time Streaming**: Watch each AI respond live
- ✅ **Progress Tracking**: Visual progress bar and stage indicators
- ✅ **Cost Estimation**: Know the cost before starting (~$0.27 - $0.81)
- ✅ **Session History**: Review and download previous plans
- ✅ **Freemium Licensing**: Free trial with 14-day access

---

## Getting Started

### 1. Access Cortex

1. Open VibeForge workbench
2. Click the **"Planning"** tab in the left column
3. You'll see the Cortex Planning Orchestrator interface

### 2. Configure API Keys (Required)

Before using Cortex, you must configure API keys for at least one provider:

1. Click the **"Settings"** tab in Cortex
2. Enter API keys for your preferred providers:
   - **Anthropic (Claude)** - Required for review and final stages
   - **OpenAI (ChatGPT)** - Required for initial and refinement stages
   - **xAI (Grok)** - Optional alternative
   - **Google (Gemini)** - Optional alternative

3. Click **"Save API Keys"**
4. Keys are stored securely in your browser's local storage

**Note:** API keys are NEVER sent to VibeForge servers - they're used only in your browser to call the AI providers directly.

### 3. Start Your Trial

- **Free Tier**: No orchestrator access
- **Trial**: Click "Begin Trial" → 14 days, 20 runs/month
- **Pro/Enterprise**: Full access with higher quotas

---

## Using the Planning Orchestrator

### Creating a Planning Request

1. **Go to "New Request" Tab**

2. **Fill Out the Form:**
   - **Title** (required): Short description (max 100 chars)
     - Example: "User Authentication System"
   - **Description** (required): Detailed requirements (max 2000 chars)
     - Example: "Implement JWT-based authentication with email/password login, password reset, session management, and role-based access control (RBAC)"
   - **Request Type**: Feature | Refactor | Bug Fix | Enhancement
   - **Workflow**: Quick (2 stages) | Default (4 stages) | Deep (6 stages)

3. **Review Quota and Cost:**
   - **Runs Remaining**: Shows how many runs you have left this month
   - **Estimated Cost**: Shows approximate API cost (e.g., ~$0.54)

4. **Click "Start Planning"**

### Monitoring Progress

Once started, Cortex automatically switches to the **"Stages"** tab:

#### Stage Indicators

- **○ Pending**: Stage not yet started
- **⟳ Running**: Currently executing (with spinning icon)
- **✓ Completed**: Finished successfully
- **✗ Failed**: Encountered an error

#### Progress Bar

Shows overall completion percentage (0-100%) with:
- Status badge (In Progress, Paused, Completed, Failed, Cancelled)
- Stage count (e.g., "2/4 stages complete")
- Total tokens and cost
- Session start time

#### Streaming Output

- Watch real-time token-by-token responses from each AI
- Expandable stage cards show full input/output
- Token count, cost, and duration per stage

### Session Controls

While a session is running, you can:
- **⏸ Pause**: Pause between stages (resume later)
- **▶ Resume**: Continue a paused session
- **⏹ Abort**: Cancel the session (with confirmation)

---

## Understanding Planning Workflows

### Default Workflow (4 Stages, ~5 min, ~$0.54)

**Recommended for most projects**

1. **Initial** (ChatGPT): Creates implementation plan
   - Input: User description
   - Output: Structured plan with phases, tasks, acceptance criteria

2. **Review** (Claude): Critical analysis
   - Input: Initial plan + user description
   - Output: Gaps identified, concerns raised, improvements suggested

3. **Refinement** (ChatGPT): Addresses feedback
   - Input: Initial plan + review feedback
   - Output: Enhanced plan with gaps filled

4. **Final** (Claude): Production deliverable
   - Input: All previous stages
   - Output: Two files (Implementation Plan + Claude Code Prompt)

### Quick Workflow (2 Stages, ~3 min, ~$0.27)

**For simple projects or rapid prototyping**

1. **Initial** (ChatGPT): Creates plan
2. **Final** (Claude): Generates deliverable

### Deep Workflow (6 Stages, ~10 min, ~$0.81)

**For complex projects requiring thorough planning**

1. **Initial** (ChatGPT): First draft
2. **Review 1** (Claude): First review
3. **Refinement 1** (ChatGPT): Address first review
4. **Review 2** (Claude): Second review
5. **Refinement 2** (ChatGPT): Final refinements
6. **Final** (Claude): Polished deliverable

---

## API Key Configuration

### Supported Providers

#### Anthropic (Claude)
- **Models**: Claude 3.5 Sonnet, Haiku, Opus
- **Required for**: Review and Final stages
- **Get Key**: https://console.anthropic.com/settings/keys
- **Pricing**: ~$3/1M input tokens, ~$15/1M output tokens

#### OpenAI (ChatGPT)
- **Models**: GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
- **Required for**: Initial and Refinement stages
- **Get Key**: https://platform.openai.com/api-keys
- **Pricing**: ~$10/1M input tokens, ~$30/1M output tokens

#### xAI (Grok)
- **Models**: Grok Beta, Grok-1
- **Optional**: Can replace OpenAI
- **Get Key**: https://x.ai/api
- **Pricing**: ~$5/1M input tokens, ~$15/1M output tokens

#### Google (Gemini)
- **Models**: Gemini 1.5 Pro, Flash
- **Optional**: Can replace Claude
- **Get Key**: https://makersuite.google.com/app/apikey
- **Pricing**: ~$3.5/1M input tokens, ~$10.5/1M output tokens

### Managing Keys

#### Adding a Key
1. Go to Settings tab
2. Enter key in the input field for the provider
3. Click "Save API Keys"
4. Status changes to "✓ Configured"

#### Removing a Key
1. Go to Settings tab
2. Click "Remove Key" next to the provider
3. Status changes to "Not configured"

#### Security
- Keys are stored in browser localStorage only
- Never sent to VibeForge servers
- Only visible when you click the "show" toggle (👁️)
- Cleared when you clear browser data

---

## Deliverables

### Two-File Output

Every successful planning session generates **two files**:

#### 1. Implementation Plan (`{title}_plan.md`)

A comprehensive markdown document with:
- **Title & Metadata**: Project name, estimated time
- **Overview**: High-level summary
- **Phases**: Numbered implementation phases
- **Tasks**: Detailed task breakdown per phase
- **Acceptance Criteria**: Success measures
- **Dependencies**: External requirements
- **Risk Assessment**: Potential challenges

#### 2. Claude Code Prompt (`{title}_prompt.md`)

A ready-to-use prompt for Claude Code containing:
- **Context**: Full project background
- **Requirements**: Detailed specifications
- **Implementation Steps**: Step-by-step instructions
- **Success Criteria**: Testing and validation
- **File Structure**: Recommended file organization

### Downloading Deliverables

1. Go to **"Output"** tab
2. Wait for "Planning Complete! ✓" message
3. Options:
   - **Download Both Files**: Downloads both as text files
   - **Copy**: Copy individual files to clipboard
4. Files are downloaded to your browser's default download folder

### Viewing Output

- **Metadata**: Title, estimated time, phases count
- **Preview**: First 1000 characters of each file
- **Full Content**: Click "View Full Output" for complete text

---

## License Tiers & Quotas

### Free Tier
- **Cost**: $0/month
- **Orchestrator Access**: ❌ None
- **Features**: Workbench, context management, basic prompts

### Trial Tier
- **Duration**: 14 days
- **Orchestrator Access**: ✅ 20 runs/month
- **Features**: Full Cortex access
- **How to Start**: Click "Begin Trial" in Planning tab

### Pro Tier
- **Cost**: $20/month (planned pricing)
- **Orchestrator Access**: ✅ 100 runs/month
- **Features**: Full Cortex + model comparison

### Enterprise Tier
- **Cost**: Custom pricing
- **Orchestrator Access**: ✅ Unlimited runs
- **Features**: Everything + dedicated support

### Quota Management

- **Monthly Reset**: Quotas reset on the 1st of each month
- **Runs Remaining**: Displayed in "New Request" form
- **Tracking**: Automatically tracked per session start
- **Overage**: Sessions blocked when quota reached

---

## Troubleshooting

### Common Issues

#### "You are offline" Banner
**Problem**: No internet connection
**Solution**: Check your network connection and refresh the page

#### "Cannot start session: upgrade to use orchestrator"
**Problem**: No active trial or paid plan
**Solution**: Click "Begin Trial" to start your 14-day trial

#### "API key invalid" Error
**Problem**: Incorrect or expired API key
**Solution**:
1. Go to Settings tab
2. Remove the old key
3. Get a new key from the provider's website
4. Save the new key

#### Session Fails Immediately
**Problem**: Missing API keys for required providers
**Solution**: Ensure you have keys for:
- Anthropic (Claude) - Required
- OpenAI (ChatGPT) - Required

#### "Runs remaining: 0"
**Problem**: Monthly quota exhausted
**Solution**: Wait until next month or upgrade tier

#### Slow Session Execution
**Problem**: Provider API rate limits or network latency
**Solution**:
- Pause and resume later
- Use "Quick" workflow for faster results
- Check network connection speed

---

## Best Practices

### Writing Good Descriptions

✅ **Do:**
- Be specific about requirements
- Include technical constraints
- Mention integration points
- Specify success criteria
- List known dependencies

❌ **Don't:**
- Use vague language ("make it good")
- Omit critical details
- Skip technical requirements
- Forget to mention existing systems

### Example: Good Description

```
Implement a JWT-based authentication system with:
- User registration with email verification
- Login with email/password
- Password reset flow via email
- Session management with refresh tokens
- Role-based access control (admin, user, guest)
- Integration with existing Express.js backend
- PostgreSQL for user storage
- Security: bcrypt hashing, rate limiting, HTTPS only
```

### Choosing the Right Workflow

- **Quick (2 stages)**: Simple features, prototypes, proof of concepts
- **Default (4 stages)**: Most projects, balanced quality/speed
- **Deep (6 stages)**: Complex systems, critical features, high-stakes projects

### Managing Costs

- **Preview Cost**: Check estimated cost before starting
- **Use Quick**: For simple projects to save money
- **Batch Planning**: Plan multiple features in one session description
- **Monthly Budget**: Track runs remaining throughout the month

### Reviewing Sessions

- **Expand Stages**: Click stage cards to see full I/O
- **Compare Approaches**: Load different sessions to compare plans
- **Extract Learnings**: Review AI feedback for architecture insights

---

## Advanced Features

### User Context Injection (Coming Soon)

Ability to inject additional context at any stage:
- Pause session between stages
- Add clarifications or new requirements
- Resume with updated context

### Model Comparison (Pro Tier, Coming Soon)

Run multiple pipelines in parallel to compare:
- Different AI combinations
- Quick vs Default vs Deep
- Side-by-side metrics (cost, quality, speed)
- Winner selection based on criteria

### Workspace Integration (Coming Soon)

- Save plans directly to workspaces
- Link plans to projects
- Team collaboration on plans
- Version history for plans

---

## FAQ

**Q: How much do sessions cost?**
A: ~$0.27 (Quick), ~$0.54 (Default), ~$0.81 (Deep) - billed directly by AI providers.

**Q: Can I use my own API keys?**
A: Yes! Cortex uses your API keys, so you pay providers directly.

**Q: Are my API keys safe?**
A: Yes. Keys are stored only in your browser's local storage and never sent to VibeForge.

**Q: Can I pause and resume later?**
A: Yes. Click "Pause" between stages and "Resume" when ready.

**Q: How long does a session take?**
A: Quick (~3 min), Default (~5 min), Deep (~10 min) - depends on provider speed.

**Q: Can I download past sessions?**
A: Yes. Go to "New Request" tab → "Recent Sessions" → click a session → go to "Output" tab.

**Q: What if I run out of quota?**
A: Upgrade to Pro ($20/month, 100 runs) or wait until next month (free tier resets).

**Q: Can I use Cortex offline?**
A: No. Cortex requires an internet connection to call AI provider APIs.

**Q: What languages are supported?**
A: Currently English only. The AI models support many languages, but UI is English.

**Q: Can I customize the workflow?**
A: Not yet. Custom workflows coming in future update.

---

## Support & Feedback

### Get Help

- **Documentation**: This guide + README.md
- **GitHub Issues**: https://github.com/VibeForge/vibeforge/issues
- **Email**: support@vibeforge.com (Enterprise only)

### Report Bugs

1. Check existing GitHub issues
2. Create new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and OS version
   - Session ID (from URL or console)

### Request Features

Use GitHub Discussions to propose:
- New workflow types
- Additional AI providers
- Integration ideas
- UI improvements

---

**Last Updated:** December 6, 2025
**Documentation Version:** 1.0.0
**Cortex Version:** 1.0.0
**License:** MIT
