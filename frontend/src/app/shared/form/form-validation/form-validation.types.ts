export interface IFormValidationStrategy {
	validate(): boolean;
}

export enum VALIDATION_STRATEGIES {
	IS_FILLED = 'is_filled'
}
