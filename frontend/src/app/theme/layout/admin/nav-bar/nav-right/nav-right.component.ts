// Angular import
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

// project import
import { DeliveryAppConfig } from 'src/app/app-config';
import { SharedModule } from 'src/app/theme/shared/shared.module';

// third party
import { TranslateService } from '@ngx-translate/core';
import screenfull from 'screenfull';
import { ConfigurationComponent } from '../../configuration/configuration.component';
import { AuthService } from 'src/app/dashboard/users/login/auth.service';
import { USER_ROLE, UsersService } from 'src/app/dashboard/users/users.service';
import { CommonDataService } from 'src/app/shared/services/common-data.service';
import { NgSelectModule } from "@ng-select/ng-select";

@Component({
	selector: 'app-nav-right',
	standalone: true,
	imports: [SharedModule, RouterModule, ConfigurationComponent, NgSelectModule],
	templateUrl: './nav-right.component.html',
	styleUrl: './nav-right.component.scss'
})
export class NavRightComponent implements OnInit {
	readonly USER_ROLE = USER_ROLE;

	user = null;
	screenFull: boolean = true;
	componentSections = [
		{
			title: this.translate.instant('nav.users_management'),
			items: [
				{
					title: this.translate.instant('nav.users_list'),
					url: '/users',
					role: USER_ROLE.ADMIN,
				},
				{
					title: this.translate.instant('nav.add_user'),
					url: '/users/create',
					role: USER_ROLE.ADMIN,
				},
			]
		},
		// {
		// 	title: this.translate.instant('nav.admin_tools'),
		// 	items: [
		// 		{
		// 			title: this.translate.instant('nav.api_logs'),
		// 			url: '/api-logs',
		// 			role: USER_ROLE.ADMIN,
		// 		},
		// 		{
		// 			title: this.translate.instant('nav.action_log'),
		// 			url: '/action-log',
		// 			role: USER_ROLE.ADMIN,
		// 		},
		// 	]
		// },
	];

	timezones: Array<{ value: number, label: string }> = [];
	selectedTimezone: { value: number; label: string } | null = null;

	constructor(
		public authService: AuthService,
		private translate: TranslateService,
		public usersService: UsersService,
		private commonDataService: CommonDataService
	) { }

	ngOnInit() {
		this.user = this.authService.getCurrentUser();
		this.selectedTimezone = this.commonDataService.getCurrentUserTimeZone();
		this.timezones = this.commonDataService.timeZoneMenu.map(tz => ({ value: tz.id, label: tz.displayName }));

		setTimeout(() => {
			this.useLanguage(DeliveryAppConfig.i18n);
		}, 0);
	}

	logout() {
		this.authService.logoutUser();
	}

	// user according language change of sidebar menu item
	useLanguage(language: string) {
		this.translate.use(language);
	}

	// full screen toggle
	toggleFullscreen() {
		this.screenFull = screenfull.isFullscreen;
		if (screenfull.isEnabled) {
			screenfull.toggle();
		}
	}

	updateTimezone() {
		this.commonDataService.setTimezone(this.selectedTimezone);
	}

}
