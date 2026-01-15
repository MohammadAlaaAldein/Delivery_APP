// Angular import
import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';

//theme version
import { environment } from 'src/environments/environment';

// project import
import { getNavigationItems, NavigationItem } from '../navigation';
import { DeliveryAppConfig } from 'src/app/app-config';
import { ThemeService } from 'src/app/theme/shared/service/theme.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavCollapseComponent } from './nav-collapse/nav-collapse.component';
import { NavGroupComponent } from './nav-group/nav-group.component';
import { NavItemComponent } from './nav-item/nav-item.component';

@Component({
	selector: 'app-nav-content',
	standalone: true,
	imports: [SharedModule, CommonModule, RouterModule, NavCollapseComponent, NavGroupComponent, NavItemComponent],
	templateUrl: './nav-content.component.html',
	styleUrl: './nav-content.component.scss'
})
export class NavContentComponent implements OnInit, AfterViewInit {
	// public props
	@Output() NavCollapsedMob: EventEmitter<string> = new EventEmitter();
	@Output() SubmenuCollapse: EventEmitter<string> = new EventEmitter();

	// version
	title = 'Demo application for version numbering';
	currentApplicationVersion = environment.appVersion;

	currentLayout!: string;
	navigations: NavigationItem[];
	prevDisabled: string;
	nextDisabled: string;
	contentWidth: number;
	wrapperWidth!: number;
	scrollWidth: number;
	windowWidth: number;
	// eslint-disable-next-line
	collapseItem!: any;

	@ViewChild('navbarContent', { static: false }) navbarContent!: ElementRef;
	@ViewChild('navbarWrapper', { static: false }) navbarWrapper!: ElementRef;

	// Constructor
	constructor(
		private location: Location,
		private themeService: ThemeService
	) {
		this.prepareNavigationItems();
		this.currentLayout = DeliveryAppConfig.layout;
		this.windowWidth = window.innerWidth;
		this.prevDisabled = 'disabled';
		this.nextDisabled = '';
		this.scrollWidth = 0;
		this.contentWidth = 0;
		effect(() => {
			this.isThemeLayout(this.themeService.themeLayout());
		});
	}

	// Life cycle events
	ngOnInit() {
		if (this.windowWidth < 1025) {
			setTimeout(() => {
				(document.querySelector('.coded-navbar') as HTMLDivElement).classList.add('menupos-static');
			}, 500);
		}
	}

	// private methods
	private isThemeLayout(layout: string) {
		this.currentLayout = layout;
	}

	ngAfterViewInit() {
		if (this.currentLayout === 'horizontal') {
			this.contentWidth = this.navbarContent.nativeElement.clientWidth;
			this.wrapperWidth = this.navbarWrapper.nativeElement.clientWidth;
		}
	}

	scrollPlus() {
		this.scrollWidth = this.scrollWidth + (this.wrapperWidth - 200);
		if (this.scrollWidth > this.contentWidth - this.wrapperWidth) {
			this.scrollWidth = this.contentWidth - this.wrapperWidth + 200;
			this.nextDisabled = 'disabled';
		}
		this.prevDisabled = '';
		(document.querySelector('#side-nav-horizontal') as HTMLElement).style.marginLeft = '-' + this.scrollWidth + 'px';
	}

	scrollMinus() {
		this.scrollWidth = this.scrollWidth - this.wrapperWidth;
		if (this.scrollWidth < 0) {
			this.scrollWidth = 0;
			this.prevDisabled = 'disabled';
		}
		this.nextDisabled = '';
		(document.querySelector('#side-nav-horizontal') as HTMLElement).style.marginLeft = '-' + this.scrollWidth + 'px';
	}

	fireLeave() {
		const sections = document.querySelectorAll('.coded-hasmenu');
		for (let i = 0; i < sections.length; i++) {
			sections[i].classList.remove('active');
			sections[i].classList.remove('coded-trigger');
		}

		let current_url = this.location.path();
		//eslint-disable-next-line
		// @ts-ignore
		if (this.location['_baseHref']) {
			//eslint-disable-next-line
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
	}

	fireOutClick() {
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
				if (this.currentLayout === 'vertical') {
					parent.classList.add('coded-trigger');
				}
				parent.classList.add('active');
			} else if (up_parent?.classList.contains('coded-hasmenu')) {
				if (this.currentLayout === 'vertical') {
					up_parent.classList.add('coded-trigger');
				}
				up_parent.classList.add('active');
			} else if (last_parent?.classList.contains('coded-hasmenu')) {
				if (this.currentLayout === 'vertical') {
					last_parent.classList.add('coded-trigger');
				}
				last_parent.classList.add('active');
			}
		}
	}

	navMob() {
		if (this.windowWidth < 1025 && document.querySelector('app-navigation.coded-navbar')?.classList.contains('mob-open')) {
			this.NavCollapsedMob.emit();
		}
	}

	subMenuCollapse(item: { children: string | undefined }) {
		this.SubmenuCollapse.emit();
		this.collapseItem = item.children;
	}

	prepareNavigationItems() {
		const items = structuredClone(getNavigationItems());
	}
}
