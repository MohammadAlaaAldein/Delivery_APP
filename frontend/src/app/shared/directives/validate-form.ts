import { Directive, ElementRef, Renderer2, OnInit, HostListener, EventEmitter, Input, Output, AfterViewChecked } from '@angular/core';
import { ValidationService } from '../services/validation.service';
import { NgForm } from '@angular/forms';
import { NotifierService } from 'angular-notifier';
import { TranslateService } from '@ngx-translate/core';

@Directive({
	selector: '[validate-form]',
	standalone: true
})
export class ValidateFormDirective implements OnInit, AfterViewChecked {
	@Input('validate-form') formName;
	@Input('validate-options') options;
	@Input('innerModelGroups') innerModelGroups = [];
	@Input('showAlert') showAlert = true;
	@Input('doHighlighting') doHighlighting = true;
	@Output() onSubmitError = new EventEmitter<Object>();
	submitFunction: EventEmitter<any>;
	asteriskMarkup = ` <b>*</b>`;

	constructor(
		private el: ElementRef,
		private renderer: Renderer2,
		private validationService: ValidationService,
		private notifier: NotifierService,
		private translate: TranslateService,
		private form: NgForm
	) {}

	ngOnInit() {
		this.submitFunction = this.form.ngSubmit;
		this.form.ngSubmit = new EventEmitter();
	}

	ngAfterViewChecked() {
		this.markRequiredFields();
	}

	@HostListener('submit', ['$event'])
	onSubmit(event: Event) {
		if (typeof this.options !== 'object') {
			this.options = {};
		}
		if (this.validateForm()) this.submitFunction.emit();
	}

	validateForm() {
		this.resetForm();
		let formValues = this.getFormValues();

		// console.log(formValues, this.formName); // PLEASE DON'T DELETE THIS LINE
		let invalidFields = this.validationService.validateForm(formValues, this.formName, false, this.options);
		// console.log(invalidFields); // PLEASE DON'T DELETE THIS LINE
		if (!invalidFields.length)
			return true;

		this.highlightInvalidFields(invalidFields);
		this.onSubmitError.emit(invalidFields);
		this.notifier.notify('error', this.translate.instant('g.invalid_fields'));
		return false;
	}

	getFormValues() {
		let formValues = {};
		for (let formControlName in this.form.value) {
			if (this.innerModelGroups.includes(formControlName))
				// merging parent form with inner form values
				formValues = { ...formValues, ...this.form.value[formControlName] };
			else formValues[formControlName] = this.form.value[formControlName];
		}
		return formValues;
	}

	highlightInvalidFields(invalidFields) {
		if (this.doHighlighting) {
			let form = this.el.nativeElement;
			for (let invalidField of invalidFields) {
				let ele = form.querySelectorAll('[name="' + invalidField + '"]');
				if (ele && ele[0]) this.renderer.addClass(ele[0], 'is-invalid');
			}
		}
	}

	markRequiredFields() {
		let optionalFields = [];
		if (this.options && this.options.optionalFields) optionalFields = this.options.optionalFields;
		let requiredFields = this.validationService.getFormRequiredFields(this.formName);
		let form = this.el.nativeElement;
		for (let field of requiredFields) {
			const asteriskMarkup = optionalFields.includes(field) ? '' : this.asteriskMarkup;
			let ele = form.querySelectorAll('[for="' + field + '"]');
			if (ele && ele[0]) {
				ele[0].innerHTML = `${ele[0].innerHTML.replace(this.asteriskMarkup, '')}${asteriskMarkup}`;
			}
		}
	}

	resetForm() {
		let invalidInputs = this.el.nativeElement.querySelectorAll('.is-invalid');
		invalidInputs.forEach((item) => {
			item.classList.remove('is-invalid');
		});
	}
}
