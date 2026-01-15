import { IFormValidationStrategy } from '../form-validation.types';

export class IsFilledStrategy implements IFormValidationStrategy {
	data: any = {};
	itemId: string;

	validate(): boolean {
		return this.data[this.itemId] !== undefined;
	}

	setData(data: any) {
		this.data = data;
	}

	setItemId(itemId: string) {
		this.itemId = itemId;
	}
}
