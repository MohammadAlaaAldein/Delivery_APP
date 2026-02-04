import {
    Order,
    OrderHistory,
    CreateOrderDto,
    UpdateOrderDto,
    TakeOrderDto,
    AssignDriverDto,
    OrderStatus,
    ShopDashboardStats,
    CompanyDashboardStats,
    DriverDashboardStats,
} from '../types';
import apiService from './api.service';

class OrdersService {
    // ==================== SHOP ENDPOINTS ====================

    // Get shop dashboard stats
    async getShopDashboard(shopId: number): Promise<ShopDashboardStats> {
        return apiService.get<ShopDashboardStats>('/orders/shop/dashboard');
    }

    // Create order (for shop)
    async createOrder(orderData: CreateOrderDto): Promise<Order> {
        return apiService.post<Order>('/orders/shop', orderData);
    }

    // Get shop orders
    async getShopOrders(status?: OrderStatus): Promise<Order[]> {
        const params = status ? { status } : {};
        return apiService.get<Order[]>('/orders/shop', { params });
    }

    // Get shop order by ID
    async getShopOrder(orderId: number): Promise<Order> {
        return apiService.get<Order>(`/orders/shop/${orderId}`);
    }

    // Update shop order
    async updateShopOrder(orderId: number, orderData: UpdateOrderDto): Promise<Order> {
        return apiService.patch<Order>(`/orders/shop/${orderId}`, orderData);
    }

    // Cancel shop order
    async cancelShopOrder(orderId: number, reason?: string): Promise<Order> {
        return apiService.post<Order>(`/orders/shop/${orderId}/cancel`, { reason });
    }

    // Get shop order history
    async getShopOrderHistory(): Promise<OrderHistory[]> {
        return apiService.get<OrderHistory[]>('/orders/shop/history');
    }

    // ==================== COMPANY ENDPOINTS ====================

    // Get company dashboard stats
    async getCompanyDashboard(): Promise<CompanyDashboardStats> {
        return apiService.get<CompanyDashboardStats>('/orders/company/dashboard');
    }

    // Get available orders (for company)
    async getAvailableOrders(): Promise<Order[]> {
        return apiService.get<Order[]>('/orders/company/available');
    }

    // Take order (company claims an order)
    async takeOrder(orderId: number, data?: TakeOrderDto): Promise<Order> {
        return apiService.post<Order>(`/orders/company/${orderId}/take`, data || {});
    }

    // Get company orders
    async getCompanyOrders(status?: OrderStatus): Promise<Order[]> {
        const params = status ? { status } : {};
        return apiService.get<Order[]>('/orders/company', { params });
    }

    // Get company order by ID
    async getCompanyOrder(orderId: number): Promise<Order> {
        return apiService.get<Order>(`/orders/company/${orderId}`);
    }

    // Release order (return to available pool)
    async releaseOrder(orderId: number): Promise<Order> {
        return apiService.post<Order>(`/orders/company/${orderId}/release`);
    }

    // Assign driver to order
    async assignDriver(orderId: number, data: AssignDriverDto): Promise<Order> {
        return apiService.post<Order>(`/orders/company/${orderId}/assign-driver`, data);
    }

    // Unassign driver from order
    async unassignDriver(orderId: number): Promise<Order> {
        return apiService.post<Order>(`/orders/company/${orderId}/unassign-driver`);
    }

    // Get company order history
    async getCompanyOrderHistory(): Promise<OrderHistory[]> {
        return apiService.get<OrderHistory[]>('/orders/company/history');
    }

    // ==================== DRIVER ENDPOINTS ====================

    // Get driver dashboard stats
    async getDriverDashboard(): Promise<DriverDashboardStats> {
        return apiService.get<DriverDashboardStats>('/orders/driver/dashboard');
    }

    // Get driver orders (assigned to driver)
    async getDriverOrders(status?: OrderStatus): Promise<Order[]> {
        const params = status ? { status } : {};
        return apiService.get<Order[]>('/orders/driver', { params });
    }

    // Get driver order by ID
    async getDriverOrder(orderId: number): Promise<Order> {
        return apiService.get<Order>(`/orders/driver/${orderId}`);
    }

    // Pickup order
    async pickupOrder(orderId: number, notes?: string): Promise<Order> {
        return apiService.post<Order>(`/orders/driver/${orderId}/pickup`, { notes });
    }

    // Start delivery (mark as in transit)
    async startDelivery(orderId: number, notes?: string): Promise<Order> {
        return apiService.post<Order>(`/orders/driver/${orderId}/start-delivery`, { notes });
    }

    // Complete delivery
    async completeDelivery(orderId: number, notes?: string): Promise<OrderHistory> {
        return apiService.post<OrderHistory>(`/orders/driver/${orderId}/deliver`, { notes });
    }

    // Deliver order (alias for completeDelivery)
    async deliverOrder(orderId: number, notes?: string): Promise<OrderHistory> {
        return this.completeDelivery(orderId, notes);
    }

    // Get driver delivery history
    async getDriverHistory(): Promise<OrderHistory[]> {
        return apiService.get<OrderHistory[]>('/orders/driver/history');
    }

    // Update driver location
    async updateDriverLocation(latitude: number, longitude: number): Promise<void> {
        await apiService.post('/drivers/my/location', { latitude, longitude });
    }

    // ==================== ADMIN ENDPOINTS ====================

    // Get all orders (admin)
    async getAllOrders(filters?: {
        status?: OrderStatus;
        shop_id?: number;
        company_id?: number;
        driver_id?: number;
    }): Promise<Order[]> {
        return apiService.get<Order[]>('/orders/admin', { params: filters });
    }

    // Get order by ID (admin)
    async getOrder(orderId: number): Promise<Order> {
        return apiService.get<Order>(`/orders/admin/${orderId}`);
    }

    // Update order (admin)
    async updateOrder(orderId: number, orderData: UpdateOrderDto): Promise<Order> {
        return apiService.patch<Order>(`/orders/admin/${orderId}`, orderData);
    }

    // Delete order (admin)
    async deleteOrder(orderId: number): Promise<void> {
        await apiService.delete(`/orders/admin/${orderId}`);
    }
}

export const ordersService = new OrdersService();
export default ordersService;
