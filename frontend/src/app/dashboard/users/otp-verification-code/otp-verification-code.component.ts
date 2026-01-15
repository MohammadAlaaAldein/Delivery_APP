import { Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CaptchaModule } from 'src/app/captcha/captcha.module';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { AuthService } from '../login/auth.service';
import { OtpVerifyResponse } from '../login-response.interface';
import { NgFor } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';

@Component({
	selector: 'app-otp-verification-code',
	standalone: true,
	imports: [RouterModule, SharedModule, CaptchaModule, FormsModule, NgFor, FormsModule],
	templateUrl: './otp-verification-code.component.html',
	styleUrl: './otp-verification-code.component.scss'
})
export class OtpVerificationCodeComponent {
	@Input() userEmail: string = '';
	@Output() loginByOptVerified = new EventEmitter<void>();
	@ViewChildren('otpInput') otpInputList: QueryList<ElementRef>;

	themeMode!: boolean;
	message: string = '';
	error: string = '';
	otp: string[] = ['', '', '', '', '', ''];

	// ===== OTP STATE (ported from old component) =====
	resendCountdown: number = 60;
	resendDisabled: boolean = true;
	resendTimer: any = null;

	maxAttemptsReached: boolean = false;
	accountBlocked: boolean = false;
	blockTimeRemaining: number = 30;

	resendCount = 0;
	maxResendAttemptsReached: boolean = false;
	otpJustResent: boolean = false;

	readonly otpLength: number = 6;
	readonly initialResendWaitTime: number = 60;
	readonly subsequentResendWaitTime: number = 300;

	constructor(
		private authService: AuthService,
		private translate: TranslateService,
		private notificationService: NotificationMessageService
	) {}

	ngOnInit() {
		this.startResendTimer();
	}

	// ===== TIMER LOGIC =====
	startResendTimer() {
		this.resendDisabled = true;
		const waitTime = this.resendCount == 0 ? this.initialResendWaitTime : this.subsequentResendWaitTime;

		this.resendCountdown = waitTime;

		if (this.resendTimer)
			clearInterval(this.resendTimer);

		this.resendTimer = setInterval(() => {
			this.resendCountdown--;
			if (this.resendCountdown <= 0) {
				this.resendDisabled = false;
				clearInterval(this.resendTimer);
				this.resendTimer = null;
			}
		}, 1000);
	}

	stopResendTimer() {
		if (this.resendTimer) {
			clearInterval(this.resendTimer);
			this.resendTimer = null;
		}
	}

	getFormattedCountdown(): string {
		const m = Math.floor(this.resendCountdown / 60);
		const s = this.resendCountdown % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	// ===== VERIFY OTP =====
	verifyCode() {
		const code = this.otp.join('');
		if (code.length !== this.otpLength)
			return this.notificationService.setMessage(this.translate.instant('otp.invalid_otp'));

		this.error = '';
		this.message = '';

		this.authService.verifyLoginWithOtp(this.userEmail, code).subscribe((res: { data: OtpVerifyResponse } ) => {
			switch (res.data.err) {
				case 'invalid_otp':
					this.notificationService.setMessage(this.translate.instant('otp.invalid_otp'));
					this.otp = ['', '', '', '', '', ''];
					break;

				case 'force_resend_otp': // max attempts
					this.maxAttemptsReached = true;
					this.stopResendTimer();
					this.resendDisabled = false;
					this.otp = ['', '', '', '', '', ''];
					break;

				case 'blocked':
					this.accountBlocked = true;
					this.maxAttemptsReached = false;
					this.resendDisabled = true;
					this.otp = ['', '', '', '', '', ''];
					this.stopResendTimer();
					break;

				case 'otp_expired':
					this.notificationService.setMessage(this.translate.instant('otp.otp_expired'));
					this.stopResendTimer();
					this.otp = ['', '', '', '', '', ''];
					this.resendDisabled = false;
					break;

				default: // success
					this.stopResendTimer();
					this.loginByOptVerified.emit();
					break;
			}
		});
	}

	// ===== RESEND OTP =====
	resendCode() {
		if (this.resendDisabled)
			return;

		this.error = '';
		this.message = '';

		this.authService.resendLoginOtp(this.userEmail).subscribe((res: { data: OtpVerifyResponse }) => {
			switch (res.data.err) {
				case 'otp_generation_limit_exceeded':
					this.maxResendAttemptsReached = true;
					this.resendDisabled = true;
					this.stopResendTimer();
					break;

				case 'last_allowed_otp_code_generated':
					this.maxResendAttemptsReached = true;
					this.otpJustResent = true;
					this.maxAttemptsReached = false;
					this.otp = ['', '', '', '', '', ''];
					this.stopResendTimer();
					break;

				default:
					this.otpJustResent = true;
					this.maxAttemptsReached = false;
					this.resendCount++;
					this.otp = ['', '', '', '', '', ''];
					this.startResendTimer();
					break;
			}
		});
	}

	focusOtpInput(idx:number){
		const list = this.otpInputList?.toArray();
		if(list && list[idx])
			(list[idx].nativeElement as HTMLInputElement).focus();
	}

	handleOtpInput(event: any, index: number) {
		const val = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, '');
		this.otp[index] = val.slice(-1);

		if (val && index < 5)
			this.focusOtpInput(index + 1);

		if (!val && index > 0)
			this.focusOtpInput(index - 1);
	}

	handleOtpPaste(event: ClipboardEvent, index: number) {
		event.preventDefault();
		const pastedData = event.clipboardData?.getData('text').replace(/[^0-9]/g, '');
		
		if (!pastedData)
			return;

		// Split pasted data and fill inputs starting from current index
		const digits = pastedData.split('').slice(0, this.otpLength - index);
		digits.forEach((digit, i) => {
			if (index + i < this.otpLength) {
				this.otp[index + i] = digit;
			}
		});

		// Focus the next empty input or the last filled input
		const nextIndex = Math.min(index + digits.length, this.otpLength - 1);
		setTimeout(() => this.focusOtpInput(nextIndex), 10);
	}

	handleOtpKeydown(event: KeyboardEvent, index:number) {
		if (event.key === 'Backspace' && !this.otp[index] && index > 0)
			this.focusOtpInput(index - 1);
	}

	isOtpComplete(): boolean {
		return this.otp.join('').length === this.otpLength && this.otp.every(c => c !== undefined && c !== null && c !== '');
	}
}
