// Angular import
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

// project import
import { NavigationItem } from '../../navigation';
import { DeliveryAppConfig } from 'src/app/app-config';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavCollapseComponent } from '../nav-collapse/nav-collapse.component';
import { NavItemComponent } from '../nav-item/nav-item.component';

@Component({
	selector: 'app-nav-group',
	standalone: true,
	imports: [CommonModule, SharedModule, NavCollapseComponent, NavItemComponent],
	templateUrl: './nav-group.component.html',
	styleUrl: './nav-group.component.scss'
})
export class NavGroupComponent implements OnInit {
	// public props
	@Input() item!: NavigationItem;
	@Output() showCollapseItem: EventEmitter<string> = new EventEmitter();

	// Constructor
	constructor(private location: Location) { }

	// Life cycle events
	ngOnInit() {
		// at reload time active and trigger link
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
			const pre_parent = up_parent?.parentElement;
			const last_parent = up_parent?.parentElement?.parentElement?.parentElement?.parentElement;
			if (parent?.classList.contains('coded-hasmenu')) {
				if (DeliveryAppConfig.layout === 'vertical') {
					parent.classList.add('coded-trigger');
				}
				parent.classList.add('active');
			} else if (up_parent?.classList.contains('coded-hasmenu')) {
				if (DeliveryAppConfig.layout === 'vertical') {
					up_parent.classList.add('coded-trigger');
				}
				up_parent.classList.add('active');
			} else if (pre_parent?.classList.contains('coded-hasmenu')) {
				if (DeliveryAppConfig.layout === 'vertical') {
					pre_parent.classList.add('coded-trigger');
				}
				pre_parent.classList.add('active');
			}

			if (last_parent?.classList.contains('coded-hasmenu')) {
				if (DeliveryAppConfig.layout === 'vertical') {
					last_parent.classList.add('coded-trigger');

					if (pre_parent?.classList.contains('coded-hasmenu')) {
						pre_parent.classList.add('coded-trigger');
					}
				}
				last_parent.classList.add('active');
			}
		}
	}

	// public method
	subMenuCollapse(item: string) {
		this.showCollapseItem.emit(item);
	}
}
