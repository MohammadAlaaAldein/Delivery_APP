import { Component, OnInit } from '@angular/core';
import { NotificationMessageService } from './notification-message.service';
import { NotificationMessage } from './notification-message.model';
import { CommonModule } from '@angular/common';
import { SafePipe } from '../pipes/safe.pipe';
import { AlertModule } from 'ngx-bootstrap/alert';

@Component({
	selector: 'app-notification-message',
	standalone: true,
	imports: [CommonModule, SafePipe, AlertModule],
	templateUrl: './notification-message.component.html',
	styleUrls: ['./notification-message.component.css']
})
export class NotificationMessageComponent implements OnInit {
	autoClose: boolean;
	message: NotificationMessage = new NotificationMessage();

	constructor(private notificationMessageService: NotificationMessageService) {}

	ngOnInit() {
		this.notificationMessageService.messageSubject.subscribe((message) => {
			this.message = message;

			if(message.show) {
				this.autoClose = false;
				setTimeout(() => this.autoClose = true, this.message.timeout);

				if(this.message.scrollToTop)
					window.scrollTo(0, 0);
			}
		});
	}

	close() {
		this.notificationMessageService.setMessage(null, {type: null, timeout: 700, scrollToTop: false, show: false});
	}
}
