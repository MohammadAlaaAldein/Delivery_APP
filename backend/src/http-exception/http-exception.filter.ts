import { Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import * as Sentry from "@sentry/nestjs";
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	@SentryExceptionCaptured()
	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<FastifyReply>();
		const request = ctx.getRequest<Request>();

		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		let message = 'Internal Server Error';
		let error = 'Internal Server Error';

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const responseBody = exception.getResponse();

			// Extract message and error fields from HttpException response
			if (typeof responseBody === 'string') {
				message = responseBody;
			} else if (typeof responseBody === 'object') {
				const responseObject = responseBody as Record<string, any>;
				message = responseObject.message || message;
				error = responseObject.error || error;
			}
		} else if (exception instanceof Error) {
			message = exception.message;
		}

		Sentry.withScope((scope) => {
			scope.setTag('path', request.url);
			scope.setExtra('message', message);
			scope.setExtras({
				additionalInfo: error,
				timestamp: new Date().toISOString(),
				status
			});
			Sentry.captureException(exception);
		})

		if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
			// Log the error (can be enhanced with a logging library)
			console.error('Error occurred:', {
				status,
				message,
				error,
				stack: (exception as Error)?.stack,
				path: request.url,
			});
		}

		// Send the custom response
		response.status(status).send({
			statusCode: status,
			message,
			error,
			timestamp: new Date().toISOString(),
			path: request.url,
		});
	}
}
