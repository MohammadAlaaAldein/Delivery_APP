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
