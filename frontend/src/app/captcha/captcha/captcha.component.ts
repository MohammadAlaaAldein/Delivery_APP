import { Component, OnInit, Input } from '@angular/core';
import { CommonService } from 'src/app/shared/services/common.service';

@Component({
	selector: 'app-captcha',
	templateUrl: './captcha.component.html'
})
export class CaptchaComponent implements OnInit {
	triesLimitReached: boolean = false;
	triesCount: number = 0;
	triesLimit: number = 3;

	captchaUrl: string = null;

	constructor(private commonService: CommonService) {}
	@Input() captchaText: string = '';
	captchaKey: string = null;

	ngOnInit() {
		this.getCaptcha(true);
	}

	getCaptcha(refresh = false) {
		if (!refresh) this.triesCount++;

		if (this.triesCount >= this.triesLimit) {
			this.triesLimitReached = true;
			return;
		}

		this.captchaText = null;
		let captcha = this.commonService.getCaptchaUrl();
		this.captchaUrl = captcha.url;
		this.captchaKey = captcha.key;
	}
}
