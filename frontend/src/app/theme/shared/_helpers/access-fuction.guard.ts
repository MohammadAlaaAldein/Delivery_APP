import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { UsersService } from 'src/app/dashboard/users/users.service';

@Injectable({
	providedIn: 'root'
})
export class AccessFunctionGuard implements CanActivate {
	constructor(private userService: UsersService, private router: Router) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
		const requiredFunction = route.data['accessFunction'];

		if (this.userService.hasAccessFunctions(requiredFunction)) {
			return true;
		} else {
			this.router.navigate(['/unauthorized']);
			return false;
		}
	}
}
