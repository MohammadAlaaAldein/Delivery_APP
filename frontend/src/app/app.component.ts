// Angular import
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PushNotificationService } from './shared/services/push-notification.service';
import { LanguageService } from './shared/services/language.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
	// public props
	title = 'Delivery APP';

	// Constructor
	constructor(
		public translate: TranslateService,
		private router: Router,
		private pushNotificationService: PushNotificationService, // Inject to initialize
		private languageService: LanguageService
	) {
		translate.addLangs(['en', 'ar']);
		const language = this.languageService.getUsedLanguage();
		translate.setDefaultLang(language);
		this.languageService.checkLanguage();
	}

	// Life cycle events
	ngOnInit() {
		this.router.events.subscribe((evt) => {
			if (!(evt instanceof NavigationEnd)) {
				return;
			}
			window.scrollTo(0, 0);
		});
	}
}
