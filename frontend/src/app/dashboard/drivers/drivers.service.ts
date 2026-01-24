import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Driver } from './driver.interface';
import { Company } from '../companies/company.interface';

export enum VehicleType {
    CAR = 'car',
    MOTORCYCLE = 'motorcycle',
    TRUCK = 'truck',
    VAN = 'van',
    BICYCLE = 'bicycle',
}

@Injectable({
    providedIn: 'root'
})
export class DriversService {

    readonly route = '/drivers';

    constructor(private http: HttpClient) { }

    addDriver(driverId: number, driver: Partial<Driver>) {
        const params = { ...driver };
        let route = `${this.route}/add`;

        if (driverId) {
            route = `${this.route}/${driverId}`;
            return this.http.patch(route, params, { observe: 'body' });
        }

        return this.http.post(route, params, { observe: 'body' });
    }

    list(filters?: { name?: string; id?: number; company_id?: number; is_active?: boolean }) {
        return this.http.get<{ data: Driver[] }>(`${this.route}/list`, { params: filters as any });
    }

    delete(driverId: number) {
        return this.http.delete(`${this.route}/${driverId}`);
    }

    toggleActive(driverId: number) {
        return this.http.patch(`${this.route}/${driverId}/toggle-active`, {});
    }

    listCompanies(filters?: { name?: string; id?: number; is_active?: boolean }) {
        return this.http.get<{ data: Company[] }>('/companies/list', { params: filters as any });
    }
}
