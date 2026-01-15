import { Injectable, signal } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class ThemeService {
	theme = signal<string>('');
	isDarkTheme = signal<boolean>(false);
	isRtlTheme = signal<boolean>(false);
	themeLayout = signal<string>('');
	isBoxLayout = signal<boolean>(true);
}
