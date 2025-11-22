<script lang="ts">
	/**
	 * LeftRailNav component - Primary navigation for VibeForge sections
	 * Refactored for clear, professional active states with visible icons
	 */

	import { page } from '$app/stores';

	interface NavItem {
		id: string;
		label: string;
		href: string;
		icon: string;
	}

	const navItems: NavItem[] = [
		{
			id: 'workbench',
			label: 'Workbench',
			href: '/',
			icon: 'workbench'
		},
		{
			id: 'contexts',
			label: 'Contexts',
			href: '/contexts',
			icon: 'contexts'
		},
		{
			id: 'patterns',
			label: 'Patterns',
			href: '/patterns',
			icon: 'patterns'
		},
		{
			id: 'history',
			label: 'History',
			href: '/history',
			icon: 'history'
		},
		{
			id: 'evals',
			label: 'Evaluations',
			href: '/evals',
			icon: 'evals'
		},
		{
			id: 'workspaces',
			label: 'Workspaces',
			href: '/workspaces',
			icon: 'workspaces'
		}
	];

	function isActive(href: string): boolean {
		const currentPath = $page.url.pathname;
		if (href === '/') {
			return currentPath === '/';
		}
		return currentPath.startsWith(href);
	}

	// Clean class composition using helper function
	function getNavItemClasses(isActive: boolean): string {
		// Base classes - consistent across all states
		const baseClasses = [
			'nav-item',
			'group',
			'relative',
			'flex',
			'flex-col',
			'items-center',
			'justify-center',
			'w-16',
			'h-16',
			'rounded-lg',
			'transition-all',
			'duration-200',
			'border-l-4',
			'cursor-pointer',
			'no-underline'
		];

		// Active state: left accent bar + soft tinted bg + amber icon
		const activeClasses = [
			'border-l-amber-400',
			'bg-amber-500/10',
			'text-amber-400',
			'ring-1',
			'ring-inset',
			'ring-amber-500/20'
		];

		// Idle state: transparent border + neutral colors
		const idleClasses = [
			'border-l-transparent',
			'text-slate-400',
			'hover:bg-slate-800/50',
			'hover:text-slate-200',
			'hover:border-l-slate-600'
		];

		// Focus state for keyboard navigation
		const focusClasses = [
			'focus-visible:outline-none',
			'focus-visible:ring-2',
			'focus-visible:ring-amber-500',
			'focus-visible:ring-offset-2',
			'focus-visible:ring-offset-forge-blacksteel'
		];

		return [...baseClasses, ...(isActive ? activeClasses : idleClasses), ...focusClasses].join(
			' '
		);
	}

	// SVG icon paths
	const icons: Record<string, string> = {
		workbench:
			'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
		contexts:
			'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
		patterns:
			'M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z',
		history: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
		evals:
			'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
		workspaces: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
		settings:
			'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
	};

	function getIconPath(iconName: string): string {
		return icons[iconName] || '';
	}
</script>

<nav
	class="leftrail bg-forge-blacksteel border-r border-slate-800 w-20 flex flex-col items-center py-4 gap-2"
>
	{#each navItems as item}
		<a
			href={item.href}
			class={getNavItemClasses(isActive(item.href))}
			aria-label={item.label}
			aria-current={isActive(item.href) ? 'page' : undefined}
			data-sveltekit-preload-data="hover"
		>
			<!-- Icon - always visible with current color -->
			<svg class="w-6 h-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d={getIconPath(item.icon)}
				></path>
			</svg>

			<!-- Label -->
			<span class="text-xs mt-1 font-medium pointer-events-none">{item.label}</span>

			<!-- Tooltip on hover -->
			<div
				class="absolute left-full ml-2 px-3 py-1.5 bg-forge-gunmetal text-slate-200 text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-lg z-50 border border-slate-700"
			>
				{item.label}
			</div>
		</a>
	{/each}

	<!-- Settings at bottom -->
	<div class="mt-auto">
		<a
			href="/settings"
			class={getNavItemClasses(isActive('/settings'))}
			aria-label="Settings"
			aria-current={isActive('/settings') ? 'page' : undefined}
			data-sveltekit-preload-data="hover"
		>
			<svg class="w-6 h-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d={getIconPath('settings')}
				></path>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				></path>
			</svg>
			<span class="text-xs mt-1 font-medium pointer-events-none">Settings</span>

			<!-- Tooltip -->
			<div
				class="absolute left-full ml-2 px-3 py-1.5 bg-forge-gunmetal text-slate-200 text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap shadow-lg z-50 border border-slate-700"
			>
				Settings
			</div>
		</a>
	</div>
</nav>
