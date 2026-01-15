// Angular import
import { Component, Input, Output, EventEmitter, OnInit, effect } from '@angular/core';
import { Router } from '@angular/router';

// project import
import { DeliveryAppConfig } from 'src/app/app-config';
import { UsersService } from 'src/app/dashboard/users/users.service';
import { ThemeService } from 'src/app/theme/shared/service/theme.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';

@Component({
	selector: 'app-nav-logo',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './nav-logo.component.html',
	styleUrl: './nav-logo.component.scss'
})
export class NavLogoComponent implements OnInit {
	// public props
	@Input() navCollapsed!: boolean;
	@Output() NavCollapse = new EventEmitter();
	windowWidth: number;
	themeMode!: boolean;
	hideNavToggle = true;

	// Constructor
	constructor(
		public router: Router,
		private themeService: ThemeService,
		public userService: UsersService
	) {
		this.windowWidth = window.innerWidth;
		effect(() => {
			this.isDarkTheme(this.themeService.isDarkTheme());
		});
	}

	// life cycle event
	ngOnInit() {
		this.themeMode = DeliveryAppConfig.isDarkMode;
	}

	// private method
	private isDarkTheme(isDark: boolean) {
		this.themeMode = isDark;
	}

	// public method
	navCollapse() {
		if (this.windowWidth >= 1025) {
			this.navCollapsed = !this.navCollapsed;
			this.NavCollapse.emit();
		}
	}

	returnToHome() {
		this.router.navigate(['/dashboard']);
	}
}
