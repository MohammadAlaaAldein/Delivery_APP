// Angular Imports
import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';

// project import
import { AdminComponent } from './theme/layout/admin/admin.component';
import { UnauthorizedComponent } from './dashboard/unauthorized/unauthorized.component';
import { ForgotPasswordComponent } from './dashboard/forgot-password/forgot-password.component';
import { LoginComponent } from './dashboard/users/login/login.component';
import { NoAuthGuard } from './theme/shared/_helpers/no-auth-guard.service';
import { AuthGuard } from './theme/shared/_helpers/auth.guard';
import { GuestComponent } from './theme/layout/guest/guest.component';
import { ChangePasswordComponent } from './dashboard/change-password/change-password.component';
import { UnblockLoginComponent } from './dashboard/users/unblock-login/unblock-login.component';
import { USER_ROLE } from './dashboard/users/users.service';
import { RoleAccessGuard } from './theme/shared/_helpers/role-access.guard';

const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
	{
		path: '',
		component: GuestComponent,
		canActivate: [NoAuthGuard],
		children: [
			{
				path: 'login',
				component: LoginComponent,
				canActivate: [NoAuthGuard],
				children: []
			},
			{
				path: 'forgot-password',
				component: ForgotPasswordComponent,
				canActivate: [NoAuthGuard],
				children: []
			},
			{
				path: 'reset-password/:userId',
				component: ChangePasswordComponent,
				canActivate: [NoAuthGuard],
				data: { pageName: 'reset_password' },
				children: []
			},
			{
				path: 'unblock-login',
				component: UnblockLoginComponent,
				canActivate: [NoAuthGuard],
				children: []
			}
		]
	},
	{
		path: '',
		component: AdminComponent,
		canActivate: [AuthGuard],
		children: [
			{
				path: 'dashboard',
				loadComponent: () => import('./dashboard/dashboard/dashboard.component').then((c) => c.DashboardComponent),
			},
			// ==================== SHOP USER ROUTES ====================
			{
				path: 'my-shop',
				loadComponent: () => import('./dashboard/shops/shop-dashboard/shop-dashboard.component').then((c) => c.ShopDashboardComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.SHOP }
			},
			{
				path: 'my-orders',
				loadComponent: () => import('./dashboard/orders/shop-orders/shop-orders.component').then((c) => c.ShopOrdersComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.SHOP }
			},
			{
				path: 'my-orders/create',
				loadComponent: () => import('./dashboard/orders/shop-orders/shop-order-form.component').then((c) => c.ShopOrderFormComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.SHOP }
			},
			{
				path: 'my-orders/view/:id',
				loadComponent: () => import('./dashboard/orders/shared/order-view.component').then((c) => c.OrderViewComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.SHOP, viewerRole: 'shop' }
			},
			{
				path: 'my-orders/edit/:id',
				loadComponent: () => import('./dashboard/orders/shop-orders/shop-order-form.component').then((c) => c.ShopOrderFormComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.SHOP }
			},
			{
				path: 'my-orders/history/:id',
				loadComponent: () => import('./dashboard/orders/shared/order-history-view.component').then((c) => c.OrderHistoryViewComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.SHOP, viewerRole: 'shop' }
			},
			// ==================== COMPANY USER ROUTES ====================
			{
				path: 'my-company',
				loadComponent: () => import('./dashboard/companies/company-dashboard/company-dashboard.component').then((c) => c.CompanyDashboardComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY }
			},
			{
				path: 'my-drivers',
				loadComponent: () => import('./dashboard/companies/company-drivers/company-drivers.component').then((c) => c.CompanyDriversComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY }
			},
			// ==================== COMPANY USER REQUESTS ====================
			{
				path: 'my-shop-requests',
				loadComponent: () => import('./dashboard/shop-requests/my-shop-requests/my-shop-requests.component').then((c) => c.MyShopRequestsComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY }
			},
			{
				path: 'my-shop-requests/create',
				loadComponent: () => import('./dashboard/shop-requests/my-shop-requests/my-shop-request-form.component').then((c) => c.MyShopRequestFormComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY }
			},
			{
				path: 'my-shop-requests/view/:id',
				loadComponent: () => import('./dashboard/shop-requests/my-shop-requests/my-shop-request-form.component').then((c) => c.MyShopRequestFormComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY }
			},
			{
				path: 'my-shop-requests/edit/:id',
				loadComponent: () => import('./dashboard/shop-requests/my-shop-requests/my-shop-request-form.component').then((c) => c.MyShopRequestFormComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY }
			},
			{
				path: 'my-driver-requests',
				loadComponent: () => import('./dashboard/driver-requests/my-driver-requests/my-driver-requests.component').then((c) => c.MyDriverRequestsComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY }
			},
			{
				path: 'my-driver-requests/create',
				loadComponent: () => import('./dashboard/driver-requests/my-driver-requests/my-driver-request-form.component').then((c) => c.MyDriverRequestFormComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY }
			},
			{
				path: 'my-driver-requests/view/:id',
				loadComponent: () => import('./dashboard/driver-requests/my-driver-requests/my-driver-request-form.component').then((c) => c.MyDriverRequestFormComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY }
			},
			{
				path: 'my-driver-requests/edit/:id',
				loadComponent: () => import('./dashboard/driver-requests/my-driver-requests/my-driver-request-form.component').then((c) => c.MyDriverRequestFormComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY }
			},
			// ==================== COMPANY ORDER ROUTES ====================
			{
				path: 'available-orders',
				loadComponent: () => import('./dashboard/orders/company-orders/company-available-orders.component').then((c) => c.CompanyAvailableOrdersComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY }
			},
			{
				path: 'available-orders/view/:id',
				loadComponent: () => import('./dashboard/orders/shared/order-view.component').then((c) => c.OrderViewComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY, viewerRole: 'company' }
			},
			{
				path: 'company-orders',
				loadComponent: () => import('./dashboard/orders/company-orders/company-my-orders.component').then((c) => c.CompanyMyOrdersComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY }
			},
			{
				path: 'company-orders/view/:id',
				loadComponent: () => import('./dashboard/orders/shared/order-view.component').then((c) => c.OrderViewComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY, viewerRole: 'company' }
			},
			{
				path: 'company-orders/history/:id',
				loadComponent: () => import('./dashboard/orders/shared/order-history-view.component').then((c) => c.OrderHistoryViewComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY, viewerRole: 'company' }
			},
			{
				path: 'company-orders/assign-driver/:id',
				loadComponent: () => import('./dashboard/orders/company-orders/company-assign-driver.component').then((c) => c.CompanyAssignDriverComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.COMPANY }
			},
			// ==================== DRIVER USER ROUTES ====================
			{
				path: 'my-profile',
				loadComponent: () => import('./dashboard/drivers/driver-dashboard/driver-dashboard.component').then((c) => c.DriverDashboardComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.DRIVER }
			},
			{
				path: 'my-deliveries',
				loadComponent: () => import('./dashboard/orders/driver-orders/driver-orders.component').then((c) => c.DriverOrdersComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.DRIVER }
			},
			{
				path: 'my-deliveries/view/:id',
				loadComponent: () => import('./dashboard/orders/shared/order-view.component').then((c) => c.OrderViewComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.DRIVER, viewerRole: 'driver' }
			},
			{
				path: 'delivery-history',
				loadComponent: () => import('./dashboard/orders/driver-orders/driver-history.component').then((c) => c.DriverHistoryComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.DRIVER }
			},
			{
				path: 'delivery-history/view/:id',
				loadComponent: () => import('./dashboard/orders/shared/order-history-view.component').then((c) => c.OrderHistoryViewComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.DRIVER, viewerRole: 'driver' }
			},
			// ==================== ADMIN ROUTES ====================
			{
				path: 'users',
				loadComponent: () => import('./dashboard/users/users.component').then((c) => c.UsersComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'users/create',
				loadComponent: () => import('./dashboard/users/create-user/create-user.component').then((c) => c.CreateUserComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'users/edit/:id',
				loadComponent: () => import('./dashboard/users/create-user/create-user.component').then((c) => c.CreateUserComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'shops',
				loadComponent: () => import('./dashboard/shops/shops.component').then((c) => c.ShopsComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'shops/create',
				loadComponent: () => import('./dashboard/shops/create-shop/create-shop.component').then((c) => c.CreateShopComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'shops/edit/:id',
				loadComponent: () => import('./dashboard/shops/create-shop/create-shop.component').then((c) => c.CreateShopComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'companies',
				loadComponent: () => import('./dashboard/companies/companies.component').then((c) => c.CompaniesComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'companies/create',
				loadComponent: () => import('./dashboard/companies/create-company/create-company.component').then((c) => c.CreateCompanyComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'companies/edit/:id',
				loadComponent: () => import('./dashboard/companies/create-company/create-company.component').then((c) => c.CreateCompanyComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'drivers',
				loadComponent: () => import('./dashboard/drivers/drivers.component').then((c) => c.DriversComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'drivers/edit/:id',
				loadComponent: () => import('./dashboard/drivers/create-driver/create-driver.component').then((c) => c.CreateDriverComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'api-logs',
				loadComponent: () => import('./dashboard/logs/api-logs/api-logs.component').then((c) => c.ApiLogsComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'action-log',
				loadComponent: () => import('./dashboard/admin/action-log/action-log.component').then((c) => c.ActionLogComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			// ==================== SHOP REQUESTS (ADMIN) ====================
			{
				path: 'shop-requests',
				loadComponent: () => import('./dashboard/shop-requests/shop-requests.component').then((c) => c.ShopRequestsComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'shop-requests/edit/:id',
				loadComponent: () => import('./dashboard/shop-requests/shop-request-form/shop-request-form.component').then((c) => c.ShopRequestFormComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'shop-requests/view/:id',
				loadComponent: () => import('./dashboard/shop-requests/shop-request-form/shop-request-form.component').then((c) => c.ShopRequestFormComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			// ==================== DRIVER REQUESTS (ADMIN) ====================
			{
				path: 'driver-requests',
				loadComponent: () => import('./dashboard/driver-requests/driver-requests.component').then((c) => c.DriverRequestsComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'driver-requests/edit/:id',
				loadComponent: () => import('./dashboard/driver-requests/driver-request-form/driver-request-form.component').then((c) => c.DriverRequestFormComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'driver-requests/view/:id',
				loadComponent: () => import('./dashboard/driver-requests/driver-request-form/driver-request-form.component').then((c) => c.DriverRequestFormComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			// ==================== ORDERS (ADMIN) ====================
			{
				path: 'orders',
				loadComponent: () => import('./dashboard/orders/admin-orders/admin-orders.component').then((c) => c.AdminOrdersComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'orders/view/:id',
				loadComponent: () => import('./dashboard/orders/admin-orders/admin-order-form.component').then((c) => c.AdminOrderFormComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
			{
				path: 'orders/edit/:id',
				loadComponent: () => import('./dashboard/orders/admin-orders/admin-order-form.component').then((c) => c.AdminOrderFormComponent),
				canActivate: [RoleAccessGuard],
				data: { role: USER_ROLE.ADMIN }
			},
		]
	},
	{
		path: 'unauthorized',
		component: UnauthorizedComponent,
		canActivate: [],
		children: []
	},
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
	exports: [RouterModule]
})
export class AppRoutingModule { }
