// angular import
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
	// constructor
	constructor(private router: Router) {}

	// public method
	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		const currentUser = localStorage.getItem('currentUser');
		if (currentUser) {
			// logged in so return true
			return true;
		}

		// not logged in so redirect to login page with the return url
		this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } }); //added by omar
		return false;
	}
}
