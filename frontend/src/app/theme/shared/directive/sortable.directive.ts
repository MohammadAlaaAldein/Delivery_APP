// angular import
import { Directive, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';

export type SortDirection = 'asc' | 'desc' | '';
const rotate: { [key: string]: SortDirection } = { asc: 'desc', desc: '', '': 'asc' };

export interface SortEvent {
	column: string;
	direction: SortDirection;
}

@Directive({
	selector: 'th[appSortable]',
	standalone: true
})
export class NgbdSortableHeaderDirective {
	@HostBinding('class.asc') get isAscending() {
		return this.direction === 'asc';
	}
	@HostBinding('class.desc') get isDescending() {
		return this.direction === 'desc';
	}

	@Input() sortable: string = '';
	@Input() direction: SortDirection = '';
	@Output() sort = new EventEmitter<SortEvent>();

	@HostListener('click') rotate() {
		this.direction = rotate[this.direction];
		this.sort.emit({ column: this.sortable, direction: this.direction });
	}
}
