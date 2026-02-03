import { Injectable, signal } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class ThemeService {
	constructor() { }
	theme = signal<string>('');
	isDarkTheme = signal<boolean>(false);
	isRtlTheme = signal<boolean>(true);
	themeLayout = signal<string>('');
	isBoxLayout = signal<boolean>(true);
}
