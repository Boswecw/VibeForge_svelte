# VibeForge Documentation Index

> **Complete guide to all VibeForge documentation**

**Last Updated**: 2025-01-26
**Version**: 5.3.0

---

## 📚 Quick Navigation

### For Users

- **[README.md](./README.md)** - Start here! Project overview and quick start
- **[SETUP.md](./SETUP.md)** - Installation and configuration guide
- **[USER_GUIDE.md](./docs/USER_GUIDE.md)** - Complete workbench usage guide
- **[FEATURES.md](./FEATURES.md)** - Detailed feature documentation

### For Developers

- **[DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md)** - Complete developer onboarding
- **[API Reference](./docs/api/README.md)** - Complete API documentation
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Technical architecture and patterns
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development workflow and practices
- **[TESTING.md](./TESTING.md)** - Testing procedures and guidelines

### For Integrators

- **[MCP_GUIDE.md](./docs/MCP_GUIDE.md)** - Model Context Protocol integration
- **[CI_CD_SETUP.md](./CI_CD_SETUP.md)** - CI/CD configuration

### Project Information

- **[PHASE2_COMPLETE.md](./PHASE2_COMPLETE.md)** - Phase 2 completion certificate
- **[PHASE3_COMPLETE.md](./PHASE3_COMPLETE.md)** - Phase 3 completion certificate
- **[VIBEFORGE_ROADMAP.md](./docs/VIBEFORGE_ROADMAP.md)** - Future plans and roadmap
- **[INDEX.md](./INDEX.md)** - Legacy index (older format)

---

## 📁 Documentation Structure

```
vibeforge/
├── README.md                    # Main project overview
├── SETUP.md                     # Setup instructions
├── FEATURES.md                  # Feature documentation
├── DEVELOPMENT.md               # Development workflow
├── TESTING.md                   # Testing guide
├── CI_CD_SETUP.md               # CI/CD configuration
├── PHASE2_COMPLETE.md           # Phase 2 milestone completion
├── PHASE3_COMPLETE.md           # Phase 3 milestone completion
│
└── docs/
    ├── ARCHITECTURE.md          # Technical architecture
    ├── USER_GUIDE.md            # User documentation
    ├── DEVELOPER_GUIDE.md       # Developer onboarding
    ├── MCP_GUIDE.md             # MCP integration
    ├── VIBEFORGE_ROADMAP.md     # Project roadmap
    │
    ├── api/                     # API Reference
    │   ├── README.md            # API overview
    │   └── stores/              # Store documentation
    │       ├── theme.md
    │       ├── workspace.md
    │       ├── contextBlocks.md
    │       ├── prompt.md
    │       ├── models.md
    │       ├── runs.md
    │       └── tools.md
    │
    ├── guides/                  # Empty (consolidated)
    │
    └── archive/                 # Historical documentation
        ├── old-progress-reports/
        └── old-guides/
```

---

## 📖 Documentation by Topic

### Getting Started

1. **[README.md](./README.md)** - Overview, features, quick start
2. **[SETUP.md](./SETUP.md)** - Installation, prerequisites, configuration
3. **[USER_GUIDE.md](./docs/USER_GUIDE.md)** - Workbench tutorial, workflow examples
4. **[FEATURES.md](./FEATURES.md)** - Detailed feature list

**Reading Order**: README → SETUP → USER_GUIDE → FEATURES

### Development

1. **[DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md)** - Onboarding, project structure, workflows
2. **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Technical design, patterns, data flow
3. **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Day-to-day development practices
4. **[API Reference](./docs/api/README.md)** - Complete store API documentation
5. **[TESTING.md](./TESTING.md)** - Testing strategy, running tests

**Reading Order**: DEVELOPER_GUIDE → ARCHITECTURE → DEVELOPMENT → API Reference

### Integration

1. **[MCP_GUIDE.md](./docs/MCP_GUIDE.md)** - MCP protocol, servers, tools, invocation
2. **[CI_CD_SETUP.md](./CI_CD_SETUP.md)** - GitHub Actions, deployment pipelines

### API Reference

Complete documentation for all 7 Svelte 5 rune-based stores:

1. **[Theme Store](./docs/api/stores/theme.md)** - Dark/light theme management
2. **[Workspace Store](./docs/api/stores/workspace.md)** - Workspace state and CRUD
3. **[Context Blocks Store](./docs/api/stores/contextBlocks.md)** - Context management
4. **[Prompt Store](./docs/api/stores/prompt.md)** - Prompt composition and variables
5. **[Models Store](./docs/api/stores/models.md)** - Model selection and cost estimation
6. **[Runs Store](./docs/api/stores/runs.md)** - Execution history and analytics
7. **[Tools Store](./docs/api/stores/tools.md)** - MCP tools and invocations

**Reading Order**: Start with [API Overview](./docs/api/README.md), then explore specific stores as needed.

---

## 🎯 Documentation by Role

### I'm a New User

Start with:
1. [README.md](./README.md) - Understand what VibeForge does
2. [SETUP.md](./SETUP.md) - Install and configure
3. [USER_GUIDE.md](./docs/USER_GUIDE.md) - Learn the workbench
4. [FEATURES.md](./FEATURES.md) - Explore features

### I'm a New Developer

Start with:
1. [DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) - Complete onboarding
2. [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Understand the system
3. [DEVELOPMENT.md](./DEVELOPMENT.md) - Daily workflows
4. [TESTING.md](./TESTING.md) - Write and run tests

### I'm Integrating with VibeForge

Start with:
1. [MCP_GUIDE.md](./docs/MCP_GUIDE.md) - MCP protocol integration
2. [API Reference](./docs/api/README.md) - Store APIs
3. [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System design

### I'm Setting Up CI/CD

Start with:
1. [CI_CD_SETUP.md](./CI_CD_SETUP.md) - Pipeline configuration
2. [TESTING.md](./TESTING.md) - Test automation

---

## 🔍 Find Information

### How do I...?

**...install VibeForge?**
→ [SETUP.md](./SETUP.md)

**...use the workbench?**
→ [USER_GUIDE.md](./docs/USER_GUIDE.md)

**...contribute code?**
→ [DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) → [DEVELOPMENT.md](./DEVELOPMENT.md)

**...integrate with MCP?**
→ [MCP_GUIDE.md](./docs/MCP_GUIDE.md)

**...use a specific store?**
→ [API Reference](./docs/api/README.md) → Select store

**...run tests?**
→ [TESTING.md](./TESTING.md)

**...understand the architecture?**
→ [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

**...see what's coming next?**
→ [VIBEFORGE_ROADMAP.md](./docs/VIBEFORGE_ROADMAP.md)

---

## 📊 Documentation Stats

**Total Documentation**: 20 primary documents
**API Documentation**: 1 index + 7 store guides
**User Guides**: 1 comprehensive guide
**Developer Guides**: 2 guides (onboarding + development)
**Integration Guides**: 1 guide (MCP)
**Milestone Certificates**: 2 (Phase 2 + Phase 3)
**Test Coverage**: 321 unit tests + 5 E2E scenarios documented

---

## 🔄 Documentation Updates

### Recent Changes (2025-01-26)

**Phase 3: Documentation Enhancement Complete ✅**

✅ Created comprehensive API reference for all 7 stores
✅ Created unified USER_GUIDE.md (610 lines)
✅ Created DEVELOPER_GUIDE.md for onboarding (725 lines)
✅ Created MCP_GUIDE.md for integration (730 lines)
✅ Created DOCUMENTATION_INDEX.md for navigation (256 lines)
✅ Consolidated and archived 40+ old documentation files
✅ Reorganized documentation structure
✅ Created PHASE3_COMPLETE.md completion certificate

**Archived Documents**:
- 40+ old progress reports → `docs/archive/old-progress-reports/`
- Old guide fragments → `docs/archive/old-guides/`

**Total Documentation Created**: ~5,121 lines of comprehensive documentation

---

## 📝 Contributing to Documentation

When updating documentation:

1. **Keep README.md Current**: Update main entry point for any significant changes
2. **Update This Index**: Add new documents to this index
3. **Follow Existing Patterns**: Match structure and style of existing docs
4. **Link Generously**: Cross-reference related documentation
5. **Date Your Changes**: Include "Last Updated" date in doc headers

### Documentation Standards

- Use clear, concise language
- Include code examples where applicable
- Provide usage examples for APIs
- Add troubleshooting sections
- Include visual aids (diagrams, tables) when helpful
- Keep table of contents up to date

---

## 🗂️ Archived Documentation

Historical documentation is preserved in:
- **`docs/archive/old-progress-reports/`** - Phase progress reports, summaries
- **`docs/archive/old-guides/`** - Superseded guide fragments

Archived docs are kept for historical reference but may be outdated.

---

## 📧 Documentation Questions

For documentation questions:
- **Missing Information?** Open an issue with "Docs:" prefix
- **Found an Error?** Submit a PR with fix
- **Suggest Improvement?** Open a discussion

---

**© 2025 Boswell Digital Solutions LLC**
**All Rights Reserved**
