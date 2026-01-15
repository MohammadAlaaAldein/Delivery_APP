import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
	providedIn: 'root'
})
export class LogsService {
	private readonly ROUTE = 'api-logs';

	constructor(private http: HttpClient) {}

	listAPILogs(criteria: {end_point?: string, user_id?: number}) {
		return this.http.get(`/${this.ROUTE}/list`, {
			params: criteria
		});
	}

	listRejectedConnections() {
		return this.http.get(`/${this.ROUTE}/listRejectedConnections`);
	}
}
