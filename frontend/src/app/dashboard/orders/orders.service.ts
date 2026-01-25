import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderStatistics, OrderStatus } from './order.interface';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class OrdersService {

    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    // ==================== SHOP ENDPOINTS ====================

    createOrder(data: any): Observable<{ data: Order }> {
        return this.http.post<{ data: Order }>(`${this.baseUrl}/orders/shop/create`, data);
    }

    getShopOrders(status?: OrderStatus): Observable<{ data: Order[] }> {
        let url = `${this.baseUrl}/orders/shop/my`;
        if (status) {
            url += `?status=${status}`;
        }
        return this.http.get<{ data: Order[] }>(url);
    }

    getShopOrder(id: number): Observable<{ data: Order }> {
        return this.http.get<{ data: Order }>(`${this.baseUrl}/orders/shop/my/${id}`);
    }

    updateShopOrder(id: number, data: any): Observable<{ data: Order }> {
        return this.http.patch<{ data: Order }>(`${this.baseUrl}/orders/shop/my/${id}`, data);
    }

    cancelShopOrder(id: number, cancellation_reason: string): Observable<{ data: Order }> {
        return this.http.post<{ data: Order }>(`${this.baseUrl}/orders/shop/my/${id}/cancel`, { cancellation_reason });
    }

    getShopStatistics(): Observable<{ data: OrderStatistics }> {
        return this.http.get<{ data: OrderStatistics }>(`${this.baseUrl}/orders/shop/statistics`);
    }

    // ==================== COMPANY ENDPOINTS ====================

    getAvailableOrders(): Observable<{ data: Order[] }> {
        return this.http.get<{ data: Order[] }>(`${this.baseUrl}/orders/company/available`);
    }

    takeOrder(id: number, company_notes?: string): Observable<{ data: Order }> {
        return this.http.post<{ data: Order }>(`${this.baseUrl}/orders/company/take/${id}`, { company_notes });
    }

    getCompanyOrders(status?: OrderStatus): Observable<{ data: Order[] }> {
        let url = `${this.baseUrl}/orders/company/my`;
        if (status) {
            url += `?status=${status}`;
        }
        return this.http.get<{ data: Order[] }>(url);
    }

    getCompanyOrder(id: number): Observable<{ data: Order }> {
        return this.http.get<{ data: Order }>(`${this.baseUrl}/orders/company/my/${id}`);
    }

    assignDriver(orderId: number, driver_id: number, company_notes?: string): Observable<{ data: Order }> {
        return this.http.post<{ data: Order }>(`${this.baseUrl}/orders/company/my/${orderId}/assign-driver`, {
            driver_id,
            company_notes
        });
    }

    unassignDriver(orderId: number): Observable<{ data: Order }> {
        return this.http.post<{ data: Order }>(`${this.baseUrl}/orders/company/my/${orderId}/unassign-driver`, {});
    }

    releaseOrder(orderId: number): Observable<{ data: Order }> {
        return this.http.post<{ data: Order }>(`${this.baseUrl}/orders/company/my/${orderId}/release`, {});
    }

    getCompanyStatistics(): Observable<{ data: OrderStatistics }> {
        return this.http.get<{ data: OrderStatistics }>(`${this.baseUrl}/orders/company/statistics`);
    }

    // ==================== DRIVER ENDPOINTS ====================

    getDriverOrders(status?: OrderStatus): Observable<{ data: Order[] }> {
        let url = `${this.baseUrl}/orders/driver/my`;
        if (status) {
            url += `?status=${status}`;
        }
        return this.http.get<{ data: Order[] }>(url);
    }

    getDriverOrder(id: number): Observable<{ data: Order }> {
        return this.http.get<{ data: Order }>(`${this.baseUrl}/orders/driver/my/${id}`);
    }

    pickupOrder(id: number, notes?: string): Observable<{ data: Order }> {
        return this.http.post<{ data: Order }>(`${this.baseUrl}/orders/driver/my/${id}/pickup`, { notes });
    }

    startDelivery(id: number, notes?: string): Observable<{ data: Order }> {
        return this.http.post<{ data: Order }>(`${this.baseUrl}/orders/driver/my/${id}/start-delivery`, { notes });
    }

    deliverOrder(id: number, notes?: string): Observable<{ data: Order }> {
        return this.http.post<{ data: Order }>(`${this.baseUrl}/orders/driver/my/${id}/deliver`, { notes });
    }

    getDriverHistory(): Observable<{ data: Order[] }> {
        return this.http.get<{ data: Order[] }>(`${this.baseUrl}/orders/driver/history`);
    }

    getDriverStatistics(): Observable<{ data: OrderStatistics }> {
        return this.http.get<{ data: OrderStatistics }>(`${this.baseUrl}/orders/driver/statistics`);
    }

    // ==================== ADMIN ENDPOINTS ====================

    getAllOrders(filters?: {
        status?: OrderStatus;
        shop_id?: number;
        company_id?: number;
        driver_id?: number;
    }): Observable<{ data: Order[] }> {
        let url = `${this.baseUrl}/orders/list`;
        const params: string[] = [];

        if (filters?.status) params.push(`status=${filters.status}`);
        if (filters?.shop_id) params.push(`shop_id=${filters.shop_id}`);
        if (filters?.company_id) params.push(`company_id=${filters.company_id}`);
        if (filters?.driver_id) params.push(`driver_id=${filters.driver_id}`);

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        return this.http.get<{ data: Order[] }>(url);
    }

    getOrder(id: number): Observable<{ data: Order }> {
        return this.http.get<{ data: Order }>(`${this.baseUrl}/orders/${id}`);
    }

    adminCreateOrder(shopId: number, data: any): Observable<{ data: Order }> {
        return this.http.post<{ data: Order }>(`${this.baseUrl}/orders/create/${shopId}`, data);
    }

    adminUpdateOrder(id: number, data: any): Observable<{ data: Order }> {
        return this.http.patch<{ data: Order }>(`${this.baseUrl}/orders/${id}`, data);
    }

    adminAssignCompany(orderId: number, companyId: number): Observable<{ data: Order }> {
        return this.http.post<{ data: Order }>(`${this.baseUrl}/orders/${orderId}/assign-company/${companyId}`, {});
    }

    adminAssignDriver(orderId: number, driverId: number): Observable<{ data: Order }> {
        return this.http.post<{ data: Order }>(`${this.baseUrl}/orders/${orderId}/assign-driver/${driverId}`, {});
    }

    deleteOrder(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.baseUrl}/orders/${id}`);
    }
}
