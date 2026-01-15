import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiLogsService } from './api-logs.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ApiLogsInterceptor implements NestInterceptor {

	constructor(
		private apiLogsService: ApiLogsService,
		private readonly reflector: Reflector,
	) { }

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const ignoreLogging = this.reflector.get<boolean>('ignoreLogging', context.getHandler());
		if (ignoreLogging)
			return next.handle(); // Skip logging

		const requestData: any = context.switchToHttp().getRequest();
		const { url, body, query, user } = requestData;
		const user_id = user?.id || 0;

		return next.handle().pipe(
			map((response) => {
				this.apiLogsService.saveRequestDetails({
					user_id,
					end_point: url,
					body_request: body,
					query_request: query,
					response
				});
				// console.log({ end_point, user_id, body, query, response: JSON.stringify(response) });
				return response;
			}),
		);
	}
}