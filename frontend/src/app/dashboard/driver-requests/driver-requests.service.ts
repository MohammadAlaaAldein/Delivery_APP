import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DriverRequest } from './driver-request.interface';

@Injectable({
    providedIn: 'root'
})
export class DriverRequestsService {

    readonly route = '/driver-requests';

    constructor(private http: HttpClient) { }

    // Admin endpoints
    list(filters?: { name?: string; id?: number; status?: string; requesting_company_id?: number }) {
        return this.http.get<{ data: DriverRequest[] }>(`${this.route}/list`, { params: filters as any });
    }

    update(id: number, data: Partial<DriverRequest>) {
        return this.http.patch<{ data: any }>(`${this.route}/${id}`, data);
    }

    approve(id: number) {
        return this.http.post<{ data: any }>(`${this.route}/${id}/approve`, {});
    }

    reject(id: number, adminNotes?: string) {
        return this.http.post<{ data: any }>(`${this.route}/${id}/reject`, { admin_notes: adminNotes });
    }

    delete(id: number) {
        return this.http.delete(`${this.route}/${id}`);
    }

    // Company endpoints
    getMyRequests() {
        return this.http.get<{ data: DriverRequest[] }>(`${this.route}/my`);
    }

    createRequest(data: Partial<DriverRequest>) {
        return this.http.post<{ data: DriverRequest }>(`${this.route}/my/add`, data);
    }

    updateMyRequest(id: number, data: Partial<DriverRequest>) {
        return this.http.patch<{ data: any }>(`${this.route}/my/${id}`, data);
    }

    deleteMyRequest(id: number) {
        return this.http.delete(`${this.route}/my/${id}`);
    }
}
