/**
 * VF-312: Pattern Marketplace Types
 *
 * Types for community pattern sharing, ratings, reviews, and discovery
 */

import type { PromptPattern, PatternCategory } from './patterns';

/**
 * Pattern submission status
 */
export type SubmissionStatus =
	| 'pending' // Awaiting review
	| 'approved' // Published to marketplace
	| 'rejected' // Rejected by moderators
	| 'flagged'; // Flagged for review

/**
 * Content report reason
 */
export type ReportReason =
	| 'spam'
	| 'inappropriate'
	| 'copyright'
	| 'malicious'
	| 'duplicate'
	| 'other';

/**
 * Pattern author profile
 */
export interface AuthorProfile {
	id: string;
	username: string;
	displayName: string;
	avatar?: string;
	bio?: string;
	website?: string;
	github?: string;
	twitter?: string;
	joinedAt: string;
	// Statistics
	totalPatterns: number;
	totalDownloads: number;
	averageRating: number;
	totalReviews: number;
	verified: boolean; // Verified author badge
}

/**
 * Pattern review
 */
export interface PatternReview {
	id: string;
	patternId: string;
	authorId: string;
	authorName: string;
	authorAvatar?: string;
	rating: number; // 1-5
	comment?: string;
	helpful: number; // Number of "helpful" votes
	createdAt: string;
	updatedAt: string;
	// User's vote on this review
	userVotedHelpful?: boolean;
}

/**
 * Pattern version
 */
export interface PatternVersion {
	version: number;
	changelog: string;
	publishedAt: string;
	pattern: PromptPattern;
}

/**
 * Marketplace pattern (extends base pattern with community metadata)
 */
export interface MarketplacePattern extends PromptPattern {
	// Marketplace metadata
	authorId: string;
	authorName: string;
	authorAvatar?: string;
	authorVerified: boolean;
	// Statistics
	downloadCount: number;
	viewCount: number;
	favoriteCount: number;
	reviewCount: number;
	// Versions
	currentVersion: number;
	versions: PatternVersion[];
	// Publishing
	publishedAt: string;
	lastUpdatedAt: string;
	submissionStatus: SubmissionStatus;
	// User interaction
	isFavorited?: boolean; // Has current user favorited this?
	isInstalled?: boolean; // Has current user installed this?
	userRating?: number; // Current user's rating (if any)
}

/**
 * Pattern submission (for new patterns)
 */
export interface PatternSubmission {
	id: string;
	pattern: PromptPattern;
	authorId: string;
	submittedAt: string;
	status: SubmissionStatus;
	reviewNotes?: string;
	reviewedBy?: string;
	reviewedAt?: string;
}

/**
 * Content report
 */
export interface ContentReport {
	id: string;
	patternId: string;
	reporterId: string;
	reason: ReportReason;
	details?: string;
	status: 'pending' | 'resolved' | 'dismissed';
	createdAt: string;
	resolvedAt?: string;
	resolvedBy?: string;
	resolution?: string;
}

/**
 * Marketplace search filters
 */
export interface MarketplaceFilters {
	query?: string;
	category?: PatternCategory;
	tags?: string[];
	authorId?: string;
	minRating?: number; // 1-5
	minDownloads?: number;
	sortBy?: 'popular' | 'recent' | 'rating' | 'downloads' | 'name';
	sortDirection?: 'asc' | 'desc';
	verified?: boolean; // Only show verified authors
	featured?: boolean; // Only show featured patterns
}

/**
 * Marketplace analytics
 */
export interface MarketplaceAnalytics {
	totalPatterns: number;
	totalAuthors: number;
	totalDownloads: number;
	totalReviews: number;
	averageRating: number;
	// Category breakdown
	categoryCounts: Record<PatternCategory, number>;
	// Top patterns
	topPatterns: Array<{ id: string; name: string; downloads: number }>;
	// Top authors
	topAuthors: Array<{ id: string; name: string; patterns: number }>;
}

/**
 * User's marketplace profile
 */
export interface UserMarketplaceProfile {
	userId: string;
	// Published patterns
	publishedPatterns: string[]; // Pattern IDs
	// Interactions
	favoritedPatterns: string[]; // Pattern IDs
	installedPatterns: string[]; // Pattern IDs
	reviews: string[]; // Review IDs
	// Statistics
	totalPublished: number;
	totalDownloads: number;
	averageRating: number;
}

/**
 * Featured pattern
 */
export interface FeaturedPattern {
	patternId: string;
	title: string;
	description: string;
	imageUrl?: string;
	startDate: string;
	endDate: string;
	position: number; // Display order
}

/**
 * Pattern changelog entry
 */
export interface ChangelogEntry {
	version: number;
	changes: string;
	publishedAt: string;
	author: string;
}

/**
 * Marketplace notification
 */
export interface MarketplaceNotification {
	id: string;
	userId: string;
	type: 'review' | 'download' | 'favorite' | 'update' | 'approval' | 'rejection';
	title: string;
	message: string;
	patternId?: string;
	patternName?: string;
	read: boolean;
	createdAt: string;
}

/**
 * API Responses
 */

export interface ListMarketplacePatternsResponse {
	patterns: MarketplacePattern[];
	total: number;
	page: number;
	pageSize: number;
	hasMore: boolean;
}

export interface GetMarketplacePatternResponse {
	pattern: MarketplacePattern;
	reviews: PatternReview[];
	relatedPatterns: MarketplacePattern[];
}

export interface SubmitPatternResponse {
	submissionId: string;
	status: SubmissionStatus;
	message: string;
}

export interface InstallPatternResponse {
	patternId: string;
	installed: boolean;
	message: string;
}

export interface RatePatternResponse {
	patternId: string;
	rating: number;
	averageRating: number;
	totalRatings: number;
}

export interface ReportPatternResponse {
	reportId: string;
	status: string;
	message: string;
}
