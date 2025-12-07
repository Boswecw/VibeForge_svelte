/**
 * VF-311: Enhanced Template System Exports
 *
 * Complete template engine with filters, conditionals, and loops
 */

// Filters
export type { FilterFunction } from './filters';
export {
	BUILTIN_FILTERS,
	applyFilter,
	parseFilter,
	applyFilters
} from './filters';

// Template Processor
export type { TemplateContext, TemplateOptions } from './processor';
export {
	EnhancedTemplateProcessor,
	renderTemplate,
	validateTemplate,
	extractTemplateVariables
} from './processor';
