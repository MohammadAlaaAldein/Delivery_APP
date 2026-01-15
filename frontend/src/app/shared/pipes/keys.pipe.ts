import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ name: 'keys' })
export class KeysPipe implements PipeTransform {
	transform(value, args?: string[]): any {
		if (value === null || value === undefined) return [];
		return Object.keys(value);
	}
}
