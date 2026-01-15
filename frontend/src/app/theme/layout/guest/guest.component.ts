// Angular import
import { Component, OnInit, OnDestroy } from '@angular/core';

// project import
import { DeliveryAppConfig } from 'src/app/app-config';
import { RouterModule } from '@angular/router';
import { NotificationMessageComponent } from 'src/app/shared/notification-message/notification-message.component';

@Component({
	selector: 'app-guest',
	standalone: true,
	imports: [RouterModule, NotificationMessageComponent],
	templateUrl: './guest.component.html',
	styleUrls: ['./guest.component.scss']
})
export class GuestComponent implements OnInit, OnDestroy {
	// public props
	presetColor!: string;

	// Life cycle events
	ngOnInit(): void {
		this.presetColor = DeliveryAppConfig.theme_color;
	}

	ngOnDestroy() {
		document.querySelector('body')?.classList.remove('landing-page');
	}
}
