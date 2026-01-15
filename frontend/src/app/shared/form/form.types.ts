import { VALIDATION_STRATEGIES } from './form-validation/form-validation.types';

export type TTextBoxElement = {
	id: string;
	label: string;
	validations: VALIDATION_STRATEGIES[];
	isValid: boolean;
};

export enum FORM_ELEMENT_TYPES {
	TEXT_BOX = 'text_box',
	DROPDOWN = 'dropdown'
}

export type TFormElement = {
	type: FORM_ELEMENT_TYPES;
	config: TTextBoxElement;
};

export enum RENDER_STRATEGIES {
	HALF_PAGE = 'half_page'
}

export type TForm = {
	id: string;
	label: string;
	renderStrategy: RENDER_STRATEGIES;
	elements: TFormElement[];
};
