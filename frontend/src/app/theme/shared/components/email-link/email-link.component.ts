import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-email-link',
	templateUrl: './email-link.component.html',
	styleUrl: './email-link.component.scss'
})
export class EmailLinkComponent {
	@Input('errorMsg') errorMsg;
	@Input('successMsg') successMsg;
	@Input('successMsgDesc') successMsgDesc;
}
