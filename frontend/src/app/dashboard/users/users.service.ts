import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AccessFunction, User } from './user.interface';
import { AccessFunctions } from 'src/app/theme/shared/access-functions';
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

@Injectable({
	providedIn: 'root'
})
export class UsersService {

	constructor(private http: HttpClient) { }

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

	getAccessFunctions(userId, accessToken?: string) {
		return this.http.get(`/users/get-access-function/${userId}`, { params: { accessToken } });
	}

	getCurrentUserAccessFunctions() {
		return this.http.get(`/users/get-current-user-access-functions`);
	}

	updateUserAccessFunctions(userId: number, access_functions: AccessFunction) {
		return this.http.patch('/users/update-user-access-functions', { user_id: userId, access_functions });
	}

	hasAccessFunctions(requiredFunctions) {
		return true;
		let user = JSON.parse(localStorage.getItem('currentUser')) || {};
		let userAccessFunctions = user.access_functions ? Object.keys(user.access_functions) || [] : [];

		if (userAccessFunctions.includes(AccessFunctions.super_admin))
			return true;

		return requiredFunctions.some((requiredFunction) => userAccessFunctions.includes(requiredFunction));
	}
}
