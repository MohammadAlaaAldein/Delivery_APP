// Angular import
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit, effect, HostListener } from '@angular/core';
import { Router } from '@angular/router';

// project import
import { DeliveryAppConfig } from 'src/app/app-config';
import { ThemeService } from 'src/app/theme/shared/service/theme.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';

@Component({
	selector: 'app-navigation',
	standalone: true,
	imports: [SharedModule, CommonModule],
	templateUrl: './navigation.component.html',
	styleUrl: './navigation.component.scss'
})
export class NavigationComponent implements OnInit {
	// public props
	@Output() NavCollapsedMob = new EventEmitter();
	@Output() SubmenuCollapse = new EventEmitter();
	navCollapsedMob = false;
	windowWidth = window.innerWidth;
	themeMode!: string;

	// constructor
	constructor(
		public router: Router,
		private themeService: ThemeService
	) {
		effect(() => {
			this.isThemeLayout(this.themeService.themeLayout());
		});
	}

	ngOnInit() {
		this.themeMode = DeliveryAppConfig.layout;
	}

	// private method
	private isThemeLayout(layout: string) {
		this.themeMode = layout;
	}

	@HostListener('window:resize', ['$event'])
	// eslint-disable-next-line
	onResize(event: any) {
		this.windowWidth = event.target.innerWidth;
		this.navCollapseMob();
	}

	// public method
	navCollapseMob() {
		if (this.windowWidth < 1025) {
			this.NavCollapsedMob.emit();
		}
	}

	navSubmenuCollapse() {
		document.querySelector('app-navigation.coded-navbar')?.classList.add('coded-trigger');
	}

	returnHome() {
		this.router.navigate(['/default']);
	}
}
