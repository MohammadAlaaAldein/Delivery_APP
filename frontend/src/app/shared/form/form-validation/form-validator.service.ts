import { Injectable } from '@angular/core';
import { TForm, TFormElement } from '../form.types';

type TValidationResponse = {
	elements: { [eleId: string]: { element: TFormElement } };
};

@Injectable({
	providedIn: 'root'
})
export class FormValidatorService {
	private form: TForm;
	private data: any = {};

	constructor() {}

	setForm(form: TForm) {
		this.form = form;
	}

	setData(data: any) {
		this.data = data;
	}

	validateForm(): TValidationResponse {
		console.log('validate data : ', this.data);
		//todo validate data and form;
		const notValidElementsMapper: { [eleId: string]: { element: TFormElement } } = {}; //todo change the type
		for (const element of this.form.elements) {
		}
		return {
			elements: {}
		};
	}
}
