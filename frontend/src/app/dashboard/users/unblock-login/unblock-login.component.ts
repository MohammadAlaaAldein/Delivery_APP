import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { AuthService } from '../login/auth.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { DeliveryAppConfig } from 'src/app/app-config';

@Component({
	selector: 'app-unblock-login',
	standalone: true,
	imports: [TranslateModule, SharedModule],
	templateUrl: './unblock-login.component.html'
})
export class UnblockLoginComponent {
	encKey: string = '';
	themeMode!: boolean;
	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private translate: TranslateService,
		private notificationMessageService: NotificationMessageService,
		private authService: AuthService
	) { }

	ngOnInit() {
		this.themeMode = DeliveryAppConfig.isDarkMode;
		this.route.queryParams.subscribe((params: any) => {
			if ('link_expired' in params) {
				this.router.navigate(['/']);
				this.notificationMessageService.setMessage(this.translate.instant('otp.link_expired'));
				return;
			}
			this.encKey = params.enc;
		});
	}

	unblockUser() {
		this.authService.unBlockLogin(this.encKey).subscribe((res: { err: string | null, res: boolean | null }) => {
			switch (res.err) {
				case 'link_expired':
					this.notificationMessageService.setMessage(this.translate.instant('otp.link_expired'));
					break;
				default:
					return this.router.navigate(['/login']);
			}
		});
	}
}
