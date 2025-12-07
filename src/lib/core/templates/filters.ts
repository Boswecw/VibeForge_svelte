/**
 * VF-311: Template Filters
 *
 * Custom filters for template variable transformation:
 * - Text manipulation (uppercase, lowercase, capitalize, etc.)
 * - Formatting (truncate, escape, json, etc.)
 * - Utility filters (default, length, etc.)
 */

/**
 * Filter function signature
 */
export type FilterFunction = (value: any, ...args: any[]) => any;

/**
 * Built-in template filters
 */
export const BUILTIN_FILTERS: Record<string, FilterFunction> = {
	/**
	 * Convert to uppercase
	 * @example {{name|uppercase}} → "JOHN"
	 */
	uppercase: (value: any) => String(value).toUpperCase(),

	/**
	 * Convert to lowercase
	 * @example {{name|lowercase}} → "john"
	 */
	lowercase: (value: any) => String(value).toLowerCase(),

	/**
	 * Capitalize first letter
	 * @example {{name|capitalize}} → "John"
	 */
	capitalize: (value: any) => {
		const str = String(value);
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	},

	/**
	 * Capitalize first letter of each word
	 * @example {{name|titlecase}} → "John Doe"
	 */
	titlecase: (value: any) => {
		return String(value)
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	},

	/**
	 * Truncate to specified length
	 * @example {{text|truncate:10}} → "Hello worl..."
	 */
	truncate: (value: any, length: number = 50, suffix: string = '...') => {
		const str = String(value);
		if (str.length <= length) return str;
		return str.substring(0, length) + suffix;
	},

	/**
	 * Escape HTML characters
	 * @example {{html|escape}} → "&lt;div&gt;"
	 */
	escape: (value: any) => {
		return String(value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	},

	/**
	 * URL encode
	 * @example {{url|urlencode}} → "hello%20world"
	 */
	urlencode: (value: any) => encodeURIComponent(String(value)),

	/**
	 * URL decode
	 * @example {{encoded|urldecode}} → "hello world"
	 */
	urldecode: (value: any) => decodeURIComponent(String(value)),

	/**
	 * Convert to JSON string
	 * @example {{obj|json}} → '{"key":"value"}'
	 */
	json: (value: any, indent?: number) => JSON.stringify(value, null, indent),

	/**
	 * Parse JSON string
	 * @example {{"[1,2,3]"|parsejson}} → [1, 2, 3]
	 */
	parsejson: (value: any) => JSON.parse(String(value)),

	/**
	 * Default value if empty/null/undefined
	 * @example {{name|default:"Anonymous"}} → "Anonymous" (if name is empty)
	 */
	default: (value: any, defaultValue: any = '') => {
		if (value === null || value === undefined || value === '') {
			return defaultValue;
		}
		return value;
	},

	/**
	 * Get length of string/array
	 * @example {{items|length}} → 5
	 */
	length: (value: any) => {
		if (typeof value === 'string' || Array.isArray(value)) {
			return value.length;
		}
		return 0;
	},

	/**
	 * Trim whitespace
	 * @example {{text|trim}} → "hello"
	 */
	trim: (value: any) => String(value).trim(),

	/**
	 * Replace substring
	 * @example {{text|replace:"foo":"bar"}} → replaces "foo" with "bar"
	 */
	replace: (value: any, search: string, replacement: string) => {
		return String(value).replace(new RegExp(search, 'g'), replacement);
	},

	/**
	 * Split string into array
	 * @example {{csv|split:","}} → ["a", "b", "c"]
	 */
	split: (value: any, separator: string = ',') => {
		return String(value).split(separator);
	},

	/**
	 * Join array into string
	 * @example {{items|join:", "}} → "a, b, c"
	 */
	join: (value: any, separator: string = ',') => {
		if (Array.isArray(value)) {
			return value.join(separator);
		}
		return String(value);
	},

	/**
	 * Reverse string or array
	 * @example {{text|reverse}} → "olleh"
	 */
	reverse: (value: any) => {
		if (typeof value === 'string') {
			return value.split('').reverse().join('');
		}
		if (Array.isArray(value)) {
			return [...value].reverse();
		}
		return value;
	},

	/**
	 * Get first N characters/items
	 * @example {{text|first:5}} → "hello"
	 */
	first: (value: any, count: number = 1) => {
		if (typeof value === 'string') {
			return value.substring(0, count);
		}
		if (Array.isArray(value)) {
			return value.slice(0, count);
		}
		return value;
	},

	/**
	 * Get last N characters/items
	 * @example {{text|last:5}} → "world"
	 */
	last: (value: any, count: number = 1) => {
		if (typeof value === 'string') {
			return value.substring(value.length - count);
		}
		if (Array.isArray(value)) {
			return value.slice(-count);
		}
		return value;
	},

	/**
	 * Prepend text
	 * @example {{name|prepend:"Hello, "}} → "Hello, John"
	 */
	prepend: (value: any, prefix: string) => {
		return prefix + String(value);
	},

	/**
	 * Append text
	 * @example {{name|append:"!"}} → "John!"
	 */
	append: (value: any, suffix: string) => {
		return String(value) + suffix;
	},

	/**
	 * Remove HTML tags
	 * @example {{html|striptags}} → "Hello"
	 */
	striptags: (value: any) => {
		return String(value).replace(/<[^>]*>/g, '');
	},

	/**
	 * Slug-ify text (URL-friendly)
	 * @example {{title|slugify}} → "hello-world"
	 */
	slugify: (value: any) => {
		return String(value)
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, '')
			.replace(/[\s_-]+/g, '-')
			.replace(/^-+|-+$/g, '');
	},

	/**
	 * Convert newlines to <br> tags
	 * @example {{text|nl2br}} → "line1<br>line2"
	 */
	nl2br: (value: any) => {
		return String(value).replace(/\n/g, '<br>');
	},

	/**
	 * Pluralize word based on count
	 * @example {{count|pluralize:"item":"items"}} → "items" (if count > 1)
	 */
	pluralize: (count: number, singular: string, plural: string) => {
		return count === 1 ? singular : plural;
	},

	/**
	 * Format number with thousands separator
	 * @example {{number|number}} → "1,234,567"
	 */
	number: (value: any, decimals?: number) => {
		const num = Number(value);
		if (isNaN(num)) return value;
		return decimals !== undefined
			? num.toLocaleString(undefined, {
					minimumFractionDigits: decimals,
					maximumFractionDigits: decimals
			  })
			: num.toLocaleString();
	},

	/**
	 * Format as percentage
	 * @example {{0.75|percent}} → "75%"
	 */
	percent: (value: any, decimals: number = 0) => {
		const num = Number(value) * 100;
		return num.toFixed(decimals) + '%';
	},

	/**
	 * Format as currency
	 * @example {{price|currency:"USD"}} → "$123.45"
	 */
	currency: (value: any, currency: string = 'USD') => {
		const num = Number(value);
		if (isNaN(num)) return value;
		return new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency
		}).format(num);
	},

	/**
	 * Absolute value
	 * @example {{-5|abs}} → 5
	 */
	abs: (value: any) => Math.abs(Number(value)),

	/**
	 * Round number
	 * @example {{3.7|round}} → 4
	 */
	round: (value: any, decimals: number = 0) => {
		const num = Number(value);
		const multiplier = Math.pow(10, decimals);
		return Math.round(num * multiplier) / multiplier;
	},

	/**
	 * Floor number
	 * @example {{3.7|floor}} → 3
	 */
	floor: (value: any) => Math.floor(Number(value)),

	/**
	 * Ceiling number
	 * @example {{3.2|ceil}} → 4
	 */
	ceil: (value: any) => Math.ceil(Number(value)),

	/**
	 * Format date
	 * @example {{timestamp|date}} → "12/7/2025"
	 */
	date: (value: any, format?: string) => {
		const date = new Date(value);
		if (isNaN(date.getTime())) return value;

		// Simple date formatting (can be enhanced)
		if (format === 'iso') {
			return date.toISOString();
		}
		if (format === 'time') {
			return date.toLocaleTimeString();
		}
		return date.toLocaleDateString();
	}
};

/**
 * Apply a filter to a value
 * @param value Value to filter
 * @param filterName Filter name
 * @param args Filter arguments
 * @param customFilters Custom filter registry
 * @returns Filtered value
 */
export function applyFilter(
	value: any,
	filterName: string,
	args: any[] = [],
	customFilters: Record<string, FilterFunction> = {}
): any {
	// Check custom filters first
	const filter = customFilters[filterName] || BUILTIN_FILTERS[filterName];

	if (!filter) {
		throw new Error(`Unknown filter: ${filterName}`);
	}

	return filter(value, ...args);
}

/**
 * Parse filter expression
 * @example "uppercase" → { name: "uppercase", args: [] }
 * @example "truncate:10" → { name: "truncate", args: [10] }
 * @example "replace:'foo':'bar'" → { name: "replace", args: ["foo", "bar"] }
 */
export function parseFilter(filterExpr: string): {
	name: string;
	args: any[];
} {
	// Split by colon, but respect quoted strings
	const parts: string[] = [];
	let current = '';
	let inQuotes = false;
	let quoteChar = '';

	for (let i = 0; i < filterExpr.length; i++) {
		const char = filterExpr[i];

		if ((char === '"' || char === "'") && filterExpr[i - 1] !== '\\') {
			if (!inQuotes) {
				inQuotes = true;
				quoteChar = char;
			} else if (char === quoteChar) {
				inQuotes = false;
				quoteChar = '';
			}
			continue;
		}

		if (char === ':' && !inQuotes) {
			parts.push(current);
			current = '';
			continue;
		}

		current += char;
	}

	if (current) {
		parts.push(current);
	}

	// Handle empty filter expression
	if (parts.length === 0 || !parts[0]) {
		return { name: '', args: [] };
	}

	const name = parts[0].trim();
	const args = parts.slice(1).map((arg) => {
		// Don't trim - quotes are already removed and we want to preserve spaces
		// Only trim if there's no meaningful content
		const trimmed = arg.trim();

		// If trimming changed it significantly (not just edge whitespace), keep original
		// Otherwise use trimmed for type detection
		const valueToCheck = trimmed;

		// Try to parse as number
		const num = Number(valueToCheck);
		if (!isNaN(num) && valueToCheck !== '') {
			return num;
		}

		// Try to parse as boolean
		if (valueToCheck === 'true') return true;
		if (valueToCheck === 'false') return false;

		// Return as string - use trimmed if it's the same or just edge whitespace,
		// otherwise preserve original spacing
		return arg;
	});

	return { name, args };
}

/**
 * Apply a chain of filters to a value
 * @example applyFilters("hello", ["uppercase", "truncate:3"]) → "HEL"
 */
export function applyFilters(
	value: any,
	filters: string[],
	customFilters: Record<string, FilterFunction> = {}
): any {
	let result = value;

	for (const filterExpr of filters) {
		const { name, args } = parseFilter(filterExpr);
		result = applyFilter(result, name, args, customFilters);
	}

	return result;
}
