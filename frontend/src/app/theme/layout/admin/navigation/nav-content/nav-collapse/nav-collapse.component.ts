// Angular import
import { Component, EventEmitter, Input, OnInit, Output, effect } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// project import
import { NavigationItem } from '../../navigation';
import { DeliveryAppConfig } from 'src/app/app-config';
import { ThemeService } from 'src/app/theme/shared/service/theme.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavItemComponent } from '../nav-item/nav-item.component';

@Component({
	selector: 'app-nav-collapse',
	standalone: true,
	imports: [CommonModule, SharedModule, RouterModule, NavItemComponent],
	templateUrl: './nav-collapse.component.html',
	styleUrl: './nav-collapse.component.scss',
	animations: [
		trigger('slideInOut', [
			transition(':enter', [
				style({ transform: 'translateY(-100%)', display: 'block' }),
				animate('250ms ease-in', style({ transform: 'translateY(0%)' }))
			]),
			transition(':leave', [animate('250ms ease-in', style({ transform: 'translateY(-100%)' }))])
		])
	]
})
export class NavCollapseComponent implements OnInit {
	// public props
	@Output() showCollapseItem: EventEmitter<object> = new EventEmitter();
	@Input() item!: NavigationItem;
	currentLayout!: string;
	windowWidth = window.innerWidth;

	// construction
	constructor(private themeService: ThemeService) {
		effect(() => {
			this.isThemeLayout(this.themeService.themeLayout());
		});
	}

	// life cycle hook
	ngOnInit() {
		this.currentLayout = DeliveryAppConfig.layout;
	}

	// private methods
	private isThemeLayout(layout: string) {
		this.currentLayout = layout;
	}

	// public method
	navCollapse(e: MouseEvent) {
		let parent = e.target as HTMLElement;

		if (parent?.tagName === 'SPAN') {
			parent = parent.parentElement!;
		}

		if (this.currentLayout === 'vertical') {
			parent = (parent as HTMLElement).parentElement!;
		}

		const sections = document.querySelectorAll('.coded-hasmenu');
		for (let i = 0; i < sections.length; i++) {
			if (sections[i] !== parent) {
				sections[i].classList.remove('coded-trigger');
			}
		}

		let first_parent = parent.parentElement!;
		let pre_parent = ((parent as HTMLElement).parentElement as HTMLElement).parentElement!;
		if (first_parent.classList.contains('coded-hasmenu')) {
			do {
				first_parent.classList.add('coded-trigger');
				first_parent = (first_parent.parentElement as HTMLElement).parentElement!;
			} while (first_parent.classList.contains('coded-hasmenu'));
		} else if (pre_parent.classList.contains('coded-submenu')) {
			do {
				pre_parent.parentElement?.classList.add('coded-trigger');
				pre_parent = (((pre_parent as HTMLElement).parentElement as HTMLElement).parentElement as HTMLElement).parentElement!;
			} while (pre_parent.classList.contains('coded-submenu'));
		}
		parent.classList.toggle('coded-trigger');
	}

	subMenuCollapse(item: object) {
		this.showCollapseItem.emit(item);
	}
}
