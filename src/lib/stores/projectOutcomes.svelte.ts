/**
 * projectOutcomes.svelte.ts
 *
 * Svelte 5 store for managing project outcome tracking and feedback collection
 * Phase 3.4: Outcome Tracking & Feedback Loop
 */

import type {
  ProjectOutcome,
  UserFeedback,
  PatternAnalytics,
  DashboardSummary,
  CreateProjectOutcomeRequest,
  SubmitFeedbackRequest,
  OutcomeFilter,
  PaginatedResponse,
} from '$lib/types/outcome';

// ============================================================================
// Store State
// ============================================================================

class ProjectOutcomesStore {
  // Project Outcomes
  outcomes = $state<ProjectOutcome[]>([]);
  selectedOutcome = $state<ProjectOutcome | null>(null);
  isLoadingOutcomes = $state(false);

  // Feedback
  feedbacks = $state<UserFeedback[]>([]);
  pendingFeedback = $state<string | null>(null); // project_outcome_id awaiting feedback
  showFeedbackModal = $state(false);
  isSubmittingFeedback = $state(false);

  // Analytics
  analytics = $state<PatternAnalytics[]>([]);
  dashboardSummary = $state<DashboardSummary | null>(null);
  isLoadingAnalytics = $state(false);

  // Pagination
  currentPage = $state(1);
  totalPages = $state(1);
  limit = $state(20);

  // Filters
  filters = $state<OutcomeFilter>({
    status: 'active',
  });

  // Error handling
  error = $state<string | null>(null);

  // ============================================================================
  // Computed Values
  // ============================================================================

  get activeProjects() {
    return this.outcomes.filter((o) => o.status === 'active');
  }

  get archivedProjects() {
    return this.outcomes.filter((o) => o.status === 'archived');
  }

  get recentProjects() {
    return this.outcomes
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }

  get hasPendingFeedback() {
    return this.pendingFeedback !== null;
  }

  // ============================================================================
  // Project Outcome Actions
  // ============================================================================

  /**
   * Create new project outcome after scaffolding
   */
  async createOutcome(data: CreateProjectOutcomeRequest): Promise<ProjectOutcome | null> {
    try {
      this.isLoadingOutcomes = true;
      this.error = null;

      // TODO: Replace with actual API call to DataForge
      const response = await this.mockCreateOutcome(data);

      if (response) {
        this.outcomes = [response, ...this.outcomes];

        // Prompt for feedback after 5 minutes
        setTimeout(() => {
          this.promptFeedback(response.id);
        }, 5 * 60 * 1000); // 5 minutes

        return response;
      }

      return null;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to create outcome';
      console.error('[ProjectOutcomesStore] Create outcome error:', err);
      return null;
    } finally {
      this.isLoadingOutcomes = false;
    }
  }

  /**
   * Fetch project outcomes with filters and pagination
   */
  async fetchOutcomes(page = 1): Promise<void> {
    try {
      this.isLoadingOutcomes = true;
      this.error = null;
      this.currentPage = page;

      // TODO: Replace with actual API call
      const response = await this.mockFetchOutcomes(this.filters, page, this.limit);

      this.outcomes = response.data;
      this.totalPages = Math.ceil(response.total / this.limit);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch outcomes';
      console.error('[ProjectOutcomesStore] Fetch outcomes error:', err);
    } finally {
      this.isLoadingOutcomes = false;
    }
  }

  /**
   * Get single project outcome by ID
   */
  async getOutcome(id: string): Promise<ProjectOutcome | null> {
    try {
      this.isLoadingOutcomes = true;
      this.error = null;

      // Check if already in state
      const existing = this.outcomes.find((o) => o.id === id);
      if (existing) {
        this.selectedOutcome = existing;
        return existing;
      }

      // TODO: Replace with actual API call
      const outcome = await this.mockGetOutcome(id);
      this.selectedOutcome = outcome;
      return outcome;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch outcome';
      console.error('[ProjectOutcomesStore] Get outcome error:', err);
      return null;
    } finally {
      this.isLoadingOutcomes = false;
    }
  }

  /**
   * Update project health metrics
   */
  async updateHealth(
    id: string,
    health: {
      lastBuildStatus?: 'success' | 'failure';
      testPassRate?: number;
      deploymentStatus?: 'deployed' | 'staging' | 'local';
    }
  ): Promise<boolean> {
    try {
      this.error = null;

      // TODO: Replace with actual API call
      const updated = await this.mockUpdateOutcome(id, health);

      if (updated) {
        // Update in local state
        const index = this.outcomes.findIndex((o) => o.id === id);
        if (index !== -1) {
          this.outcomes[index] = updated;
        }
        if (this.selectedOutcome?.id === id) {
          this.selectedOutcome = updated;
        }
        return true;
      }

      return false;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to update health';
      console.error('[ProjectOutcomesStore] Update health error:', err);
      return false;
    }
  }

  /**
   * Archive project (soft delete)
   */
  async archiveOutcome(id: string): Promise<boolean> {
    return this.updateHealth(id, { lastBuildStatus: undefined });
  }

  // ============================================================================
  // Feedback Actions
  // ============================================================================

  /**
   * Prompt user for feedback
   */
  promptFeedback(projectOutcomeId: string): void {
    this.pendingFeedback = projectOutcomeId;
    this.showFeedbackModal = true;
  }

  /**
   * Submit user feedback
   */
  async submitFeedback(data: SubmitFeedbackRequest): Promise<boolean> {
    try {
      this.isSubmittingFeedback = true;
      this.error = null;

      // TODO: Replace with actual API call
      const feedback = await this.mockSubmitFeedback(data);

      if (feedback) {
        this.feedbacks = [feedback, ...this.feedbacks];
        this.pendingFeedback = null;
        this.showFeedbackModal = false;
        return true;
      }

      return false;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to submit feedback';
      console.error('[ProjectOutcomesStore] Submit feedback error:', err);
      return false;
    } finally {
      this.isSubmittingFeedback = false;
    }
  }

  /**
   * Dismiss feedback prompt
   */
  dismissFeedback(): void {
    this.pendingFeedback = null;
    this.showFeedbackModal = false;
  }

  // ============================================================================
  // Analytics Actions
  // ============================================================================

  /**
   * Fetch pattern analytics
   */
  async fetchAnalytics(): Promise<void> {
    try {
      this.isLoadingAnalytics = true;
      this.error = null;

      // TODO: Replace with actual API call
      const analytics = await this.mockFetchAnalytics();
      this.analytics = analytics;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch analytics';
      console.error('[ProjectOutcomesStore] Fetch analytics error:', err);
    } finally {
      this.isLoadingAnalytics = false;
    }
  }

  /**
   * Fetch dashboard summary
   */
  async fetchDashboardSummary(): Promise<void> {
    try {
      this.isLoadingAnalytics = true;
      this.error = null;

      // TODO: Replace with actual API call
      const summary = await this.mockFetchDashboardSummary();
      this.dashboardSummary = summary;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch dashboard summary';
      console.error('[ProjectOutcomesStore] Fetch dashboard summary error:', err);
    } finally {
      this.isLoadingAnalytics = false;
    }
  }

  // ============================================================================
  // Filter Actions
  // ============================================================================

  setFilter(key: keyof OutcomeFilter, value: any): void {
    this.filters = { ...this.filters, [key]: value };
    this.fetchOutcomes(1); // Reset to page 1
  }

  clearFilters(): void {
    this.filters = { status: 'active' };
    this.fetchOutcomes(1);
  }

  // ============================================================================
  // Mock API Methods (Temporary - Replace with actual DataForge API)
  // ============================================================================

  private async mockCreateOutcome(data: CreateProjectOutcomeRequest): Promise<ProjectOutcome> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      id: crypto.randomUUID(),
      ...data,
      status: 'active',
      lastBuildStatus: null,
      lastBuildTimestamp: null,
      testPassRate: null,
      deploymentStatus: null,
      userId: null,
      workspaceId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessedAt: null,
    };
  }

  private async mockFetchOutcomes(
    filters: OutcomeFilter,
    page: number,
    limit: number
  ): Promise<PaginatedResponse<ProjectOutcome>> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock data - replace with actual API call
    const mockData: ProjectOutcome[] = [];
    const total = mockData.length;

    return {
      data: mockData.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  private async mockGetOutcome(id: string): Promise<ProjectOutcome | null> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return this.outcomes.find((o) => o.id === id) || null;
  }

  private async mockUpdateOutcome(
    id: string,
    updates: Partial<ProjectOutcome>
  ): Promise<ProjectOutcome | null> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const outcome = this.outcomes.find((o) => o.id === id);
    if (!outcome) return null;

    return {
      ...outcome,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }

  private async mockSubmitFeedback(data: SubmitFeedbackRequest): Promise<UserFeedback> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      id: crypto.randomUUID(),
      projectOutcomeId: data.projectOutcomeId,
      overallSatisfaction: data.overallSatisfaction,
      patternUsefulness: data.patternUsefulness || null,
      codeQuality: data.codeQuality || null,
      documentationClarity: data.documentationClarity || null,
      setupEase: data.setupEase || null,
      positiveAspects: data.positiveAspects || [],
      negativeAspects: data.negativeAspects || [],
      additionalComments: data.additionalComments || null,
      wouldRecommend: data.wouldRecommend || null,
      likelihoodToReuse: data.likelihoodToReuse || null,
      featureRequests: data.featureRequests || [],
      timeToFirstBuild: data.timeToFirstBuild || null,
      encounteredErrors: data.encounteredErrors || false,
      errorDetails: data.errorDetails || null,
      feedbackSource: data.feedbackSource || 'modal',
      submittedAt: new Date().toISOString(),
    };
  }

  private async mockFetchAnalytics(): Promise<PatternAnalytics[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return []; // Mock empty data
  }

  private async mockFetchDashboardSummary(): Promise<DashboardSummary> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      totalProjects: this.outcomes.length,
      activeProjects: this.activeProjects.length,
      archivedProjects: this.archivedProjects.length,
      averageSatisfaction: null,
      topPatterns: [],
      recentProjects: this.recentProjects,
      feedbackRate: 0,
    };
  }
}

// ============================================================================
// Export Store Instance
// ============================================================================

export const projectOutcomesStore = new ProjectOutcomesStore();
