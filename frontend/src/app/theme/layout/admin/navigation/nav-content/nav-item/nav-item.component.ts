// Angular import
import { Component, Input, OnInit, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';

// Project import
import { NavigationItem } from '../../navigation';
import { DeliveryAppConfig } from 'src/app/app-config';
import { ThemeService } from 'src/app/theme/shared/service/theme.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';

@Component({
	selector: 'app-nav-item',
	standalone: true,
	imports: [CommonModule, SharedModule, RouterModule],
	templateUrl: './nav-item.component.html',
	styleUrl: './nav-item.component.scss'
})
export class NavItemComponent implements OnInit {
	// public props
	@Input() item!: NavigationItem;
	currentLayout!: string;

	// Constructor
	constructor(
		private location: Location,
		private themeService: ThemeService
	) {
		effect(() => {
			this.isThemeLayout(this.themeService.themeLayout());
		});
	}

	// life cycle hook
	ngOnInit() {
		this.currentLayout = DeliveryAppConfig.layout;
	}

	// private method
	private isThemeLayout(layout: string) {
		this.currentLayout = layout;
	}

	// public method
	closeOtherMenu(event: MouseEvent) {
		if (DeliveryAppConfig.layout === 'vertical') {
			const ele = event.target as HTMLElement;
			if (ele !== null && ele !== undefined) {
				const parent = ele.parentElement as HTMLElement;
				const up_parent = ((parent.parentElement as HTMLElement).parentElement as HTMLElement).parentElement as HTMLElement;
				const last_parent = (up_parent.parentElement as HTMLElement).parentElement as HTMLElement;
				if (last_parent.classList.contains('coded-submenu')) {
					up_parent.classList.remove('coded-trigger');
					up_parent.classList.remove('active');
				} else {
					const sections = document.querySelectorAll('.coded-hasmenu');
					for (let i = 0; i < sections.length; i++) {
						sections[i].classList.remove('active');
						sections[i].classList.remove('coded-trigger');
					}
				}

				if (parent.classList.contains('coded-hasmenu')) {
					parent.classList.add('coded-trigger');
					parent.classList.add('active');
				} else if (up_parent.classList.contains('coded-hasmenu')) {
					up_parent.classList.add('coded-trigger');
					up_parent.classList.add('active');
				} else if (last_parent.classList.contains('coded-hasmenu')) {
					last_parent.classList.add('coded-trigger');
					last_parent.classList.add('active');
				}
			}
		} else {
			setTimeout(() => {
				const sections = document.querySelectorAll('.coded-hasmenu');
				for (let i = 0; i < sections.length; i++) {
					sections[i].classList.remove('active');
					sections[i].classList.remove('coded-trigger');
				}

				let current_url = this.location.path();
				// eslint-disable-next-line
				// @ts-ignore
				if (this.location['_baseHref']) {
					// eslint-disable-next-line
					// @ts-ignore
					current_url = this.location['_baseHref'] + this.location.path();
				}
				const link = "a.nav-link[ href='" + current_url + "' ]";
				const ele = document.querySelector(link);
				if (ele !== null && ele !== undefined) {
					const parent = ele.parentElement;
					const up_parent = parent?.parentElement?.parentElement;
					const last_parent = up_parent?.parentElement;
					if (parent?.classList.contains('coded-hasmenu')) {
						parent.classList.add('active');
					} else if (up_parent?.classList.contains('coded-hasmenu')) {
						up_parent.classList.add('active');
					} else if (last_parent?.classList.contains('coded-hasmenu')) {
						last_parent.classList.add('active');
					}
				}
			}, 500);
		}
		if ((document.querySelector('app-navigation.coded-navbar') as HTMLDivElement).classList.contains('mob-open')) {
			(document.querySelector('app-navigation.coded-navbar') as HTMLDivElement).classList.remove('mob-open');
		}
		this.subMenuCollapse();
	}

	subMenuCollapse() {
		if ((document.querySelector('app-navigation.coded-navbar') as HTMLDivElement).classList.contains('coded-trigger')) {
			(document.querySelector('app-navigation.coded-navbar') as HTMLDivElement).classList.remove('coded-trigger');
		}
	}
}
