import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'app-form-builder',
	standalone: true,
	imports: [ReactiveFormsModule, TranslateModule, CommonModule, RouterModule, NgSelectModule, NgbTooltipModule, FontAwesomeModule],
	templateUrl: './form-builder.component.html',
	styleUrl: './form-builder.component.scss'
})
export class FormBuilderComponent {
	@Input() formGroup!: FormGroup;
	@Input() formFieldsList: any[] = [];
	@Input() fields: any = {};
	@Input() hasButtons = true;
	@Input() isReadonly = false;
	@Input() translationKey = 'devices';

	@Output() submit = new EventEmitter<void>();
	@Output() backClicked = new EventEmitter<void>();
	passwordVisible = {};
	hoveredField: string | null = null;

	ngOnInit() {
		for (const item in this.fields) {
			if (this.fields[item].type == 'password')
				this.passwordVisible[item] = false
		}
	}

	onSubmit(): void {
		// Trim all string values first
		Object.keys(this.formGroup.controls).forEach(key => {
			const control = this.formGroup.get(key);
			if (control && typeof control.value === 'string')
				control.setValue(control.value.trim(), { emitEvent: false });
		});

		if (this.formGroup.valid) {
			this.submit.emit();
		} else {
			this.formFieldsList.forEach(field => {
				const control = this.formGroup.get(field);
				if (control) {
					control.markAsTouched();
				}
			});
		}
	}

	togglePasswordVisibility(field) {
		this.passwordVisible[field] = !this.passwordVisible[field];
	}

	back(): void {
		this.backClicked.emit();
	}

	showFieldTooltip(field: string) {
		this.hoveredField = field;
	}

	hideFieldTooltip() {
		this.hoveredField = null;
	}

	isTooltipVisible(field: string): boolean {
		return this.hoveredField === field;
	}
}
