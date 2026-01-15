import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NotificationMessage } from './notification-message.model';

@Injectable({
	providedIn: 'root'
})
export class NotificationMessageService {

	public messageSubject: BehaviorSubject<NotificationMessage> = new BehaviorSubject<NotificationMessage>(new NotificationMessage());

	constructor(
		private translateService: TranslateService
	) {
	}

	//message.type possible values = ['success', 'info', 'warning', 'danger']
	setMessage(msg: string, options: NotificationMessage = {}) {
		if (msg) {
			options = {
				message:msg,
				type: 'danger',
				show: true,
				scrollToTop: true,
				timeout: 10000,
				safeType: 'no',
				numberOfNavigate: 0,
			 	clearOnXTimeNavigate: 2,
				...options,
			}
		}

		if(msg == 'globalSuccessMsg') {
			options.message = this.translateService.instant('g.global_success_msg');
			options.type = 'success';
		} else if(msg == 'globalErrMsg') {
			options.message = this.translateService.instant('g.global_err');
		} else if(msg == 'globalAuthMsg') {
			options.message = this.translateService.instant('g.global_auth_err');
		} else if(msg == 'globalTimeoutMsg') {
			options.message = this.translateService.instant('g.request_timed_out');
		} else if(msg == 'globalInvalidCaptcha') {
			options.message = this.translateService.instant('g.invalid_captcha');
		} else if(msg !== null) {
			let splitted = msg.split('|');

			if(splitted[0] === "translate")
				options.message = this.translateService.instant(splitted[1]);
		}

		this.messageSubject.next(options);
	}

	closeNotification(){
		this.setMessage(null, {type: null, timeout: 700, scrollToTop: false, show: false});
	};
}
