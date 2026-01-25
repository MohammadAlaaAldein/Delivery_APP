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
			},
			{
				id: 'my-shop',
				title: 'nav.my_shop',
				type: 'item',
				classes: 'nav-item',
				url: '/my-shop',
				icon: 'ti ti-building-store',
				breadcrumbs: true,
				role_ids: [3] // SHOP role
			},
			{
				id: 'my-orders',
				title: 'nav.my_orders',
				type: 'item',
				classes: 'nav-item',
				url: '/my-orders',
				icon: 'ti ti-package',
				breadcrumbs: true,
				role_ids: [3], // SHOP role
				children: [
					{
						id: 'create-order',
						title: 'orders.create_order',
						type: 'item',
						url: '/my-orders/create'
					},
					{
						id: 'view-order',
						title: 'orders.view_order',
						type: 'item',
						urlPattern: '^/my-orders/view/\\d+$'
					},
					{
						id: 'edit-order',
						title: 'orders.edit_order',
						type: 'item',
						urlPattern: '^/my-orders/edit/\\d+$'
					}
				]
			},
			{
				id: 'my-company',
				title: 'nav.my_company',
				type: 'item',
				classes: 'nav-item',
				url: '/my-company',
				icon: 'ti ti-building',
				breadcrumbs: true,
				role_ids: [2] // COMPANY role
			},
			{
				id: 'my-drivers',
				title: 'nav.my_drivers',
				type: 'item',
				classes: 'nav-item',
				url: '/my-drivers',
				icon: 'ti ti-car',
				breadcrumbs: true,
				role_ids: [2] // COMPANY role
			},
			{
				id: 'my-shop-requests',
				title: 'nav.my_shop_requests',
				type: 'item',
				classes: 'nav-item',
				url: '/my-shop-requests',
				icon: 'ti ti-building-store',
				breadcrumbs: true,
				role_ids: [2], // COMPANY role
				children: [
					{
						id: 'create-shop-request',
						title: 'shop_requests.request_new_shop',
						type: 'item',
						url: '/my-shop-requests/create'
					},
					{
						id: 'view-my-shop-request',
						title: 'shop_requests.view_request',
						type: 'item',
						urlPattern: '^/my-shop-requests/view/\\d+$'
					}
				]
			},
			{
				id: 'my-driver-requests',
				title: 'nav.my_driver_requests',
				type: 'item',
				classes: 'nav-item',
				url: '/my-driver-requests',
				icon: 'ti ti-car',
				breadcrumbs: true,
				role_ids: [2], // COMPANY role
				children: [
					{
						id: 'create-driver-request',
						title: 'driver_requests.request_new_driver',
						type: 'item',
						url: '/my-driver-requests/create'
					},
					{
						id: 'view-my-driver-request',
						title: 'driver_requests.view_request',
						type: 'item',
						urlPattern: '^/my-driver-requests/view/\\d+$'
					}
				]
			},
			{
				id: 'available-orders',
				title: 'nav.available_orders',
				type: 'item',
				classes: 'nav-item',
				url: '/available-orders',
				icon: 'ti ti-package-import',
				breadcrumbs: true,
				role_ids: [2] // COMPANY role
			},
			{
				id: 'company-orders',
				title: 'nav.company_orders',
				type: 'item',
				classes: 'nav-item',
				url: '/company-orders',
				icon: 'ti ti-package',
				breadcrumbs: true,
				role_ids: [2], // COMPANY role
				children: [
					{
						id: 'view-company-order',
						title: 'orders.view_order',
						type: 'item',
						urlPattern: '^/company-orders/view/\\d+$'
					},
					{
						id: 'assign-driver',
						title: 'orders.assign_driver',
						type: 'item',
						urlPattern: '^/company-orders/assign-driver/\\d+$'
					}
				]
			},
			{
				id: 'my-profile',
				title: 'nav.my_profile',
				type: 'item',
				classes: 'nav-item',
				url: '/my-profile',
				icon: 'ti ti-user',
				breadcrumbs: true,
				role_ids: [4] // DRIVER role
			},
			{
				id: 'my-deliveries',
				title: 'nav.my_deliveries',
				type: 'item',
				classes: 'nav-item',
				url: '/my-deliveries',
				icon: 'ti ti-package',
				breadcrumbs: true,
				role_ids: [4], // DRIVER role
				children: [
					{
						id: 'view-delivery',
						title: 'orders.view_order',
						type: 'item',
						urlPattern: '^/my-deliveries/view/\\d+$'
					}
				]
			},
			{
				id: 'delivery-history',
				title: 'nav.delivery_history',
				type: 'item',
				classes: 'nav-item',
				url: '/delivery-history',
				icon: 'ti ti-history',
				breadcrumbs: true,
				role_ids: [4] // DRIVER role
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
				id: 'shops',
				title: 'nav.shops_list',
				type: 'item',
				classes: 'nav-item',
				url: '/shops',
				icon: 'ti ti-building-store',
				breadcrumbs: true,
				children: [
					{
						id: 'add-shop',
						title: 'shops.add_shop',
						type: 'item',
						url: '/shops/create'
					},
					{
						id: 'edit-shop',
						title: 'shops.edit_shop',
						type: 'item',
						urlPattern: '^/shops/edit/\\d+$'
					}
				]
			},
			{
				id: 'companies',
				title: 'nav.companies_list',
				type: 'item',
				classes: 'nav-item',
				url: '/companies',
				icon: 'ti ti-building',
				breadcrumbs: true,
				children: [
					{
						id: 'add-company',
						title: 'companies.add_company',
						type: 'item',
						url: '/companies/create'
					},
					{
						id: 'edit-company',
						title: 'companies.edit_company',
						type: 'item',
						urlPattern: '^/companies/edit/\\d+$'
					}
				]
			},
			{
				id: 'drivers',
				title: 'nav.drivers_list',
				type: 'item',
				classes: 'nav-item',
				url: '/drivers',
				icon: 'ti ti-car',
				breadcrumbs: true,
				children: [
					{
						id: 'add-driver',
						title: 'drivers.add_driver',
						type: 'item',
						url: '/drivers/create'
					},
					{
						id: 'edit-driver',
						title: 'drivers.edit_driver',
						type: 'item',
						urlPattern: '^/drivers/edit/\\d+$'
					}
				]
			},
			{
				id: 'shop-requests',
				title: 'nav.shop_requests',
				type: 'item',
				classes: 'nav-item',
				url: '/shop-requests',
				icon: 'ti ti-building-store',
				breadcrumbs: true,
				children: [
					{
						id: 'edit-shop-request',
						title: 'shop_requests.edit_request',
						type: 'item',
						urlPattern: '^/shop-requests/edit/\\d+$'
					},
					{
						id: 'view-shop-request',
						title: 'shop_requests.view_request',
						type: 'item',
						urlPattern: '^/shop-requests/view/\\d+$'
					}
				]
			},
			{
				id: 'driver-requests',
				title: 'nav.driver_requests',
				type: 'item',
				classes: 'nav-item',
				url: '/driver-requests',
				icon: 'ti ti-car',
				breadcrumbs: true,
				children: [
					{
						id: 'edit-driver-request',
						title: 'driver_requests.edit_request',
						type: 'item',
						urlPattern: '^/driver-requests/edit/\\d+$'
					},
					{
						id: 'view-driver-request',
						title: 'driver_requests.view_request',
						type: 'item',
						urlPattern: '^/driver-requests/view/\\d+$'
					}
				]
			},
			{
				id: 'orders',
				title: 'nav.orders',
				type: 'item',
				classes: 'nav-item',
				url: '/orders',
				icon: 'ti ti-package',
				breadcrumbs: true,
				children: [
					{
						id: 'view-admin-order',
						title: 'orders.view_order',
						type: 'item',
						urlPattern: '^/orders/view/\\d+$'
					},
					{
						id: 'edit-admin-order',
						title: 'orders.edit_order',
						type: 'item',
						urlPattern: '^/orders/edit/\\d+$'
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
