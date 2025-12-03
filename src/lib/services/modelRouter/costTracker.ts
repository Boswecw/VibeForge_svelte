/**
 * Cost Tracker Service
 * Tracks LLM usage costs and manages budgets
 */

import type {
  CostEntry,
  CostBudget,
  CostAlert,
  TaskCategory,
  LLMProvider,
} from "./types";
import { MODEL_CAPABILITIES } from "./types";

export class CostTracker {
  private entries: CostEntry[] = [];
  private budget: CostBudget | null = null;
  private alertCallbacks: Array<(alert: CostAlert) => void> = [];

  /**
   * Track a usage event
   */
  track(
    entry: Omit<
      CostEntry,
      "id" | "timestamp" | "inputCost" | "outputCost" | "totalCost"
    >
  ): CostEntry {
    // Calculate costs
    const model = MODEL_CAPABILITIES[entry.modelId];
    if (!model) {
      throw new Error(`Unknown model: ${entry.modelId}`);
    }

    const inputCost = (entry.promptTokens / 1_000_000) * model.inputCostPer1M;
    const outputCost =
      (entry.completionTokens / 1_000_000) * model.outputCostPer1M;
    const totalCost = inputCost + outputCost;

    const fullEntry: CostEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date(),
      inputCost,
      outputCost,
      totalCost,
    };

    this.entries.push(fullEntry);

    // Update budget
    if (this.budget) {
      this.updateBudget(totalCost);
      this.checkBudgetAlerts();
    }

    return fullEntry;
  }

  /**
   * Track usage with simplified parameters (convenience method)
   */
  trackUsage(
    provider: LLMProvider,
    modelId: string,
    taskCategory: TaskCategory,
    promptTokens: number,
    completionTokens: number
  ): CostEntry {
    return this.track({
      modelId,
      provider,
      taskCategory,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    });
  }

  /**
   * Set budget limits
   */
  setBudget(budget: Partial<CostBudget>): void {
    const now = new Date();

    this.budget = {
      dailyLimit: budget.dailyLimit,
      weeklyLimit: budget.weeklyLimit,
      monthlyLimit: budget.monthlyLimit,
      dailySpent: budget.dailySpent || 0,
      weeklySpent: budget.weeklySpent || 0,
      monthlySpent: budget.monthlySpent || 0,
      warningThreshold: budget.warningThreshold || 0.8,
      dailyResetAt: budget.dailyResetAt || this.getNextDayReset(now),
      weeklyResetAt: budget.weeklyResetAt || this.getNextWeekReset(now),
      monthlyResetAt: budget.monthlyResetAt || this.getNextMonthReset(now),
    };
  }

  /**
   * Get current budget status
   */
  getBudget(): CostBudget | null {
    if (!this.budget) return null;

    // Check if reset needed
    this.checkBudgetResets();

    return { ...this.budget };
  }

  /**
   * Update budget with new cost
   */
  private updateBudget(cost: number): void {
    if (!this.budget) return;

    this.budget.dailySpent += cost;
    this.budget.weeklySpent += cost;
    this.budget.monthlySpent += cost;
  }

  /**
   * Check budget resets
   */
  private checkBudgetResets(): void {
    if (!this.budget) return;

    const now = new Date();

    // Daily reset
    if (now >= this.budget.dailyResetAt) {
      this.budget.dailySpent = 0;
      this.budget.dailyResetAt = this.getNextDayReset(now);
    }

    // Weekly reset
    if (now >= this.budget.weeklyResetAt) {
      this.budget.weeklySpent = 0;
      this.budget.weeklyResetAt = this.getNextWeekReset(now);
    }

    // Monthly reset
    if (now >= this.budget.monthlyResetAt) {
      this.budget.monthlySpent = 0;
      this.budget.monthlyResetAt = this.getNextMonthReset(now);
    }
  }

  /**
   * Check for budget alerts
   */
  private checkBudgetAlerts(): void {
    if (!this.budget) return;

    const alerts: CostAlert[] = [];

    // Check daily limit
    if (this.budget.dailyLimit) {
      const dailyPercent = this.budget.dailySpent / this.budget.dailyLimit;
      if (dailyPercent >= 1.0) {
        alerts.push(
          this.createAlert(
            "critical",
            "daily",
            this.budget.dailySpent,
            this.budget.dailyLimit,
            dailyPercent
          )
        );
      } else if (dailyPercent >= this.budget.warningThreshold) {
        alerts.push(
          this.createAlert(
            "warning",
            "daily",
            this.budget.dailySpent,
            this.budget.dailyLimit,
            dailyPercent
          )
        );
      }
    }

    // Check weekly limit
    if (this.budget.weeklyLimit) {
      const weeklyPercent = this.budget.weeklySpent / this.budget.weeklyLimit;
      if (weeklyPercent >= 1.0) {
        alerts.push(
          this.createAlert(
            "critical",
            "weekly",
            this.budget.weeklySpent,
            this.budget.weeklyLimit,
            weeklyPercent
          )
        );
      } else if (weeklyPercent >= this.budget.warningThreshold) {
        alerts.push(
          this.createAlert(
            "warning",
            "weekly",
            this.budget.weeklySpent,
            this.budget.weeklyLimit,
            weeklyPercent
          )
        );
      }
    }

    // Check monthly limit
    if (this.budget.monthlyLimit) {
      const monthlyPercent =
        this.budget.monthlySpent / this.budget.monthlyLimit;
      if (monthlyPercent >= 1.0) {
        alerts.push(
          this.createAlert(
            "critical",
            "monthly",
            this.budget.monthlySpent,
            this.budget.monthlyLimit,
            monthlyPercent
          )
        );
      } else if (monthlyPercent >= this.budget.warningThreshold) {
        alerts.push(
          this.createAlert(
            "warning",
            "monthly",
            this.budget.monthlySpent,
            this.budget.monthlyLimit,
            monthlyPercent
          )
        );
      }
    }

    // Emit alerts
    alerts.forEach((alert) => this.emitAlert(alert));
  }

  /**
   * Create cost alert
   */
  private createAlert(
    type: CostAlert["type"],
    period: CostAlert["period"],
    spent: number,
    limit: number,
    percentage: number
  ): CostAlert {
    let message: string;
    if (type === "critical") {
      message = `${period.charAt(0).toUpperCase() + period.slice(1)} budget limit reached! Spent $${spent.toFixed(2)} of $${limit.toFixed(2)}`;
    } else {
      message = `${period.charAt(0).toUpperCase() + period.slice(1)} budget at ${Math.round(percentage * 100)}%. Spent $${spent.toFixed(2)} of $${limit.toFixed(2)}`;
    }

    return {
      type,
      period,
      currentSpent: spent,
      limit,
      percentage,
      message,
      timestamp: new Date(),
    };
  }

  /**
   * Register alert callback
   */
  onAlert(callback: (alert: CostAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit alert to callbacks
   */
  private emitAlert(alert: CostAlert): void {
    this.alertCallbacks.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        console.error("Error in alert callback:", error);
      }
    });
  }

  /**
   * Get cost summary
   */
  getSummary(
    startDate?: Date,
    endDate?: Date
  ): {
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
    byProvider: Record<
      LLMProvider,
      { cost: number; tokens: number; requests: number }
    >;
    byCategory: Record<
      TaskCategory,
      { cost: number; tokens: number; requests: number }
    >;
    entries: CostEntry[];
  } {
    const filtered = this.filterEntries(startDate, endDate);

    const byProvider: Partial<Record<
      LLMProvider,
      { cost: number; tokens: number; requests: number }
    >> = {};
    const byCategory: Partial<Record<
      TaskCategory,
      { cost: number; tokens: number; requests: number }
    >> = {};

    let totalCost = 0;
    let totalTokens = 0;

    filtered.forEach((entry) => {
      totalCost += entry.totalCost;
      totalTokens += entry.totalTokens;

      // By provider
      if (!byProvider[entry.provider]) {
        byProvider[entry.provider] = { cost: 0, tokens: 0, requests: 0 };
      }
      byProvider[entry.provider]!.cost += entry.totalCost;
      byProvider[entry.provider]!.tokens += entry.totalTokens;
      byProvider[entry.provider]!.requests += 1;

      // By category
      if (!byCategory[entry.taskCategory]) {
        byCategory[entry.taskCategory] = { cost: 0, tokens: 0, requests: 0 };
      }
      byCategory[entry.taskCategory]!.cost += entry.totalCost;
      byCategory[entry.taskCategory]!.tokens += entry.totalTokens;
      byCategory[entry.taskCategory]!.requests += 1;
    });

    return {
      totalCost,
      totalTokens,
      totalRequests: filtered.length,
      byProvider: byProvider as Record<LLMProvider, { cost: number; tokens: number; requests: number }>,
      byCategory: byCategory as Record<TaskCategory, { cost: number; tokens: number; requests: number }>,
      entries: filtered,
    };
  }

  /**
   * Get cost entries
   */
  getEntries(startDate?: Date, endDate?: Date): CostEntry[] {
    return this.filterEntries(startDate, endDate);
  }

  /**
   * Filter entries by date range
   */
  private filterEntries(startDate?: Date, endDate?: Date): CostEntry[] {
    return this.entries.filter((entry) => {
      if (startDate && entry.timestamp < startDate) return false;
      if (endDate && entry.timestamp > endDate) return false;
      return true;
    });
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Export to JSON
   */
  export(): string {
    return JSON.stringify(
      {
        entries: this.entries,
        budget: this.budget,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * Import from JSON
   */
  import(json: string): void {
    try {
      const data = JSON.parse(json);
      interface SerializedEntry extends Omit<CostEntry, 'timestamp'> {
        timestamp: string;
      }
      this.entries = (data.entries as SerializedEntry[]).map((e) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      }));
      if (data.budget) {
        this.budget = {
          ...data.budget,
          dailyResetAt: new Date(data.budget.dailyResetAt),
          weeklyResetAt: new Date(data.budget.weeklyResetAt),
          monthlyResetAt: new Date(data.budget.monthlyResetAt),
        };
      }
    } catch (error) {
      throw new Error(`Failed to import cost data: ${error}`);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get next day reset time
   */
  private getNextDayReset(from: Date): Date {
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  /**
   * Get next week reset time (Monday)
   */
  private getNextWeekReset(from: Date): Date {
    const next = new Date(from);
    const dayOfWeek = next.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    next.setDate(next.getDate() + daysUntilMonday);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  /**
   * Get next month reset time
   */
  private getNextMonthReset(from: Date): Date {
    const next = new Date(from);
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);
    next.setHours(0, 0, 0, 0);
    return next;
  }
}

/**
 * Singleton instance
 */
export const costTracker = new CostTracker();
