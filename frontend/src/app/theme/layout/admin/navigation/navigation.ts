export interface NavigationItem {
	id: string;
	title: string;
	type: 'item' | 'collapse' | 'group';
	translate?: string;
	icon?: string;
	hidden?: boolean;
	url?: string;
	classes?: string;
	external?: boolean;
	target?: boolean;
	breadcrumbs?: boolean;
	children?: NavigationItem[];
	role_ids?: number[];
	urlPattern?: string;
}

const NavigationItems: NavigationItem[] = [
	{
		id: 'delivery_app-dashboard',
		title: 'nav.dashboard',
		type: 'group',
		icon: 'icon-home',
		classes: 'first-group',
		children: [
			{
				id: 'dashboard',
				title: 'nav.home',
				type: 'item',
				classes: 'nav-item',
				url: '/dashboard',
				icon: 'ti ti-home',
				breadcrumbs: false,
				role_ids: []
			}
		]
	},
	{
		id: 'panel',
		title: 'nav.panel',
		type: 'group',
		icon: 'icon-navigation',
		children: [
			{
				id: 'users',
				title: 'nav.users',
				type: 'item',
				classes: 'nav-item',
				url: '/users',
				icon: 'ti ti-user',
				breadcrumbs: true,
				children: [
					{
						id: 'add-user',
						title: 'users.add_user',
						type: 'item',
						url: '/users/create'
					},
					{
						id: 'edit-user',
						title: 'users.edit_user',
						type: 'item',
						urlPattern: '^/users/edit/\\d+$'
					}
				]
			},
			{
				id: 'action-log',
				title: 'nav.action_log',
				type: 'item',
				classes: 'nav-item',
				url: '/action-log',
				icon: 'ti ti-network',
				breadcrumbs: true,
			},
			{
				id: 'api-logs',
				title: 'nav.api_logs',
				type: 'item',
				classes: 'nav-item',
				url: '/api-logs',
				icon: 'ti ti-file',
				breadcrumbs: true,
			},
		],
	}
];
export function getNavigationItems() {
	return NavigationItems;
}
