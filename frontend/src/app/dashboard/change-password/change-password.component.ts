import { Component, effect, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ValidateFormDirective } from 'src/app/shared/directives/validate-form';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { UsersService } from '../users/users.service';
import { ChangePassword } from './change-password.interface';
import { ThemeService } from 'src/app/theme/shared/service/theme.service';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';

@Component({
	selector: 'app-change-password',
	standalone: true,
	imports: [FormsModule, ValidateFormDirective, SharedModule],
	templateUrl: './change-password.component.html',
	styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent implements OnInit {

	themeMode!: boolean;
	changePasswordInfo: ChangePassword = {
		userId: null,
		newPassword: '',
		confirmPassword: '',
		encKey: ''
	};
	
	newPasswordVisible = false;
	confirmPasswordVisible = false;

	elementValidationMapper: { [key: string]: { isValid: boolean } } = {
		newPassword: { isValid: true },
		confirmPassword: { isValid: true },
	};

	constructor(
		private themeService: ThemeService,
		private userService: UsersService,
		private router: Router,
		private route: ActivatedRoute,
		private notificationService: NotificationMessageService
	) {
		effect(() => {
			this.isDarkTheme(this.themeService.isDarkTheme());
		});
	}

	ngOnInit() {
		const pageName = this.route.snapshot.data['pageName'];
		this.resetElementValidationMapper();
		switch (pageName) {
			case 'reset_password':
				this.changePasswordInfo.userId = this.route.snapshot.params['userId'];
				this.route.queryParams.subscribe(params => {
					this.changePasswordInfo.encKey = params['enc'] || '';
				});
			break;
		}
	}

	private isDarkTheme(isDark: boolean) {
		this.themeMode = isDark;
	}

	resetPassword() {
		this.resetElementValidationMapper();

		if (!this.validateRestPasswordForm())
			return;

		this.userService.resetPassword(this.changePasswordInfo).subscribe(() => {
			this.notificationService.setMessage('translate|users.password_changed_successfully', { type: 'success', timeout: 10000 });
			this.router.navigate(['/login']);
		});
	}

	validateRestPasswordForm() {
		const { newPassword, confirmPassword } = this.changePasswordInfo;
		if (!newPassword) {
			this.elementValidationMapper[newPassword].isValid = false;
			return false
		}
			
		if (!confirmPassword) {
			this.elementValidationMapper[confirmPassword].isValid = false;
			return false
		}

		if (!newPassword || !confirmPassword)
			return false;

		if (confirmPassword != newPassword) {
			this.notificationService.setMessage('translate|users.new_confirm_password_not_mach');
			this.elementValidationMapper = { confirmPassword: { isValid: false }, newPassword: { isValid: false } };
			return false;
		}

		return true;
	}

	private resetElementValidationMapper() {
		this.elementValidationMapper = { confirmPassword: { isValid: true }, newPassword: { isValid: true } };
	}

	goBack() {
    	this.router.navigate(['/login']);
  	}
}
