import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UsersService } from 'src/app/dashboard/users/users.service';

@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivate {
	constructor(
		private router: Router,
		private usersService: UsersService
	) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		// logged-out => return true
		if (!this.usersService.isLoggedIn())
			return true;

		this.router.navigate(['/']);
		return false;
	}
}
