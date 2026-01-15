// Angular import
import { Component, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { Location, LocationStrategy } from '@angular/common';
import { RouterModule } from '@angular/router';

// project import
import { DeliveryAppConfig } from 'src/app/app-config';
import { ThemeService } from 'src/app/theme/shared/service/theme.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';
export type TThemeConfig = {
	layout: string; // vertical, horizontal, compact
	isCollapse_menu: boolean; // true, false
	isDarkMode: boolean; // true, false;
	sidebar_caption_hide: boolean; // true, false
	theme_color: string; // present-1, present-2, present-3, present-4, present-5, present-6, present-7
	font_family: string; // Roboto, Poppins, Inter
	isRtl_layout: boolean; // true, false
	isBox_container: boolean; // true, false
	isLanding: boolean; // true
	i18n: string; // en, fr, ro, cn
};
@Component({
	selector: 'app-configuration',
	standalone: true,
	imports: [SharedModule, RouterModule],
	templateUrl: './configuration.component.html',
	styleUrl: './configuration.component.scss',
	encapsulation: ViewEncapsulation.None
})
export class ConfigurationComponent implements OnInit {
	// public method
	styleSelectorToggle!: boolean; // open configuration menu
	DeliveryAppConfig!: DeliveryAppConfig; // theme Config
	windowWidth: number; // screen width
	layout!: string; // sidebar navigation
	themeMode!: boolean; // layoutMode type
	rtlLayout!: boolean; // rtl type
	boxContainer!: boolean; // box container flag
	setFontFamily!: string; // fontFamily
	bodyColor!: string;
	sidebar_caption_hide!: boolean; // sidebar menu caption
	resetLayoutType!: string; // default layout
	active = 1;
	savedThemeConfig: TThemeConfig = null;

	// Constructor
	constructor(
		private location: Location,
		private renderer: Renderer2,
		private locationStrategy: LocationStrategy,
		private themeService: ThemeService
	) {
		this.setThemeLayout();
		this.windowWidth = window.innerWidth;
	}

	// Life cycle events
	ngOnInit(setDefault = false) {
		const isSavedThemeSet = this.setSavedTheme();
		if (!isSavedThemeSet || setDefault) {
			this.layout = DeliveryAppConfig.layout;
			this.setMenuOrientation(this.layout);
			this.styleSelectorToggle = true;
			this.themeMode = DeliveryAppConfig.isDarkMode;
			this.setDarkLayout(this.themeMode);
			this.setFontFamily = DeliveryAppConfig.font_family;
			this.fontFamily(this.setFontFamily);
			this.bodyColor = DeliveryAppConfig.theme_color;
			this.SetBodyColor(this.bodyColor);
			this.rtlLayout = DeliveryAppConfig.isRtl_layout;
			this.setRtlLayout(this.rtlLayout);
			this.boxContainer = this.windowWidth >= 1025 ? DeliveryAppConfig.isBox_container : false;
			this.setBoxContainer(this.boxContainer);
			this.sidebar_caption_hide = DeliveryAppConfig.sidebar_caption_hide;
			this.captionShow(this.sidebar_caption_hide);
		}
	}

	private setSavedTheme(): boolean {
		const savedTheme = localStorage.getItem('themeConfig');
		if (savedTheme) {
			this.savedThemeConfig = JSON.parse(savedTheme);
			this.layout = this.savedThemeConfig.layout;
			this.setMenuOrientation(this.layout);
			this.styleSelectorToggle = true;
			this.themeMode = this.savedThemeConfig.isDarkMode;
			this.setDarkLayout(this.themeMode);
			this.setFontFamily = this.savedThemeConfig.font_family;
			this.fontFamily(this.setFontFamily);
			this.bodyColor = this.savedThemeConfig.theme_color;
			this.SetBodyColor(this.bodyColor);
			this.rtlLayout = this.savedThemeConfig.isRtl_layout;
			this.setRtlLayout(this.rtlLayout);
			this.boxContainer = this.windowWidth >= 1025 ? this.savedThemeConfig.isBox_container : false;
			this.setBoxContainer(this.boxContainer);
			this.sidebar_caption_hide = this.savedThemeConfig.sidebar_caption_hide;
			this.captionShow(this.sidebar_caption_hide);
			return true;
		}
		return false;
	}

	private saveThemeConfig() {
		const themeConfig: TThemeConfig = {
			font_family: this.setFontFamily,
			i18n: 'en',
			isBox_container: this.boxContainer,
			isCollapse_menu: true,
			isDarkMode: this.themeMode,
			isLanding: false,
			isRtl_layout: this.rtlLayout,
			layout: this.layout,
			sidebar_caption_hide: this.sidebar_caption_hide,
			theme_color: this.bodyColor
		};
		localStorage.setItem('themeConfig', JSON.stringify(themeConfig));
	}

	// public method

	// sidebar layout change
	setThemeLayout() {
		let current_url = this.location.path();
		const baseHref = this.locationStrategy.getBaseHref();
		if (baseHref) {
			current_url = baseHref + this.location.path();
		}
		switch (current_url) {
			case baseHref + '/layout/vertical':
				DeliveryAppConfig.layout = 'vertical';
				break;

			case baseHref + '/layout/compact':
				DeliveryAppConfig.layout = 'compact';
				break;

			case baseHref + '/layout/horizontal':
				DeliveryAppConfig.layout = 'horizontal';
				break;
		}
	}

	// change main layout dark and light
	setDarkLayout(isDark: boolean) {
		if (isDark) {
			this.renderer.addClass(document.body, 'delivery_app-dark');
			document.querySelector('html')?.classList.add('dark');
			this.themeMode = true;
		} else {
			this.renderer.removeClass(document.body, 'delivery_app-dark');
			document.querySelector('html')?.classList.remove('dark');
			this.SetBodyColor('preset-1');
			this.fontFamily('Roboto');
			this.themeMode = false;
		}
		this.themeService.isDarkTheme.set(this.themeMode);
		this.saveThemeConfig();
	}

	//todo check the below function.
	// default mode
	setResetLayout(layout: string) {
		if (layout === 'reset') {
			this.ngOnInit(true);
		}
	}

	// ser rtl and ltr theme mode
	setRtlLayout(layout: boolean) {
		if (layout) {
			this.renderer.addClass(document.body, 'delivery_app-rtl');
			this.renderer.removeClass(document.body, 'delivery_app-ltr');
			this.rtlLayout = true;
		} else {
			this.renderer.removeClass(document.body, 'delivery_app-rtl');
			this.renderer.addClass(document.body, 'delivery_app-ltr');
			this.rtlLayout = false;
		}
		this.themeService.isRtlTheme.set(this.rtlLayout);
		this.saveThemeConfig();
	}

	// sidebar menu caption show and hide
	captionShow(hide: boolean) {
		if (hide) {
			document.querySelector('.coded-navbar')?.classList.add('caption-hide');
			this.sidebar_caption_hide = true;
		} else {
			document.querySelector('.coded-navbar')?.classList.remove('caption-hide');
			this.sidebar_caption_hide = false;
		}
		this.saveThemeConfig();
	}

	// set box container
	setBoxContainer(boxContainer: boolean) {
		if (boxContainer) {
			document.querySelector('.coded-content')?.classList.add('container');
			this.boxContainer = true;
		} else {
			document.querySelector('.coded-content')?.classList.remove('container');
			this.boxContainer = false;
		}
		this.themeService.isBoxLayout.set(boxContainer);
		this.saveThemeConfig();
	}

	// set font family
	fontFamily(font: string) {
		this.setFontFamily = font;
		this.renderer.removeClass(document.body, 'Roboto');
		this.renderer.removeClass(document.body, 'Poppins');
		this.renderer.removeClass(document.body, 'Inter');
		this.renderer.addClass(document.body, font);
		this.saveThemeConfig();
	}

	// set theme different color
	SetBodyColor(background: string) {
		this.bodyColor = background;
		document.querySelector('body')?.part.remove('preset-1');
		document.querySelector('body')?.part.remove('preset-2');
		document.querySelector('body')?.part.remove('preset-3');
		document.querySelector('body')?.part.remove('preset-4');
		document.querySelector('body')?.part.remove('preset-5');
		document.querySelector('body')?.part.remove('preset-6');
		document.querySelector('body')?.part.remove('preset-7');
		document.querySelector('body')?.part.add(background);
		this.themeService.theme.set(background);
		this.saveThemeConfig();
	}

	setMenuOrientation(layout: string) {
		this.layout = layout;
		document.querySelector('.coded-navbar')?.classList.remove('compact');
		document.querySelector('.coded-navbar')?.classList.remove('horizontal');
		document.querySelector('.coded-navbar')?.classList.remove('vertical');
		document.querySelector('.coded-navbar')?.classList.add(layout);
		this.themeService.themeLayout.set(layout);
		this.saveThemeConfig();
	}
}
