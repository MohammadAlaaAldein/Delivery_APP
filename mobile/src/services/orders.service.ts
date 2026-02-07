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
        const res = await apiService.get<{ data: ShopDashboardStats }>('/orders/shop/statistics');
        return res.data;
    }

    // Create order (for shop)
    async createOrder(orderData: CreateOrderDto): Promise<Order> {
        const res = await apiService.post<{ data: Order }>('/orders/shop/create', orderData);
        return res.data;
    }

    // Get shop orders
    async getShopOrders(status?: OrderStatus): Promise<Order[]> {
        const params = status ? { status } : {};
        const res = await apiService.get<{ data: Order[] }>('/orders/shop/my', { params });
        return res.data;
    }

    // Get shop order by ID
    async getShopOrder(orderId: number): Promise<Order> {
        const res = await apiService.get<{ data: Order }>(`/orders/shop/my/${orderId}`);
        return res.data;
    }

    // Update shop order
    async updateShopOrder(orderId: number, orderData: UpdateOrderDto): Promise<Order> {
        const res = await apiService.patch<{ data: Order }>(`/orders/shop/my/${orderId}`, orderData);
        return res.data;
    }

    // Cancel shop order
    async cancelShopOrder(orderId: number, reason?: string): Promise<Order> {
        const res = await apiService.post<{ data: Order }>(`/orders/shop/my/${orderId}/cancel`, { cancellation_reason: reason });
        return res.data;
    }

    // Get shop order history
    async getShopOrderHistory(): Promise<OrderHistory[]> {
        const res = await apiService.get<{ data: OrderHistory[] }>('/orders/shop/history');
        return res.data;
    }

    // ==================== COMPANY ENDPOINTS ====================

    // Get company dashboard stats
    async getCompanyDashboard(): Promise<CompanyDashboardStats> {
        const res = await apiService.get<{ data: CompanyDashboardStats }>('/orders/company/statistics');
        return res.data;
    }

    // Get available orders (for company)
    async getAvailableOrders(): Promise<Order[]> {
        const res = await apiService.get<{ data: Order[] }>('/orders/company/available');
        return res.data;
    }

    // Take order (company claims an order)
    async takeOrder(orderId: number, data?: TakeOrderDto): Promise<Order> {
        const res = await apiService.post<{ data: Order }>(`/orders/company/take/${orderId}`, data || {});
        return res.data;
    }

    // Get company orders
    async getCompanyOrders(status?: OrderStatus): Promise<Order[]> {
        const params = status ? { status } : {};
        const res = await apiService.get<{ data: Order[] }>('/orders/company/my', { params });
        return res.data;
    }

    // Get company order by ID
    async getCompanyOrder(orderId: number): Promise<Order> {
        const res = await apiService.get<{ data: Order }>(`/orders/company/my/${orderId}`);
        return res.data;
    }

    // Release order (return to available pool)
    async releaseOrder(orderId: number): Promise<Order> {
        const res = await apiService.post<{ data: Order }>(`/orders/company/my/${orderId}/release`);
        return res.data;
    }

    // Assign driver to order
    async assignDriver(orderId: number, data: AssignDriverDto): Promise<Order> {
        const res = await apiService.post<{ data: Order }>(`/orders/company/my/${orderId}/assign-driver`, data);
        return res.data;
    }

    // Unassign driver from order
    async unassignDriver(orderId: number): Promise<Order> {
        const res = await apiService.post<{ data: Order }>(`/orders/company/my/${orderId}/unassign-driver`);
        return res.data;
    }

    // Get company order history
    async getCompanyOrderHistory(): Promise<OrderHistory[]> {
        const res = await apiService.get<{ data: OrderHistory[] }>('/orders/company/history');
        return res.data;
    }

    // ==================== DRIVER ENDPOINTS ====================

    // Get driver dashboard stats
    async getDriverDashboard(): Promise<DriverDashboardStats> {
        const res = await apiService.get<{ data: DriverDashboardStats }>('/orders/driver/statistics');
        return res.data;
    }

    // Get driver orders (assigned to driver)
    async getDriverOrders(status?: OrderStatus): Promise<Order[]> {
        const params = status ? { status } : {};
        const res = await apiService.get<{ data: Order[] }>('/orders/driver/my', { params });
        return res.data;
    }

    // Get driver order by ID
    async getDriverOrder(orderId: number): Promise<Order> {
        const res = await apiService.get<{ data: Order }>(`/orders/driver/my/${orderId}`);
        return res.data;
    }

    // Pickup order
    async pickupOrder(orderId: number, notes?: string): Promise<Order> {
        const res = await apiService.post<{ data: Order }>(`/orders/driver/my/${orderId}/pickup`, { notes });
        return res.data;
    }

    // Start delivery (mark as in transit)
    async startDelivery(orderId: number, notes?: string): Promise<Order> {
        const res = await apiService.post<{ data: Order }>(`/orders/driver/my/${orderId}/start-delivery`, { notes });
        return res.data;
    }

    // Complete delivery
    async completeDelivery(orderId: number, notes?: string): Promise<OrderHistory> {
        const res = await apiService.post<{ data: OrderHistory }>(`/orders/driver/my/${orderId}/deliver`, { notes });
        return res.data;
    }

    // Deliver order (alias for completeDelivery)
    async deliverOrder(orderId: number, notes?: string): Promise<OrderHistory> {
        return this.completeDelivery(orderId, notes);
    }

    // Get driver delivery history
    async getDriverHistory(): Promise<OrderHistory[]> {
        const res = await apiService.get<{ data: OrderHistory[] }>('/orders/driver/history');
        return res.data;
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
        const res = await apiService.get<{ data: Order[] }>('/orders/admin', { params: filters });
        return res.data;
    }

    // Get order by ID (admin)
    async getOrder(orderId: number): Promise<Order> {
        const res = await apiService.get<{ data: Order }>(`/orders/admin/${orderId}`);
        return res.data;
    }

    // Update order (admin)
    async updateOrder(orderId: number, orderData: UpdateOrderDto): Promise<Order> {
        const res = await apiService.patch<{ data: Order }>(`/orders/admin/${orderId}`, orderData);
        return res.data;
    }

    // Delete order (admin)
    async deleteOrder(orderId: number): Promise<void> {
        await apiService.delete(`/orders/admin/${orderId}`);
    }
}

export const ordersService = new OrdersService();
export default ordersService;
