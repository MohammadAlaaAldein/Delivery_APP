// Angular import
import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
	selector: '[appProductRemove]'
})
export class ProductRemoveDirective {
	// Constructor
	constructor(private elements: ElementRef) {}

	// public method
	@HostListener('click', ['$event'])
	onToggle($event: { preventDefault: () => void }) {
		$event.preventDefault();
		const parent = this.elements.nativeElement.parentElement.parentElement.parentElement;
		parent.remove();
	}
}
