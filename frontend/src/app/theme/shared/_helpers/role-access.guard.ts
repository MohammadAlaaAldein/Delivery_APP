// angular import
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { hasRoleAccess } from 'src/app/dashboard/users/users.service';

@Injectable({ providedIn: 'root' })
export class RoleAccessGuard implements CanActivate {
	// constructor
	constructor(private router: Router) { }

	// public method
	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		const role = route.data['role'];
		return hasRoleAccess(role)
	}
}
