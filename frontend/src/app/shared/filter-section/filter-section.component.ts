import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

type FilterColumn = {
	key: string;
	title: string;
	filter_type?: string; // e.g., 'dropdown', 'checkbox'
	options?: { value: string; label: string }[]; // For dropdowns
	type?: string; // e.g., 'text', 'number', 'date'
}

@Component({
	selector: 'app-filter-section',
	standalone: true,
	imports: [CardComponent, CommonModule, TranslateModule, FormsModule],
	templateUrl: './filter-section.component.html',
	styleUrl: './filter-section.component.scss'
})
export class FilterSectionComponent {
	@Input() filterColumns: FilterColumn[] = [];
	@Input() filtersDefaultValues: Record<string, any> = {};
	@Output() searchEvent = new EventEmitter<Record<string, any>>();

	filters: Record<string, any> = {};

	ngOnInit() {
		this.filters = { ...this.filtersDefaultValues };
	}

	search(): void {
		this.searchEvent.emit(this.filters);
	}

	isFiltersFilled(): boolean {
		return Object.values(this.filters).some(value => value !== null && value !== undefined && value !== '');
	}

	resetData(): void {
		this.filters = { ...this.filtersDefaultValues };
		this.searchEvent.emit(this.filters);
	}
}
