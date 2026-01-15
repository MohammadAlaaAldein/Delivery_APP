import { HttpParams } from '@angular/common/http';

export class CustomHttpParams extends HttpParams {
	constructor(public object: any) {
		super();
	}
}
