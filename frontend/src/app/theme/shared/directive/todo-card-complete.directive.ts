// Angular import
import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
	selector: '[appTodoCardComplete]'
})
export class TodoCardCompleteDirective {
	// Constructor
	constructor(private elements: ElementRef) {}

	// public method
	@HostListener('click', ['$event'])
	onToggle($event: { preventDefault: () => void }) {
		$event.preventDefault();
		this.elements.nativeElement.classList.toggle('complete');
	}
}
