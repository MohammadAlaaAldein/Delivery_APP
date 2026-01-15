// Angular import
import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
	selector: '[appTodoListRemove]'
})
export class TodoListRemoveDirective {
	// Constructor
	constructor(private elements: ElementRef) {}

	// public method
	@HostListener('click', ['$event'])
	onToggle($event: { preventDefault: () => void }) {
		$event.preventDefault();
		const parent = this.elements.nativeElement.parentElement.parentElement;
		parent.remove();
	}
}
