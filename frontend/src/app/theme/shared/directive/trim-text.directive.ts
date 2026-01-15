import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
	selector: '[trim-text]'
})
export class TrimTextDirective {
	constructor(private el: ElementRef) {}

	@HostListener('blur')
	@HostListener('change')
	applyTrim() {
		let ele = this.el.nativeElement as HTMLInputElement;
		if (typeof ele.value === 'string') {
			ele.value = ele.value.trim();
		}
	}
}
