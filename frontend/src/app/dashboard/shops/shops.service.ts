import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Shop } from './shop.interface';
import { Company } from '../companies/company.interface';

@Injectable({
	providedIn: 'root'
})
export class ShopsService {

	readonly route = '/shops';

	constructor(private http: HttpClient) { }

	addShop(shopId: number, shop: Shop) {
		const params: Shop = { ...shop };
		let route = '/shops/add';

		if (shopId) {
			route = `/shops/${shopId}`;
			return this.http.patch(route, params, { observe: 'body' });
		}

		return this.http.post(route, params, { observe: 'body' });
	}

	list(filters?: { name?: string; email?: string; id?: number; is_active?: boolean }) {
		return this.http.get(`${this.route}/list`, { params: filters as any });
	}

	delete(shopId: number) {
		return this.http.delete(`${this.route}/${shopId}`);
	}

	toggleActive(shopId: number) {
		return this.http.patch(`${this.route}/${shopId}/toggle-active`, {});
	}

	listCompanies(filters?: { name?: string; id?: number; is_active?: boolean }) {
		return this.http.get<{ data: Company[] }>('/companies/list', { params: filters as any });
	}

}
