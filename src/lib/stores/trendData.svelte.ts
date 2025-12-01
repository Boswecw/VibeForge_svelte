/**
 * Trend Data Store
 * Phase 3.7: Real-Time Data & Learning System Refinement
 *
 * Caches and manages time-series trend data for analytics visualization
 */

import type { TrendDataPoint } from '$lib/types/success-prediction';
import type { ProjectOutcome } from '$lib/types/outcome';
import { projectOutcomesStore } from './projectOutcomes.svelte';

// ============================================================================
// Types
// ============================================================================

interface TrendDataCache {
  data: TrendDataPoint[];
  timestamp: number;
  ttl: number; // milliseconds
}

interface TimeSeriesBucket {
  date: string; // ISO date (YYYY-MM-DD)
  count: number;
  successRate: number;
  avgSatisfaction: number;
  avgTestPassRate: number;
}

export type TrendPeriod = 7 | 30 | 90;

// ============================================================================
// Store State
// ============================================================================

class TrendDataStore {
  // Cache storage by key (patternId-days)
  private cache = $state<Map<string, TrendDataCache>>(new Map());

  // Loading state
  isLoading = $state(false);
  error = $state<string | null>(null);

  // Cache TTL: 5 minutes
  private readonly CACHE_TTL = 5 * 60 * 1000;

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Fetch trend data for a pattern (with caching)
   */
  async fetchTrendData(
    patternId: string,
    days: TrendPeriod = 30
  ): Promise<TrendDataPoint[]> {
    const cacheKey = `${patternId}-${days}`;

    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      this.isLoading = true;
      this.error = null;

      // Get all outcomes for this pattern
      const allOutcomes = projectOutcomesStore.outcomes.filter(
        (o) => o.patternId === patternId && o.status === 'active'
      );

      // Aggregate by date buckets
      const buckets = this.aggregateByDay(allOutcomes, days);

      // Convert to trend data points
      const trendData = buckets.map((bucket) => ({
        date: bucket.date,
        value: bucket.successRate,
        label: this.formatDateLabel(bucket.date),
      }));

      // Cache the result
      this.setCached(cacheKey, trendData);

      return trendData;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch trend data';
      console.error('[TrendDataStore] Fetch trend data error:', err);
      return [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Fetch success rate trend data
   */
  async fetchSuccessRateTrend(
    patternId: string,
    days: TrendPeriod = 30
  ): Promise<TrendDataPoint[]> {
    const cacheKey = `${patternId}-success-${days}`;

    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const allOutcomes = projectOutcomesStore.outcomes.filter(
        (o) => o.patternId === patternId && o.status === 'active'
      );

      const buckets = this.aggregateByDay(allOutcomes, days);

      const trendData = buckets.map((bucket) => ({
        date: bucket.date,
        value: bucket.successRate,
        label: this.formatDateLabel(bucket.date),
      }));

      this.setCached(cacheKey, trendData);
      return trendData;
    } catch (err) {
      console.error('[TrendDataStore] Fetch success rate trend error:', err);
      return [];
    }
  }

  /**
   * Fetch satisfaction trend data
   */
  async fetchSatisfactionTrend(
    patternId: string,
    days: TrendPeriod = 30
  ): Promise<TrendDataPoint[]> {
    const cacheKey = `${patternId}-satisfaction-${days}`;

    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const allOutcomes = projectOutcomesStore.outcomes.filter(
        (o) => o.patternId === patternId && o.status === 'active'
      );

      const buckets = this.aggregateByDay(allOutcomes, days);

      const trendData = buckets.map((bucket) => ({
        date: bucket.date,
        value: bucket.avgSatisfaction,
        label: this.formatDateLabel(bucket.date),
      }));

      this.setCached(cacheKey, trendData);
      return trendData;
    } catch (err) {
      console.error('[TrendDataStore] Fetch satisfaction trend error:', err);
      return [];
    }
  }

  /**
   * Fetch usage trend data
   */
  async fetchUsageTrend(
    patternId: string,
    days: TrendPeriod = 30
  ): Promise<TrendDataPoint[]> {
    const cacheKey = `${patternId}-usage-${days}`;

    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const allOutcomes = projectOutcomesStore.outcomes.filter(
        (o) => o.patternId === patternId && o.status === 'active'
      );

      const buckets = this.aggregateByDay(allOutcomes, days);

      const trendData = buckets.map((bucket) => ({
        date: bucket.date,
        value: bucket.count,
        label: this.formatDateLabel(bucket.date),
      }));

      this.setCached(cacheKey, trendData);
      return trendData;
    } catch (err) {
      console.error('[TrendDataStore] Fetch usage trend error:', err);
      return [];
    }
  }

  /**
   * Invalidate cache for a pattern
   */
  invalidatePattern(patternId: string): void {
    const keysToDelete: string[] = [];

    for (const [key] of this.cache) {
      if (key.startsWith(patternId)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ============================================================================
  // Private Methods - Data Aggregation
  // ============================================================================

  /**
   * Aggregate outcomes by day
   */
  private aggregateByDay(
    outcomes: ProjectOutcome[],
    days: number
  ): TimeSeriesBucket[] {
    const now = new Date();
    const buckets = new Map<string, TimeSeriesBucket>();

    // Initialize buckets for each day
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      buckets.set(dateKey, {
        date: dateKey,
        count: 0,
        successRate: 0,
        avgSatisfaction: 0,
        avgTestPassRate: 0,
      });
    }

    // Aggregate outcomes into buckets
    outcomes.forEach((outcome) => {
      const outcomeDate = new Date(outcome.createdAt);
      const dateKey = outcomeDate.toISOString().split('T')[0];

      const bucket = buckets.get(dateKey);
      if (bucket) {
        bucket.count += 1;

        // Track success
        if (outcome.lastBuildStatus === 'success') {
          bucket.successRate += 1;
        }

        // Track satisfaction (if feedback available)
        // Note: In real implementation, this would come from feedback data
        // For now, we'll estimate based on build status
        if (outcome.lastBuildStatus === 'success') {
          bucket.avgSatisfaction += 4; // Good satisfaction
        } else if (outcome.lastBuildStatus === 'failure') {
          bucket.avgSatisfaction += 2; // Poor satisfaction
        } else {
          bucket.avgSatisfaction += 3; // Neutral
        }

        // Track test pass rate
        if (outcome.testPassRate !== null) {
          bucket.avgTestPassRate += outcome.testPassRate;
        }
      }
    });

    // Calculate averages and percentages
    const result: TimeSeriesBucket[] = [];

    for (const bucket of buckets.values()) {
      if (bucket.count > 0) {
        bucket.successRate = (bucket.successRate / bucket.count) * 100;
        bucket.avgSatisfaction = bucket.avgSatisfaction / bucket.count;
        bucket.avgTestPassRate = bucket.avgTestPassRate / bucket.count;
      } else {
        // Fill gaps with interpolation (if neighbors exist)
        bucket.successRate = 0;
        bucket.avgSatisfaction = 0;
        bucket.avgTestPassRate = 0;
      }

      result.push(bucket);
    }

    // Fill sparse data with interpolation
    return this.interpolateSparseData(result);
  }

  /**
   * Interpolate sparse data to fill gaps
   */
  private interpolateSparseData(buckets: TimeSeriesBucket[]): TimeSeriesBucket[] {
    const result = [...buckets];

    for (let i = 1; i < result.length - 1; i++) {
      const current = result[i];

      // If no data for this day, interpolate from neighbors
      if (current.count === 0) {
        const prev = result[i - 1];
        const next = result[i + 1];

        if (prev.count > 0 && next.count > 0) {
          current.successRate = (prev.successRate + next.successRate) / 2;
          current.avgSatisfaction = (prev.avgSatisfaction + next.avgSatisfaction) / 2;
          current.avgTestPassRate = (prev.avgTestPassRate + next.avgTestPassRate) / 2;
        } else if (prev.count > 0) {
          current.successRate = prev.successRate;
          current.avgSatisfaction = prev.avgSatisfaction;
          current.avgTestPassRate = prev.avgTestPassRate;
        } else if (next.count > 0) {
          current.successRate = next.successRate;
          current.avgSatisfaction = next.avgSatisfaction;
          current.avgTestPassRate = next.avgTestPassRate;
        }
      }
    }

    return result;
  }

  // ============================================================================
  // Private Methods - Caching
  // ============================================================================

  /**
   * Get cached data if valid
   */
  private getCached(key: string): TrendDataPoint[] | null {
    const cached = this.cache.get(key);

    if (!cached) return null;

    const now = Date.now();
    const age = now - cached.timestamp;

    // Check if cache is still valid
    if (age < cached.ttl) {
      return cached.data;
    }

    // Cache expired, remove it
    this.cache.delete(key);
    return null;
  }

  /**
   * Set cached data
   */
  private setCached(key: string, data: TrendDataPoint[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL,
    });
  }

  // ============================================================================
  // Private Methods - Formatting
  // ============================================================================

  /**
   * Format date label for display
   */
  private formatDateLabel(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

// ============================================================================
// Export Store Instance
// ============================================================================

export const trendDataStore = new TrendDataStore();
