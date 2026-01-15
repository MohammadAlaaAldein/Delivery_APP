import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpInterceptor } from '@angular/common/http';
import { catchError, finalize, Observable, Subject, switchMap, tap, throwError } from 'rxjs';
import { LoaderService } from './loader.service';
import { CustomHttpParams } from './custom-httpParam';
import { AuthService } from 'src/app/dashboard/users/login/auth.service';
import { NotificationMessageService } from '../notification-message/notification-message.service';

@Injectable({
	providedIn: 'root'
})
export class LoaderInterceptorService implements HttpInterceptor {
	private requests: HttpRequest<any>[] = [];
	responseCode = {
		successful: 200,
		created: 201,
		accepted: 202,
		noContent: 204,
		badRequest: 400,
		unauthorized: 401,
		forbidden: 403,
		notFound: 404,
		methodNotAllowed: 405,
		conflict: 409,
		internalServerError: 500,
		notImplemented: 501,
		serviceUnavailable: 503
	};

	isRefreshingToken = false;
	activeRequests = 0;
	resStatusFlipped = {};

	messages: any = {
		success: 'globalSuccessMsg',
		failed: 'globalErrMsg',
		not_authorized: 'globalAuthMsg',
		api_timeout: 'globalTimeoutMsg'
	};

	constructor(
		private loaderService: LoaderService,
		private router: Router,
		private authService: AuthService,
		private notificationService: NotificationMessageService
	) {}

	pushRequest(req: HttpRequest<any>) {
		this.requests.push(req);
		this.loaderService.isLoading.next(true);
	}

	removeRequest(req: HttpRequest<any>) {
		const reqIndex = this.requests.indexOf(req);
		if (reqIndex >= 0)
			this.requests.splice(reqIndex, 1);

		this.loaderService.isLoading.next(this.requests.length > 0);
	}

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		const currentUser = localStorage.getItem('currentUser');
		const user = currentUser ? JSON.parse(currentUser) : null;
		const accessToken = user?.accessToken;

		let clonedRequest = req;
		if (accessToken) {
			clonedRequest = req.clone({
				headers: req.headers.set('Authorization', `Bearer ${accessToken}`),
			});
		}

		this.activeRequests++;
		this.loaderService.isLoading.next(true);

		return next.handle(clonedRequest).pipe(
			tap((event) => {
				if (event instanceof HttpResponse) {
				this.handleSuccessResponse(event, clonedRequest);
				}
			}),
			catchError((error: any) => this.handleError(error, clonedRequest, next)),
			finalize(() => {
				this.activeRequests--;
				if (this.activeRequests === 0)
					this.loaderService.isLoading.next(false);
			})
		);
	}

	private handleSuccessResponse(event: HttpResponse<any>, req: HttpRequest<any>): void {
		const statusCode = event.body?.statusCode || event.status;
		const isValid = [this.responseCode.successful, this.responseCode.created, this.responseCode.accepted, this.responseCode.noContent].includes(statusCode);

		if (!isValid) {
			switch (statusCode) {
				case this.responseCode.unauthorized:
					this.router.navigate(['/unauthorized']);
					break;
				case this.responseCode.forbidden:
				case this.responseCode.notFound:
				case this.responseCode.internalServerError:
				case this.responseCode.badRequest:
				case this.responseCode.conflict:
				case this.responseCode.notImplemented:
				case this.responseCode.serviceUnavailable:
				case this.responseCode.methodNotAllowed:
					this.notificationService.setMessage('globalErrMsg', { type: 'danger' });
					break;

				default:
					this.notificationService.setMessage('globalErrMsg', { type: 'danger' });
					break;
			}
		}

		// Additional custom logic for accepted statuses
		const acceptedStatus = req.params instanceof CustomHttpParams && req.params.object?.acceptedStatus;
		if (acceptedStatus && acceptedStatus.includes(this.resStatusFlipped[event.body?.response_status])) {
		// Process the accepted status
		}
	}

	private handleError(res: any, req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		if (res.error.message === 'Unauthorized') {
			this.isRefreshingToken = true;

			if (req.url.includes('/auth/refresh')) {
				this.authService.logoutUser();
				this.isRefreshingToken = false;
				return throwError(res.error.message);
			}

			if (req.url.includes('/auth/login')) {
				this.notificationService.setMessage('translate|users.invalid_email_or_password', {clearOnXTimeNavigate: 1});
				return throwError(res.error.message);
			}

			return this.authService.refreshToken().pipe(
				switchMap((res: any) => {
					this.isRefreshingToken = false;

					// Update token in storage
					this.authService.updateToken(res.accessToken);

					// Retry the failed request with a new token
					const newRequest = req.clone({
					headers: req.headers.set('Authorization', `Bearer ${res.accessToken}`),
					});
					return next.handle(newRequest);
				}),
				catchError((refreshError) => {
					this.isRefreshingToken = false;
					this.router.navigate(['/unauthorized']);
					return throwError(refreshError);
				})
			);
		}

		let errMsg = res.error?.message, errorMessages = [];
		// clean up device.configs. if exists
		if(errMsg) {
			if(!Array.isArray(errMsg))
				errMsg = [errMsg];

			for(let msg of errMsg) {
				if (msg.startsWith("device.configs."))
					errorMessages.push(msg.replace(/^device\.configs\./, ""));
				else if (msg.startsWith("device."))
					errorMessages.push(msg.replace(/^device\./, ""));
				else
					errorMessages.push(msg);
			}
		}

		const errorMessage = errorMessages.length ? `translate|${errorMessages.join('<br>')}` : 'globalErrMsg';
		this.notificationService.setMessage(errorMessage, { type: 'danger' });

		return throwError(res.error.message || 'An error occurred');
  	}

}
