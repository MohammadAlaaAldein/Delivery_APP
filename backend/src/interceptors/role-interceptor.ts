import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { USER_ROLE } from 'src/modules/users/users.service';

export interface RoleInterceptorOptions {
	/**
	 * Allow access if user's entity_id matches the resource id from params
	 */
	allowSameEntity?: boolean;
	/**
	 * For "my" endpoints - requires user to have an entity_id
	 */
	requireEntityOwnership?: boolean;
}

/**
 * Unified Role Interceptor
 * - Supports multiple roles
 * - Supports entity ownership checks for "my" endpoints
 * - Supports same entity validation for param-based endpoints
 */
@Injectable()
export class RoleInterceptor implements NestInterceptor {
	private readonly roles: USER_ROLE[];

	constructor(
		roles: USER_ROLE | USER_ROLE[],
		private readonly options?: RoleInterceptorOptions,
	) {
		this.roles = Array.isArray(roles) ? roles : [roles];
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (!user)
			throw new UnauthorizedException();

		// Admin can do anything
		if (user.role === USER_ROLE.ADMIN)
			return next.handle();

		// Check if user has one of the required roles
		if (!this.roles.includes(user.role))
			throw new ForbiddenException();

		// For "my" endpoints - user must have an entity_id
		if (this.options?.requireEntityOwnership) {
			if (!user.entity_id)
				throw new ForbiddenException();
		}

		// If allowSameEntity is enabled, check entity_id matches the resource id
		if (this.options?.allowSameEntity) {
			const resourceId = parseInt(request.params?.id, 10);

			if (resourceId && user.entity_id !== resourceId)
				throw new ForbiddenException();
		}

		return next.handle();
	}
}
