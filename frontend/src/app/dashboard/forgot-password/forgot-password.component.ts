import { Component, OnInit, ViewChild, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { SharedModule } from 'src/app/theme/shared/shared.module';
import { ThemeService } from 'src/app/theme/shared/service/theme.service';
import { DeliveryAppConfig } from 'src/app/app-config';
import { UsersService } from 'src/app/dashboard/users/users.service';
import { NotifierService } from 'angular-notifier';
import { CaptchaModule } from 'src/app/captcha/captcha.module';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ValidateFormDirective } from 'src/app/shared/directives/validate-form';
import { TranslateService } from '@ngx-translate/core';
import { CaptchaComponent } from 'src/app/captcha/captcha/captcha.component';
import { AuthService } from '../users/login/auth.service';

@Component({
	selector: 'app-forgot-password-password',
	standalone: true,
	imports: [RouterModule, SharedModule, CaptchaModule, FormsModule, ValidateFormDirective],
	templateUrl: './forgot-password.component.html',
	styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
	@ViewChild('captchaComponent') captchaComponent: CaptchaComponent;

	themeMode!: boolean;
	forgot = {
		email: '',
		captcha_key: '',
		captcha_text: '',
		haveCaptcha: false
	};
	elementValidationMapper: {
		[eleId: string]: {
			isValid: boolean;
		};
	} = {};

	constructor(
		private themeService: ThemeService,
		private usersService: UsersService,
		private notifier: NotifierService,
		private router: Router,
		private titleService: Title,
		private translate: TranslateService,
		private authService: AuthService
	) {
		effect(() => {
			this.isDarkTheme(this.themeService.isDarkTheme());
		});
	}

	ngOnInit() {
		this.titleService.setTitle(`${this.translate.instant('g.delivery_app')} - ${this.translate.instant('users.forgot_password')}`);

		this.themeMode = DeliveryAppConfig.isDarkMode;
		this.resetElementValidationMapper();
	}

	private isDarkTheme(isDark: boolean) {
		this.themeMode = isDark;
	}

	forgotPassword() {
		if (!this.validateForm()) return;

		let forgot = { ...this.forgot };
		forgot.captcha_key = this.captchaComponent.captchaKey;
		forgot.captcha_text = this.captchaComponent.captchaText;
		forgot.haveCaptcha = true;

		this.usersService.forgotPassword(forgot).subscribe((data: any) => {
			this.captchaComponent.getCaptcha();

			if (data.response?.err) {
			}

			this.notifier.notify('success', this.translate.instant('users.forgot_email_sent_successfully'));
			return this.router.navigate(['/login']);
		});
	}

	validateForm() {
		let isValid = true;
		if (!this.forgot.email) {
			this.elementValidationMapper['email'].isValid = false;
			isValid = false;
		}
		return isValid;
	}

	private resetElementValidationMapper() {
		this.elementValidationMapper = { email: { isValid: true } };
	}

	goBack() {
		this.router.navigate(['/login']);
	}
}
