// Angular import
import { Component, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location, LocationStrategy } from '@angular/common';
import { RouterModule } from '@angular/router';

// Project import
import { DeliveryAppConfig } from 'src/app/app-config';
import { ThemeService } from '../../shared/service/theme.service';
import { SharedModule } from '../../shared/shared.module';
import { ConfigurationComponent } from './configuration/configuration.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { NavigationComponent } from './navigation/navigation.component';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { NotificationMessageComponent } from 'src/app/shared/notification-message/notification-message.component';
import { SocketService } from 'src/app/shared/services/socket.service';

@Component({
	selector: 'app-admin',
	standalone: true,
	imports: [CommonModule, SharedModule, NavigationComponent, NavBarComponent, ConfigurationComponent, RouterModule, BreadcrumbComponent, NotificationMessageComponent],
	templateUrl: './admin.component.html',
	styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit, OnDestroy {
	// public props
	layouts = DeliveryAppConfig.layout;
	currentLayout!: string;
	navCollapsed: boolean = true;
	navCollapsedMob = false;
	windowWidth: number;

	currentYear = new Date().getFullYear();

	// Constructor
	constructor(
		private location: Location,
		private locationStrategy: LocationStrategy,
		private themeService: ThemeService,
		private socketService: SocketService
	) {
		this.currentLayout = DeliveryAppConfig.layout;

		let current_url = this.location.path();
		const baseHref = this.locationStrategy.getBaseHref();
		if (baseHref) {
			current_url = baseHref + this.location.path();
		}

		if (current_url === baseHref + '/layout/theme-compact' || current_url === baseHref + '/layout/box') {
			DeliveryAppConfig.isCollapse_menu = true;
		}

		this.windowWidth = window.innerWidth;
		// this.navCollapsed = this.windowWidth >= 1025 ? DeliveryAppConfig.isCollapse_menu : false;

		effect(() => {
			this.isThemeLayout(this.themeService.themeLayout());
		});
	}

	ngOnInit(): void {
		// Initialize WebSocket connection
		this.socketService.connect();
	}

	ngOnDestroy(): void {
		// Disconnect WebSocket when component is destroyed
		this.socketService.disconnect();
	}

	// private method
	private isThemeLayout(layout: string) {
		this.currentLayout = layout;
	}

	// public method
	navMobClick() {
		if (this.navCollapsedMob && !document.querySelector('app-navigation.coded-navbar')?.classList.contains('mob-open')) {
			this.navCollapsedMob = !this.navCollapsedMob;
			setTimeout(() => {
				this.navCollapsedMob = !this.navCollapsedMob;
			}, 100);
		} else {
			this.navCollapsedMob = !this.navCollapsedMob;
		}
		if (document.querySelector('app-navigation.pc-sidebar')?.classList.contains('navbar-collapsed')) {
			document.querySelector('app-navigation.pc-sidebar')?.classList.remove('navbar-collapsed');
		}
	}

	handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Escape') {
			this.closeMenu();
		}
	}

	closeMenu() {
		if (document.querySelector('app-navigation.pc-sidebar')?.classList.contains('mob-open')) {
			document.querySelector('app-navigation.pc-sidebar')?.classList.remove('mob-open');
		}
	}
}
