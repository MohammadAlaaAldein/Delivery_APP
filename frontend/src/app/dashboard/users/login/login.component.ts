import { Component, ViewChild, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { CaptchaModule } from 'src/app/captcha/captcha.module';
import { NotifierModule } from 'angular-notifier';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { ValidateFormDirective } from 'src/app/shared/directives/validate-form';
import { ThemeService } from 'src/app/theme/shared/service/theme.service';
import { DeliveryAppConfig } from 'src/app/app-config';
import { CaptchaComponent } from 'src/app/captcha/captcha/captcha.component';
import { User } from '../user.interface';
import { UsersService } from '../users.service';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { OtpVerificationCodeComponent } from "../otp-verification-code/otp-verification-code.component";
import { LoginResponse } from '../login-response.interface';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [
		RouterModule,
		FormsModule,
		SharedModule,
		ValidateFormDirective,
		SweetAlert2Module,
		CaptchaModule,
		NotifierModule,
		CommonModule,
		OtpVerificationCodeComponent
	],
	templateUrl: './login.component.html',
	styleUrl: './login.component.scss'
})
export class LoginComponent {
	themeMode!: boolean;
	usernameValue = '';
	userPassword = '';
	error = '';
	passwordVisible = false;

	has2svOpt: boolean = false;

	showCaptcha: boolean = false;
	@ViewChild('captchaComponent', { static: false }) captchaComponent: CaptchaComponent;

	elementValidationMapper: {
		[eleId: string]: {
			isValid: boolean;
		};
	} = {};

	constructor(
		private themeService: ThemeService,
		private router: Router,
		private authService: AuthService,
		private translate: TranslateService,
		private titleService: Title,
		private userService: UsersService,
		private notificationMessage: NotificationMessageService,
	) {
		effect(() => {
			this.isDarkTheme(this.themeService.isDarkTheme());
		});
	}

	ngOnInit() {
		this.titleService.setTitle(`${this.translate.instant('g.delivery_app')} - ${this.translate.instant('users.login')}`);

		this.themeMode = DeliveryAppConfig.isDarkMode;
		this.resetElementValidationMapper();
		window.addEventListener('popstate', () => {
			if (this.has2svOpt)
				this.has2svOpt = false;
		});
	}

	private isDarkTheme(isDark: boolean) {
		this.themeMode = isDark;
	}

	login() {
		if (!this.validateForm())
			return;

		this.authService.login(this.usernameValue, this.userPassword).subscribe((res: LoginResponse) => {
			this.notificationMessage.closeNotification();
			const currentUser = {
				name: res.name,
				access_functions: null,
				accessToken: res.accessToken,
				refreshToken: res.refreshToken,
			}

			localStorage.setItem('currentUser', JSON.stringify(currentUser));
			return this.router.navigate(['dashboard']);
		});
	}

	validateForm() {
		let isValid = true;
		if (!this.usernameValue) {
			this.elementValidationMapper['email'].isValid = false;
			isValid = false;
		}
		if (!this.userPassword) {
			this.elementValidationMapper['password'].isValid = false;
			isValid = false;
		}
		return isValid;
	}

	private resetElementValidationMapper() {
		this.elementValidationMapper = { email: { isValid: true }, password: { isValid: true } };
	}

	loginByOptVerified() {
		return this.login();
	}
}
