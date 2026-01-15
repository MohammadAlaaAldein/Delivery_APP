// Angular import
import { Component, Input, ViewEncapsulation, effect } from '@angular/core';

// project import
import { ThemeService } from '../../../service/theme.service';
import { DeliveryAppConfig } from 'src/app/app-config';

@Component({
	selector: 'app-animation-modal',
	templateUrl: './animation-modal.component.html',
	styleUrls: ['./animation-modal.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class AnimationModalComponent {
	// public props
	@Input() modalClass!: string;
	@Input() contentClass!: string;
	@Input() modalID!: string;
	@Input() backDrop = false;
	themeMode = DeliveryAppConfig.isDarkMode;

	// constructor
	constructor(private themeService: ThemeService) {
		effect(() => {
			this.isDarkTheme(this.themeService.isDarkTheme());
		});
	}

	// private method
	private isDarkTheme(isDark: boolean) {
		this.themeMode = isDark;
	}

	// public method
	close(event: string) {
		(document.querySelector('#' + event) as HTMLElement).classList.remove('md-show');
	}
}
