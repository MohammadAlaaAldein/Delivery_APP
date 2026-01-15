// angular import
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

type User = {
	id?: number;
	name?: string;
	phone_number?: string;
	role_id?: number;
	company_id?: number;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
	private currentUserSignal = signal<User | null>(null);

	constructor(
		private router: Router,
		private http: HttpClient
	) {
		// Initialize the signal with the current user from localStorage
		const storedUser = localStorage.getItem('currentUser');
		if (storedUser) {
			this.currentUserSignal.set(JSON.parse(storedUser) as User);
		}
	}

	getCurrentUser() {
		const currentUser = localStorage.getItem('currentUser');
		if (currentUser) {
			return JSON.parse(currentUser);
		}
		return null;
	}

	public get currentUserValue(): User | null {
		// Access the current user value from the signal
		return this.currentUserSignal();
	}

	login(email: string, password: string, options: any = {}) {
		return this.http.post(`/auth/login`, { email, password, options });
	}

	logout() {
		return this.http.post('/auth/logout', {});
	}

	logoutUser() {
		this.logout().subscribe({
			next: (done: boolean) => {
				this.clearUserSession();
			},
			error: (err) => {
				this.clearUserSession();
			}
		});
	}

	private clearUserSession() {
		localStorage.removeItem('currentUser');
		this.currentUserSignal.set(null);
		this.router.navigate(['/login']);
	}

	refreshToken() {
		const currentUser = this.getCurrentUser();
		if (!currentUser)
			return;

		const refreshToken = currentUser.refreshToken;
		return this.http.post(`/auth/refresh`, {refresh: refreshToken});
	}

	updateToken(token: string) {
		if (!token)
			return;

		const currentUser = this.getCurrentUser();
		if (currentUser) {
			currentUser.accessToken = token;
			localStorage.setItem('currentUser', JSON.stringify(currentUser));
		}
		return currentUser;
	}

	setCurrentUserSignal(user) {
		this.currentUserSignal.set(user as User);
	}

	resendLoginOtp(email: string) {
		return this.http.post(`/auth/resend-login-otp`, { email });
	}

	verifyLoginWithOtp(email: string, otpCode: string) {
		return this.http.post(`/auth/verify-login-otp-code`, { email, otpCode });
	}

	unBlockLogin(encKey: string) {
		return this.http.post(`/auth/unblockLogin`, { encKey });
	}
}
