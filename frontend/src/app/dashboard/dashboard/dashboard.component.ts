import { Component, effect, OnInit } from '@angular/core';
import { DeliveryAppConfig } from '../../app-config';
import { CommonModule, Location, LocationStrategy } from '@angular/common';
import { ThemeService } from '../../theme/shared/service/theme.service';
import { SharedModule } from '../../theme/shared/shared.module';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPrintModule } from 'ngx-print';

@Component({
	selector: 'app-dashboard',
	standalone: true,
	imports: [
		CommonModule,
		SharedModule,
		RouterModule,
		NgSelectModule,
		NgxPrintModule
	],
	templateUrl: './dashboard.component.html',
	styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
	layouts = DeliveryAppConfig.layout;
	currentLayout!: string;
	navCollapsed: boolean;
	windowWidth: number;

	// Constructor
	constructor(
		private location: Location,
		private locationStrategy: LocationStrategy,
		private themeService: ThemeService
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
		this.navCollapsed = this.windowWidth >= 1025 ? DeliveryAppConfig.isCollapse_menu : false;

		effect(() => {
			this.isThemeLayout(this.themeService.themeLayout());
		});
	}

	ngOnInit(): void { }

	// private method
	private isThemeLayout(layout: string) {
		this.currentLayout = layout;
	}
}
