import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { USER_ROLE } from 'src/modules/users/users.service';

@Injectable()
export class RoleInterceptor implements NestInterceptor {
	constructor(
		private readonly role: USER_ROLE,
	) { }

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (!user || (user.role !== USER_ROLE.ADMIN && user.role !== this.role))
			throw new UnauthorizedException();

		return next.handle();
	}
}
