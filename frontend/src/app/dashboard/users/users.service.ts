import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from './user.interface';
import { ChangePassword } from '../change-password/change-password.interface';

export enum USER_ROLE {
	ADMIN = 'admin',
	SHOP = 'shop',
	COMPANY = 'company',
	DRIVER = 'driver',
};

export enum ENTITY_TYPE {
	SHOP = 'shop',
	COMPANY = 'company',
	DRIVER = 'driver',
};

export function hasRoleAccess(requiredRole: USER_ROLE): boolean {
	const user = JSON.parse(localStorage.getItem('currentUser'));
	if (!user)
		return false;

	return user.role === USER_ROLE.ADMIN || user.role === requiredRole;
}

@Injectable({
	providedIn: 'root'
})
export class UsersService {

	constructor(private http: HttpClient) { }

	hasRoleAccess(requiredRole: USER_ROLE) {
		return hasRoleAccess(requiredRole);
	}

	list(filters?: { name?: string; email?: string; id?: number }) {
		return this.http.get('/users/list', { params: filters });
	}

	delete(userId) {
		return this.http.delete(`/users/${userId}`);
	}

	resetPasswordAdmin(userId) {
		return this.http.post(`/users/resetPasswordAdmin`, { userId });
	}

	addUser(userId: number, user: User) {
		const params: User = { ...user };
		let route = '/users/register';

		if (userId) {
			route = `/users/${userId}`;
			delete params.password;
			return this.http.patch(route, params, { observe: 'body' });
		}

		return this.http.post(route, params, { observe: 'body' });
	}

	changeUserPassword(old_password, new_password) {
		return this.http.post(
			'/users/changeUserPassword',
			{ old_password, new_password },
			{
				observe: 'body'
			}
		);
	}

	updateUserPassword(user_id: number, password: string, confirm_password: string) {
		return this.http.post('/users/update-user-password', { user_id, password, confirm_password }, { observe: 'body' });
	}

	resetPassword(params: ChangePassword) {
		return this.http.post('/users/reset-password', params, {
			observe: 'body'
		});
	}

	forgotPassword(forgot) {
		return this.http.post('/users/forgotPassword', forgot, {
			observe: 'body'
		});
	}

	getUserInfo(userId: number, isAdminEdit?: boolean) {
		return this.http.post(
			'/users/getUserInfo',
			{ userId, isAdminEdit },
			{
				observe: 'body'
			}
		);
	}

	isLoggedIn() {
		let user = JSON.parse(localStorage.getItem('currentUser')) || {};
		return Object.keys(user).length;
	}

	validateResetPasswordLink(id, enc) {
		return this.http.get(`/users/validateResetPasswordLink`, { params: { id, enc } });
	}

}
