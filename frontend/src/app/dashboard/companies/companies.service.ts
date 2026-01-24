import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Company } from './company.interface';
import { Shop } from '../shops/shop.interface';

@Injectable({
	providedIn: 'root'
})
export class CompaniesService {

	readonly route = '/companies';

	constructor(private http: HttpClient) { }

	addCompany(companyId: number, company: Company) {
		const params: Company = { ...company };
		let route = '/companies/add';

		if (companyId) {
			route = `/companies/${companyId}`;
			return this.http.patch(route, params, { observe: 'body' });
		}

		return this.http.post(route, params, { observe: 'body' });
	}

	list(filters?: { name?: string; email?: string; id?: number }) {
		return this.http.get(`${this.route}/list`, { params: filters });
	}

	delete(companyId: number) {
		return this.http.delete(`${this.route}/${companyId}`);
	}

	listShops(filters?: { name?: string; id?: number }) {
		return this.http.get<{ data: Shop[] }>('/shops/list', { params: filters });
	}

}
