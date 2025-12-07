/**
 * VF-312: Marketplace Store
 *
 * Svelte 5 runes store for pattern marketplace functionality:
 * - Browse and search community patterns
 * - Install, favorite, and rate patterns
 * - Submit patterns to marketplace
 * - Leave reviews and ratings
 * - Report inappropriate content
 */

import type {
	MarketplacePattern,
	MarketplaceFilters,
	PatternReview,
	AuthorProfile,
	PatternSubmission,
	ContentReport,
	ReportReason,
	UserMarketplaceProfile,
	MarketplaceAnalytics
} from '../types/marketplace';
import type { PromptPattern } from '../types/patterns';

/**
 * Marketplace state
 */
interface MarketplaceState {
	// Patterns
	patterns: MarketplacePattern[];
	selectedPattern: MarketplacePattern | null;
	// Reviews
	reviews: Record<string, PatternReview[]>; // patternId → reviews
	// User profile
	userProfile: UserMarketplaceProfile | null;
	// Authors
	authors: Record<string, AuthorProfile>; // authorId → profile
	// Filters
	filters: MarketplaceFilters;
	// UI state
	isLoading: boolean;
	error: string | null;
	// Pagination
	currentPage: number;
	totalPages: number;
	pageSize: number;
	// Analytics
	analytics: MarketplaceAnalytics | null;
}

// Initial state
const state = $state<MarketplaceState>({
	patterns: [],
	selectedPattern: null,
	reviews: {},
	userProfile: null,
	authors: {},
	filters: {
		sortBy: 'popular',
		sortDirection: 'desc'
	},
	isLoading: false,
	error: null,
	currentPage: 1,
	totalPages: 1,
	pageSize: 20,
	analytics: null
});

/**
 * Filtered patterns based on current filters
 */
const filteredPatterns = $derived.by(() => {
	let filtered = [...state.patterns];

	// Query search
	if (state.filters.query?.trim()) {
		const query = state.filters.query.toLowerCase();
		filtered = filtered.filter(
			(p) =>
				p.name.toLowerCase().includes(query) ||
				p.description.toLowerCase().includes(query) ||
				p.tags.some((tag) => tag.toLowerCase().includes(query)) ||
				p.authorName.toLowerCase().includes(query)
		);
	}

	// Category filter
	if (state.filters.category) {
		filtered = filtered.filter((p) => p.category === state.filters.category);
	}

	// Tags filter
	if (state.filters.tags && state.filters.tags.length > 0) {
		filtered = filtered.filter((p) => state.filters.tags!.some((tag) => p.tags.includes(tag)));
	}

	// Author filter
	if (state.filters.authorId) {
		filtered = filtered.filter((p) => p.authorId === state.filters.authorId);
	}

	// Min rating filter
	if (state.filters.minRating) {
		filtered = filtered.filter(
			(p) => p.averageRating !== undefined && p.averageRating >= state.filters.minRating!
		);
	}

	// Min downloads filter
	if (state.filters.minDownloads) {
		filtered = filtered.filter((p) => p.downloadCount >= state.filters.minDownloads!);
	}

	// Verified authors only
	if (state.filters.verified) {
		filtered = filtered.filter((p) => p.authorVerified);
	}

	// Featured only
	if (state.filters.featured) {
		filtered = filtered.filter((p) => p.isPublic); // Assuming featured = public
	}

	// Sorting
	const sortBy = state.filters.sortBy || 'popular';
	const direction = state.filters.sortDirection === 'desc' ? -1 : 1;

	filtered.sort((a, b) => {
		let comparison = 0;

		switch (sortBy) {
			case 'popular':
				comparison = a.downloadCount - b.downloadCount;
				break;
			case 'recent':
				comparison =
					new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
				break;
			case 'rating':
				comparison = (a.averageRating || 0) - (b.averageRating || 0);
				break;
			case 'downloads':
				comparison = a.downloadCount - b.downloadCount;
				break;
			case 'name':
				comparison = a.name.localeCompare(b.name);
				break;
		}

		return comparison * direction;
	});

	return filtered;
});

/**
 * User's installed pattern IDs
 */
const installedPatternIds = $derived(state.userProfile?.installedPatterns || []);

/**
 * User's favorited pattern IDs
 */
const favoritedPatternIds = $derived(state.userProfile?.favoritedPatterns || []);

/**
 * Popular patterns (top 10 by downloads)
 */
const popularPatterns = $derived.by(() => {
	return [...state.patterns]
		.sort((a, b) => b.downloadCount - a.downloadCount)
		.slice(0, 10);
});

/**
 * Recent patterns (last 10 published)
 */
const recentPatterns = $derived.by(() => {
	return [...state.patterns]
		.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
		.slice(0, 10);
});

/**
 * Top-rated patterns (top 10 by average rating)
 */
const topRatedPatterns = $derived.by(() => {
	return [...state.patterns]
		.filter((p) => p.averageRating !== undefined && p.ratingCount && p.ratingCount >= 5) // Min 5 ratings
		.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
		.slice(0, 10);
});

/**
 * Browse marketplace patterns
 */
async function browsePatterns(filters?: MarketplaceFilters): Promise<void> {
	state.isLoading = true;
	state.error = null;

	try {
		// Apply filters if provided
		if (filters) {
			state.filters = { ...state.filters, ...filters };
		}

		// In a real implementation, this would call the DataForge API
		// For now, we'll simulate with mock data
		const response = await mockFetchPatterns(state.filters, state.currentPage, state.pageSize);

		state.patterns = response.patterns;
		state.totalPages = Math.ceil(response.total / state.pageSize);
	} catch (err) {
		state.error = err instanceof Error ? err.message : 'Failed to browse patterns';
	} finally {
		state.isLoading = false;
	}
}

/**
 * Load pattern details
 */
async function loadPattern(patternId: string): Promise<void> {
	state.isLoading = true;
	state.error = null;

	try {
		// In real implementation, call DataForge API
		const response = await mockFetchPatternDetails(patternId);

		state.selectedPattern = response.pattern;
		state.reviews[patternId] = response.reviews;
	} catch (err) {
		state.error = err instanceof Error ? err.message : 'Failed to load pattern';
	} finally {
		state.isLoading = false;
	}
}

/**
 * Install a pattern
 */
async function installPattern(patternId: string): Promise<void> {
	state.isLoading = true;
	state.error = null;

	try {
		// In real implementation, call DataForge API
		await mockInstallPattern(patternId);

		// Update local state
		if (state.userProfile) {
			state.userProfile.installedPatterns.push(patternId);
		}

		// Update pattern install status
		const pattern = state.patterns.find((p) => p.id === patternId);
		if (pattern) {
			pattern.isInstalled = true;
			pattern.downloadCount++;
		}

		if (state.selectedPattern?.id === patternId) {
			state.selectedPattern.isInstalled = true;
			state.selectedPattern.downloadCount++;
		}
	} catch (err) {
		state.error = err instanceof Error ? err.message : 'Failed to install pattern';
	} finally {
		state.isLoading = false;
	}
}

/**
 * Uninstall a pattern
 */
async function uninstallPattern(patternId: string): Promise<void> {
	if (!state.userProfile) return;

	state.userProfile.installedPatterns = state.userProfile.installedPatterns.filter(
		(id) => id !== patternId
	);

	// Update pattern install status
	const pattern = state.patterns.find((p) => p.id === patternId);
	if (pattern) {
		pattern.isInstalled = false;
	}

	if (state.selectedPattern?.id === patternId) {
		state.selectedPattern.isInstalled = false;
	}
}

/**
 * Favorite a pattern
 */
async function favoritePattern(patternId: string): Promise<void> {
	state.isLoading = true;
	state.error = null;

	try {
		// In real implementation, call DataForge API
		await mockFavoritePattern(patternId);

		// Update local state
		if (state.userProfile) {
			state.userProfile.favoritedPatterns.push(patternId);
		}

		// Update pattern favorite status
		const pattern = state.patterns.find((p) => p.id === patternId);
		if (pattern) {
			pattern.isFavorited = true;
			pattern.favoriteCount++;
		}

		if (state.selectedPattern?.id === patternId) {
			state.selectedPattern.isFavorited = true;
			state.selectedPattern.favoriteCount++;
		}
	} catch (err) {
		state.error = err instanceof Error ? err.message : 'Failed to favorite pattern';
	} finally {
		state.isLoading = false;
	}
}

/**
 * Unfavorite a pattern
 */
async function unfavoritePattern(patternId: string): Promise<void> {
	if (!state.userProfile) return;

	state.userProfile.favoritedPatterns = state.userProfile.favoritedPatterns.filter(
		(id) => id !== patternId
	);

	// Update pattern favorite status
	const pattern = state.patterns.find((p) => p.id === patternId);
	if (pattern) {
		pattern.isFavorited = false;
		pattern.favoriteCount = Math.max(0, pattern.favoriteCount - 1);
	}

	if (state.selectedPattern?.id === patternId) {
		state.selectedPattern.isFavorited = false;
		state.selectedPattern.favoriteCount = Math.max(0, state.selectedPattern.favoriteCount - 1);
	}
}

/**
 * Rate a pattern
 */
async function ratePattern(patternId: string, rating: number): Promise<void> {
	if (rating < 1 || rating > 5) {
		throw new Error('Rating must be between 1 and 5');
	}

	state.isLoading = true;
	state.error = null;

	try {
		// In real implementation, call DataForge API
		const response = await mockRatePattern(patternId, rating);

		// Update pattern rating
		const pattern = state.patterns.find((p) => p.id === patternId);
		if (pattern) {
			pattern.userRating = rating;
			pattern.averageRating = response.averageRating;
			pattern.ratingCount = response.totalRatings;
		}

		if (state.selectedPattern?.id === patternId) {
			state.selectedPattern.userRating = rating;
			state.selectedPattern.averageRating = response.averageRating;
			state.selectedPattern.ratingCount = response.totalRatings;
		}
	} catch (err) {
		state.error = err instanceof Error ? err.message : 'Failed to rate pattern';
	} finally {
		state.isLoading = false;
	}
}

/**
 * Submit a review
 */
async function submitReview(patternId: string, rating: number, comment: string): Promise<void> {
	state.isLoading = true;
	state.error = null;

	try {
		// In real implementation, call DataForge API
		const review = await mockSubmitReview(patternId, rating, comment);

		// Add to reviews
		if (!state.reviews[patternId]) {
			state.reviews[patternId] = [];
		}
		state.reviews[patternId].unshift(review);

		// Update pattern rating
		await ratePattern(patternId, rating);
	} catch (err) {
		state.error = err instanceof Error ? err.message : 'Failed to submit review';
	} finally {
		state.isLoading = false;
	}
}

/**
 * Vote review as helpful
 */
async function voteReviewHelpful(reviewId: string, patternId: string): Promise<void> {
	const reviews = state.reviews[patternId];
	if (!reviews) return;

	const review = reviews.find((r) => r.id === reviewId);
	if (!review) return;

	// Toggle vote
	if (review.userVotedHelpful) {
		review.userVotedHelpful = false;
		review.helpful = Math.max(0, review.helpful - 1);
	} else {
		review.userVotedHelpful = true;
		review.helpful++;
	}

	// In real implementation, call DataForge API to persist
}

/**
 * Submit a pattern to marketplace
 */
async function submitPattern(pattern: PromptPattern): Promise<PatternSubmission> {
	state.isLoading = true;
	state.error = null;

	try {
		// In real implementation, call DataForge API
		const submission = await mockSubmitPattern(pattern);
		return submission;
	} catch (err) {
		state.error = err instanceof Error ? err.message : 'Failed to submit pattern';
		throw err;
	} finally {
		state.isLoading = false;
	}
}

/**
 * Report inappropriate content
 */
async function reportPattern(
	patternId: string,
	reason: ReportReason,
	details?: string
): Promise<void> {
	state.isLoading = true;
	state.error = null;

	try {
		// In real implementation, call DataForge API
		await mockReportPattern(patternId, reason, details);
	} catch (err) {
		state.error = err instanceof Error ? err.message : 'Failed to report pattern';
	} finally {
		state.isLoading = false;
	}
}

/**
 * Load user profile
 */
async function loadUserProfile(userId: string): Promise<void> {
	state.isLoading = true;
	state.error = null;

	try {
		// In real implementation, call DataForge API
		state.userProfile = await mockFetchUserProfile(userId);
	} catch (err) {
		state.error = err instanceof Error ? err.message : 'Failed to load user profile';
	} finally {
		state.isLoading = false;
	}
}

/**
 * Load author profile
 */
async function loadAuthorProfile(authorId: string): Promise<void> {
	state.isLoading = true;
	state.error = null;

	try {
		// In real implementation, call DataForge API
		const profile = await mockFetchAuthorProfile(authorId);
		state.authors[authorId] = profile;
	} catch (err) {
		state.error = err instanceof Error ? err.message : 'Failed to load author profile';
	} finally {
		state.isLoading = false;
	}
}

/**
 * Set filters
 */
function setFilters(filters: MarketplaceFilters): void {
	state.filters = { ...state.filters, ...filters };
	state.currentPage = 1; // Reset to first page
}

/**
 * Clear filters
 */
function clearFilters(): void {
	state.filters = {
		sortBy: 'popular',
		sortDirection: 'desc'
	};
	state.currentPage = 1;
}

/**
 * Load next page
 */
async function loadNextPage(): Promise<void> {
	if (state.currentPage < state.totalPages) {
		state.currentPage++;
		await browsePatterns();
	}
}

/**
 * Load previous page
 */
async function loadPreviousPage(): Promise<void> {
	if (state.currentPage > 1) {
		state.currentPage--;
		await browsePatterns();
	}
}

/**
 * Load marketplace analytics
 */
async function loadAnalytics(): Promise<void> {
	state.isLoading = true;
	state.error = null;

	try {
		// In real implementation, call DataForge API
		state.analytics = await mockFetchAnalytics();
	} catch (err) {
		state.error = err instanceof Error ? err.message : 'Failed to load analytics';
	} finally {
		state.isLoading = false;
	}
}

// ============================================================================
// Mock API functions (replace with real DataForge API calls)
// ============================================================================

async function mockFetchPatterns(
	filters: MarketplaceFilters,
	page: number,
	pageSize: number
): Promise<{ patterns: MarketplacePattern[]; total: number }> {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 300));
	return { patterns: [], total: 0 };
}

async function mockFetchPatternDetails(patternId: string): Promise<{
	pattern: MarketplacePattern;
	reviews: PatternReview[];
}> {
	await new Promise((resolve) => setTimeout(resolve, 300));
	throw new Error('Pattern not found');
}

async function mockInstallPattern(patternId: string): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 200));
}

async function mockFavoritePattern(patternId: string): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 200));
}

async function mockRatePattern(
	patternId: string,
	rating: number
): Promise<{ averageRating: number; totalRatings: number }> {
	await new Promise((resolve) => setTimeout(resolve, 200));
	return { averageRating: rating, totalRatings: 1 };
}

async function mockSubmitReview(
	patternId: string,
	rating: number,
	comment: string
): Promise<PatternReview> {
	await new Promise((resolve) => setTimeout(resolve, 200));
	return {
		id: `review_${Date.now()}`,
		patternId,
		authorId: 'user_1',
		authorName: 'Current User',
		rating,
		comment,
		helpful: 0,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
}

async function mockSubmitPattern(pattern: PromptPattern): Promise<PatternSubmission> {
	await new Promise((resolve) => setTimeout(resolve, 300));
	return {
		id: `submission_${Date.now()}`,
		pattern,
		authorId: 'user_1',
		submittedAt: new Date().toISOString(),
		status: 'pending'
	};
}

async function mockReportPattern(
	patternId: string,
	reason: ReportReason,
	details?: string
): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 200));
}

async function mockFetchUserProfile(userId: string): Promise<UserMarketplaceProfile> {
	await new Promise((resolve) => setTimeout(resolve, 300));
	return {
		userId,
		publishedPatterns: [],
		favoritedPatterns: [],
		installedPatterns: [],
		reviews: [],
		totalPublished: 0,
		totalDownloads: 0,
		averageRating: 0
	};
}

async function mockFetchAuthorProfile(authorId: string): Promise<AuthorProfile> {
	await new Promise((resolve) => setTimeout(resolve, 300));
	return {
		id: authorId,
		username: 'author',
		displayName: 'Author Name',
		joinedAt: new Date().toISOString(),
		totalPatterns: 0,
		totalDownloads: 0,
		averageRating: 0,
		totalReviews: 0,
		verified: false
	};
}

async function mockFetchAnalytics(): Promise<MarketplaceAnalytics> {
	await new Promise((resolve) => setTimeout(resolve, 300));
	return {
		totalPatterns: 0,
		totalAuthors: 0,
		totalDownloads: 0,
		totalReviews: 0,
		averageRating: 0,
		categoryCounts: {
			coding: 0,
			writing: 0,
			analysis: 0,
			debugging: 0,
			refactoring: 0,
			documentation: 0,
			testing: 0,
			design: 0,
			planning: 0,
			learning: 0
		},
		topPatterns: [],
		topAuthors: []
	};
}

// ============================================================================
// Exports
// ============================================================================

export const marketplaceStore = {
	// State
	get patterns() {
		return state.patterns;
	},
	get selectedPattern() {
		return state.selectedPattern;
	},
	get filteredPatterns() {
		return filteredPatterns;
	},
	get reviews() {
		return state.reviews;
	},
	get userProfile() {
		return state.userProfile;
	},
	get authors() {
		return state.authors;
	},
	get filters() {
		return state.filters;
	},
	get isLoading() {
		return state.isLoading;
	},
	get error() {
		return state.error;
	},
	get currentPage() {
		return state.currentPage;
	},
	get totalPages() {
		return state.totalPages;
	},
	get pageSize() {
		return state.pageSize;
	},
	get analytics() {
		return state.analytics;
	},

	// Derived
	get installedPatternIds() {
		return installedPatternIds;
	},
	get favoritedPatternIds() {
		return favoritedPatternIds;
	},
	get popularPatterns() {
		return popularPatterns;
	},
	get recentPatterns() {
		return recentPatterns;
	},
	get topRatedPatterns() {
		return topRatedPatterns;
	},

	// Actions
	browsePatterns,
	loadPattern,
	installPattern,
	uninstallPattern,
	favoritePattern,
	unfavoritePattern,
	ratePattern,
	submitReview,
	voteReviewHelpful,
	submitPattern,
	reportPattern,
	loadUserProfile,
	loadAuthorProfile,
	setFilters,
	clearFilters,
	loadNextPage,
	loadPreviousPage,
	loadAnalytics
};
