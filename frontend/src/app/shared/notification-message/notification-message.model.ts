export class NotificationMessage {
	message?: string = null;
	type?: 'success' | 'info' | 'warning' | 'danger' = null;
	timeout?: number = 7000;
	scrollToTop?: boolean = false;
	show?: boolean = false;
	safeType?: string = 'no';
	clearOnXTimeNavigate?: number = 2;
	numberOfNavigate?: number = 0;
	counter?: number = 0;
}