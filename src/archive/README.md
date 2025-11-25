# Archived Components

This directory contains components and routes that were removed from active use during the workbench architecture refactoring.

## Archive Date
November 24, 2025

## Archived Items

### Demo Routes (`demo-routes/`)
- **demo/+page.svelte** - Original demo route for Phase 1
- **phase2-demo/+page.svelte** - Phase 2 feature demonstration route

These demo routes were used for testing and showcasing features during development but are not part of the production application.

### Demo Components (`demo-components/`)

#### Languages
- **LanguageSelector.svelte** - Language selection component (only used in demo routes)

#### Stacks
- **StackSelector.svelte** - Stack selection component
- **StackComparison.svelte** - Stack comparison view
- **StackCard.svelte** - Individual stack display card

These components were created for the demo routes and are not integrated into the main workbench flow.

### Demo Workbench Features (`demo-workbench/`)

#### Analytics
- **AnalyticsDashboard.svelte** - Analytics dashboard (Phase 2 demo only)

#### Deployment
- **DeploymentPanel.svelte** - Deployment configuration panel (Phase 2 demo only)

#### Chaining
- **PromptChain.svelte** - Prompt chaining visualization (Phase 2 demo only)

#### Prompts
- ~~**PromptSelector.svelte**~~ - **RESTORED** to `src/lib/workbench/prompts/` (production feature, not demo)

**Note:** PromptSelector was initially archived but restored during testing as it's used in the production ContextColumn component.

These workbench features were built for Phase 2 demonstrations but are not currently used in the production workbench.

## Reason for Archiving

These components were archived during the **workbench architecture refactoring** (Phase 5) which:
1. Consolidated the wizard into a modal overlay
2. Made the 3-column workbench the primary interface
3. Removed duplicate/obsolete components
4. Cleaned up demo-specific code that wasn't part of the production feature set

## Restoration

If you need to restore any of these components:
1. Copy the component back to its original location
2. Update any import paths if the codebase structure has changed
3. Verify all dependencies are still available
4. Test thoroughly as dependencies may have evolved

## Related Documentation

See also:
- `/docs/archive/` - Archived project documentation
- `VIBEFORGE_WORKBENCH_ARCHITECTURE.md` - Architecture refactoring plan
- `REFACTORING_COMPLETE.md` - Refactoring summary
