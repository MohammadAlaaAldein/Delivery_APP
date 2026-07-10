import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { BehaviorSubject } from "rxjs";
import { DeliveryAppConfig } from "src/app/app-config";

export const LANGUAGES = {
	EN: 'en',
	AR: 'ar',
};

@Injectable({
	providedIn: 'root'
})

export class LanguageService {

	public changeLanguageSubject = new BehaviorSubject<string>(this.getUsedLanguage());
	public changeLanguage = this.changeLanguageSubject.asObservable();

	constructor(
		private translate: TranslateService,
	) { }

	getUsedLanguage() {
		return localStorage.getItem('language') || DeliveryAppConfig.i18n;
	}

	checkLanguage() {
		const language = this.getUsedLanguage();
		this.translate.setDefaultLang(language);
		this.useLanguage(language);
	}

	useLanguage(language: string, reload = false) {
		this.translate.use(language);
		localStorage.setItem('language', language);
		this.changeLanguageSubject.next(language);

		if (reload)
			window.location.reload();
	}

	getFieldByLanguage(field: string) {
		return `${field}_${this.getUsedLanguage()}`;
	}
}

