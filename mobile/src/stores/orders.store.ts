import { create } from 'zustand';
import {
    Order,
    OrderHistory,
    OrderStatus,
    CreateOrderDto,
    UpdateOrderDto,
    TakeOrderDto,
    AssignDriverDto,
    ShopDashboardStats,
    CompanyDashboardStats,
    DriverDashboardStats,
} from '../types';
import { ordersService, socketService, SOCKET_EVENTS } from '../services';

interface OrdersState {
    // State
    orders: Order[];
    availableOrders: Order[];
    activeOrders: Order[];
    orderHistory: OrderHistory[];
    currentOrder: Order | null;
    shopStats: ShopDashboardStats | null;
    companyStats: CompanyDashboardStats | null;
    driverStats: DriverDashboardStats | null;
    stats: ShopDashboardStats | CompanyDashboardStats | DriverDashboardStats | null; // Generic stats alias
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;

    // Shop Actions
    fetchShopOrders: (status?: OrderStatus) => Promise<void>;
    createOrder: (orderData: CreateOrderDto) => Promise<Order>;
    updateShopOrder: (orderId: number, orderData: UpdateOrderDto) => Promise<void>;
    cancelShopOrder: (orderId: number, reason?: string) => Promise<void>;
    fetchShopStats: () => Promise<void>;
    fetchShopHistory: () => Promise<void>;

    // Company Actions
    fetchAvailableOrders: () => Promise<void>;
    fetchCompanyOrders: (status?: OrderStatus) => Promise<void>;
    takeOrder: (orderId: number, data?: TakeOrderDto) => Promise<void>;
    releaseOrder: (orderId: number) => Promise<void>;
    assignDriver: (orderId: number, data: AssignDriverDto) => Promise<void>;
    unassignDriver: (orderId: number) => Promise<void>;
    fetchCompanyStats: () => Promise<void>;
    fetchCompanyHistory: () => Promise<void>;

    // Driver Actions
    fetchDriverOrders: (status?: OrderStatus) => Promise<void>;
    pickupOrder: (orderId: number, notes?: string) => Promise<void>;
    startDelivery: (orderId: number, notes?: string) => Promise<void>;
    completeDelivery: (orderId: number, notes?: string) => Promise<void>;
    fetchDriverStats: () => Promise<void>;
    fetchDriverHistory: () => Promise<void>;

    // Common Actions
    setCurrentOrder: (order: Order | null) => void;
    setLoading: (loading: boolean) => void;
    setRefreshing: (refreshing: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    clearOrders: () => void;

    // Generic Actions (aliases for role-specific methods)
    fetchOrders: (status?: OrderStatus) => Promise<void>;
    fetchStats: () => Promise<void>;
    cancelOrder: (orderId: number, reason?: string) => Promise<void>;
    deliverOrder: (orderId: number, notes?: string) => Promise<void>;

    // Socket handlers
    setupSocketListeners: () => () => void;
    handleOrderUpdate: (order: Order) => void;
    handleOrderRemove: (orderId: number | string) => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
    // Initial state
    orders: [],
    availableOrders: [],
    activeOrders: [],
    orderHistory: [],
    currentOrder: null,
    shopStats: null,
    companyStats: null,
    driverStats: null,
    stats: null, // Generic stats alias
    isLoading: false,
    isRefreshing: false,
    error: null,

    // ==================== SHOP ACTIONS ====================

    fetchShopOrders: async (status?: OrderStatus) => {
        set({ isLoading: true, error: null });
        try {
            const orders = await ordersService.getShopOrders(status);
            set({ orders: Array.isArray(orders) ? orders : [], isLoading: false });
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to fetch orders',
            });
        }
    },

    createOrder: async (orderData: CreateOrderDto) => {
        set({ isLoading: true, error: null });
        try {
            const order = await ordersService.createOrder(orderData);
            set((state) => ({
                orders: [order, ...state.orders],
                isLoading: false,
            }));
            return order;
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to create order',
            });
            throw error;
        }
    },

    updateShopOrder: async (orderId: number, orderData: UpdateOrderDto) => {
        set({ isLoading: true, error: null });
        try {
            const updatedOrder = await ordersService.updateShopOrder(orderId, orderData);
            set((state) => ({
                orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
                currentOrder: state.currentOrder?.id === orderId ? updatedOrder : state.currentOrder,
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to update order',
            });
            throw error;
        }
    },

    cancelShopOrder: async (orderId: number, reason?: string) => {
        set({ isLoading: true, error: null });
        try {
            const cancelledOrder = await ordersService.cancelShopOrder(orderId, reason);
            set((state) => ({
                orders: state.orders.map((o) => (o.id === orderId ? cancelledOrder : o)),
                currentOrder: state.currentOrder?.id === orderId ? cancelledOrder : state.currentOrder,
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to cancel order',
            });
            throw error;
        }
    },

    fetchShopStats: async () => {
        try {
            const raw: any = await ordersService.getShopDashboard(0);
            // Map backend field names to frontend expected names
            const stats = {
                totalOrders: raw?.total ?? raw?.totalOrders ?? 0,
                pendingOrders: raw?.pending ?? raw?.pendingOrders ?? 0,
                inProgressOrders: raw?.inProgress ?? raw?.inProgressOrders ?? 0,
                deliveredOrders: raw?.delivered ?? raw?.deliveredOrders ?? 0,
                cancelledOrders: raw?.cancelled ?? raw?.cancelledOrders ?? 0,
                todayOrders: raw?.total ?? raw?.todayOrders ?? 0,
                recentOrders: raw?.recentOrders || [],
            };
            set({ shopStats: stats });
        } catch (error: any) {
            console.error('Failed to fetch shop stats:', error);
        }
    },

    fetchShopHistory: async () => {
        set({ isLoading: true, error: null });
        try {
            const history = await ordersService.getShopOrderHistory();
            set({ orderHistory: history, isLoading: false });
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to fetch order history',
            });
        }
    },

    // ==================== COMPANY ACTIONS ====================

    fetchAvailableOrders: async () => {
        set({ isLoading: true, error: null });
        try {
            const orders = await ordersService.getAvailableOrders();
            set({ availableOrders: Array.isArray(orders) ? orders : [], isLoading: false });
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to fetch available orders',
            });
        }
    },

    fetchCompanyOrders: async (status?: OrderStatus) => {
        set({ isLoading: true, error: null });
        try {
            const orders = await ordersService.getCompanyOrders(status);
            set({ orders: Array.isArray(orders) ? orders : [], isLoading: false });
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to fetch company orders',
            });
        }
    },

    takeOrder: async (orderId: number, data?: TakeOrderDto) => {
        set({ isLoading: true, error: null });
        try {
            const order = await ordersService.takeOrder(orderId, data);
            set((state) => ({
                availableOrders: state.availableOrders.filter((o) => o.id !== orderId),
                orders: [order, ...state.orders],
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to take order',
            });
            throw error;
        }
    },

    releaseOrder: async (orderId: number) => {
        set({ isLoading: true, error: null });
        try {
            const order = await ordersService.releaseOrder(orderId);
            set((state) => ({
                orders: state.orders.filter((o) => o.id !== orderId),
                availableOrders: [order, ...state.availableOrders],
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to release order',
            });
            throw error;
        }
    },

    assignDriver: async (orderId: number, data: AssignDriverDto) => {
        set({ isLoading: true, error: null });
        try {
            const order = await ordersService.assignDriver(orderId, data);
            set((state) => ({
                orders: state.orders.map((o) => (o.id === orderId ? order : o)),
                currentOrder: state.currentOrder?.id === orderId ? order : state.currentOrder,
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to assign driver',
            });
            throw error;
        }
    },

    unassignDriver: async (orderId: number) => {
        set({ isLoading: true, error: null });
        try {
            const order = await ordersService.unassignDriver(orderId);
            set((state) => ({
                orders: state.orders.map((o) => (o.id === orderId ? order : o)),
                currentOrder: state.currentOrder?.id === orderId ? order : state.currentOrder,
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to unassign driver',
            });
            throw error;
        }
    },

    fetchCompanyStats: async () => {
        try {
            const raw: any = await ordersService.getCompanyDashboard();
            // Map backend field names to frontend expected names
            const stats = {
                totalOrders: raw?.total ?? raw?.totalOrders ?? 0,
                availableOrders: raw?.pending ?? raw?.availableOrders ?? 0,
                activeDeliveries: raw?.inProgress ?? raw?.activeDeliveries ?? 0,
                deliveredToday: raw?.delivered ?? raw?.deliveredToday ?? 0,
                totalDrivers: raw?.totalDrivers ?? 0,
                activeDrivers: raw?.activeDrivers ?? 0,
                assignedOrders: raw?.assignedOrders ?? 0,
                recentOrders: raw?.recentOrders || [],
            };
            set({ companyStats: stats });
        } catch (error: any) {
            console.error('Failed to fetch company stats:', error);
        }
    },

    fetchCompanyHistory: async () => {
        set({ isLoading: true, error: null });
        try {
            const history = await ordersService.getCompanyOrderHistory();
            set({ orderHistory: history, isLoading: false });
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to fetch order history',
            });
        }
    },

    // ==================== DRIVER ACTIONS ====================

    fetchDriverOrders: async (status?: OrderStatus) => {
        set({ isLoading: true, error: null });
        try {
            const orders = await ordersService.getDriverOrders(status);
            const orderList = Array.isArray(orders) ? orders : [];
            set({ activeOrders: orderList, orders: orderList, isLoading: false });
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to fetch driver orders',
            });
        }
    },

    pickupOrder: async (orderId: number, notes?: string) => {
        set({ isLoading: true, error: null });
        try {
            const order = await ordersService.pickupOrder(orderId, notes);
            set((state) => ({
                activeOrders: state.activeOrders.map((o) => (o.id === orderId ? order : o)),
                currentOrder: state.currentOrder?.id === orderId ? order : state.currentOrder,
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to pickup order',
            });
            throw error;
        }
    },

    startDelivery: async (orderId: number, notes?: string) => {
        set({ isLoading: true, error: null });
        try {
            const order = await ordersService.startDelivery(orderId, notes);
            set((state) => ({
                activeOrders: state.activeOrders.map((o) => (o.id === orderId ? order : o)),
                currentOrder: state.currentOrder?.id === orderId ? order : state.currentOrder,
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to start delivery',
            });
            throw error;
        }
    },

    completeDelivery: async (orderId: number, notes?: string) => {
        set({ isLoading: true, error: null });
        try {
            const historyRecord = await ordersService.completeDelivery(orderId, notes);
            set((state) => ({
                activeOrders: state.activeOrders.filter((o) => o.id !== orderId),
                orderHistory: [historyRecord, ...state.orderHistory],
                currentOrder: state.currentOrder?.id === orderId ? null : state.currentOrder,
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to complete delivery',
            });
            throw error;
        }
    },

    fetchDriverStats: async () => {
        try {
            const raw: any = await ordersService.getDriverDashboard();
            // Map backend field names to frontend expected names
            const stats = {
                totalDeliveries: raw?.total ?? raw?.totalDeliveries ?? 0,
                activeOrders: raw?.inProgress ?? raw?.activeOrders ?? 0,
                todayDeliveries: raw?.delivered ?? raw?.todayDeliveries ?? 0,
                todayEarnings: raw?.totalRevenue ?? raw?.todayEarnings ?? 0,
                todayDistance: raw?.todayDistance ?? 0,
                rating: raw?.rating ?? raw?.deliveryRate ?? 0,
                weeklyDeliveries: raw?.weeklyDeliveries ?? raw?.delivered ?? 0,
                weekEarnings: raw?.weekEarnings ?? raw?.totalRevenue ?? 0,
                pendingPickups: raw?.pending ?? raw?.pendingPickups ?? 0,
                inTransitOrders: raw?.inTransitOrders ?? 0,
                currentOrder: raw?.currentOrder || undefined,
                upcomingOrders: raw?.upcomingOrders || [],
            };
            set({ driverStats: stats });
        } catch (error: any) {
            console.error('Failed to fetch driver stats:', error);
        }
    },

    fetchDriverHistory: async () => {
        set({ isLoading: true, error: null });
        try {
            const history = await ordersService.getDriverHistory();
            set({ orderHistory: history, isLoading: false });
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to fetch delivery history',
            });
        }
    },

    // ==================== COMMON ACTIONS ====================

    setCurrentOrder: (order: Order | null) => {
        set({ currentOrder: order });
    },

    setLoading: (loading: boolean) => {
        set({ isLoading: loading });
    },

    setRefreshing: (refreshing: boolean) => {
        set({ isRefreshing: refreshing });
    },

    setError: (error: string | null) => {
        set({ error });
    },

    clearError: () => {
        set({ error: null });
    },

    clearOrders: () => {
        set({
            orders: [],
            availableOrders: [],
            activeOrders: [],
            orderHistory: [],
            currentOrder: null,
            shopStats: null,
            companyStats: null,
            driverStats: null,
        });
    },

    // ==================== GENERIC ACTIONS (ALIASES) ====================

    fetchOrders: async (status?: OrderStatus) => {
        // Generic fetch orders - delegates to the appropriate role-specific method
        // This is a convenience method that can be overridden based on context
        set({ isLoading: true, error: null });
        try {
            const orders = await ordersService.getShopOrders(status);
            set({ orders, isLoading: false });
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to fetch orders',
            });
        }
    },

    fetchStats: async () => {
        // Generic fetch stats - fetches all available stats
        try {
            const [shopStats, companyStats, driverStats] = await Promise.allSettled([
                ordersService.getShopDashboard(0),
                ordersService.getCompanyDashboard(),
                ordersService.getDriverDashboard(),
            ]);
            set({
                shopStats: shopStats.status === 'fulfilled' ? shopStats.value : null,
                companyStats: companyStats.status === 'fulfilled' ? companyStats.value : null,
                driverStats: driverStats.status === 'fulfilled' ? driverStats.value : null,
            });
        } catch (error: any) {
            console.error('Failed to fetch stats:', error);
        }
    },

    cancelOrder: async (orderId: number, reason?: string) => {
        // Alias for cancelShopOrder
        set({ isLoading: true, error: null });
        try {
            const cancelledOrder = await ordersService.cancelShopOrder(orderId, reason);
            set((state) => ({
                orders: state.orders.map((o) => (o.id === orderId ? cancelledOrder : o)),
                currentOrder: state.currentOrder?.id === orderId ? cancelledOrder : state.currentOrder,
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to cancel order',
            });
            throw error;
        }
    },

    deliverOrder: async (orderId: number, notes?: string) => {
        // Alias for completeDelivery
        set({ isLoading: true, error: null });
        try {
            const historyRecord = await ordersService.completeDelivery(orderId, notes);
            set((state) => ({
                activeOrders: state.activeOrders.filter((o) => o.id !== orderId),
                orders: state.orders.filter((o) => o.id !== orderId),
                orderHistory: [historyRecord, ...state.orderHistory],
                currentOrder: state.currentOrder?.id === orderId ? null : state.currentOrder,
                isLoading: false,
            }));
        } catch (error: any) {
            set({
                isLoading: false,
                error: error.message || 'Failed to deliver order',
            });
            throw error;
        }
    },

    // ==================== SOCKET HANDLERS ====================

    setupSocketListeners: () => {
        const unsubscribers: (() => void)[] = [];

        // Order created
        unsubscribers.push(
            socketService.on(SOCKET_EVENTS.ORDER_CREATED, (order: Order) => {
                get().handleOrderUpdate(order);
            })
        );

        // Order updated
        unsubscribers.push(
            socketService.on(SOCKET_EVENTS.ORDER_UPDATED, (order: Order) => {
                get().handleOrderUpdate(order);
            })
        );

        // Order assigned to company
        unsubscribers.push(
            socketService.on(SOCKET_EVENTS.ORDER_ASSIGNED_TO_COMPANY, (order: Order) => {
                set((state) => ({
                    availableOrders: state.availableOrders.filter((o) => o.id !== order.id),
                }));
                get().handleOrderUpdate(order);
            })
        );

        // Order assigned to driver
        unsubscribers.push(
            socketService.on(SOCKET_EVENTS.ORDER_ASSIGNED_TO_DRIVER, (order: Order) => {
                get().handleOrderUpdate(order);
            })
        );

        // Order released
        unsubscribers.push(
            socketService.on(SOCKET_EVENTS.ORDER_RELEASED, (order: Order) => {
                set((state) => ({
                    availableOrders: [order, ...state.availableOrders],
                    orders: state.orders.filter((o) => o.id !== order.id),
                }));
            })
        );

        // Order picked up
        unsubscribers.push(
            socketService.on(SOCKET_EVENTS.ORDER_PICKED_UP, (order: Order) => {
                get().handleOrderUpdate(order);
            })
        );

        // Order in transit
        unsubscribers.push(
            socketService.on(SOCKET_EVENTS.ORDER_IN_TRANSIT, (order: Order) => {
                get().handleOrderUpdate(order);
            })
        );

        // Order delivered
        unsubscribers.push(
            socketService.on(SOCKET_EVENTS.ORDER_DELIVERED, (order: Order) => {
                get().handleOrderRemove(order.id);
            })
        );

        // Order cancelled
        unsubscribers.push(
            socketService.on(SOCKET_EVENTS.ORDER_CANCELLED, (order: Order) => {
                get().handleOrderUpdate(order);
            })
        );

        // Return cleanup function
        return () => {
            unsubscribers.forEach((unsub) => unsub());
        };
    },

    handleOrderUpdate: (order: Order) => {
        set((state) => ({
            orders: state.orders.some((o) => o.id === order.id)
                ? state.orders.map((o) => (o.id === order.id ? order : o))
                : state.orders,
            activeOrders: state.activeOrders.some((o) => o.id === order.id)
                ? state.activeOrders.map((o) => (o.id === order.id ? order : o))
                : state.activeOrders,
            currentOrder: state.currentOrder?.id === order.id ? order : state.currentOrder,
        }));
    },

    handleOrderRemove: (orderId: number | string) => {
        set((state) => ({
            orders: state.orders.filter((o) => o.id !== orderId),
            activeOrders: state.activeOrders.filter((o) => o.id !== orderId),
            availableOrders: state.availableOrders.filter((o) => o.id !== orderId),
            currentOrder: state.currentOrder?.id === orderId ? null : state.currentOrder,
        }));
    },
}));

// Selectors
export const selectOrders = (state: OrdersState) => state.orders;
export const selectAvailableOrders = (state: OrdersState) => state.availableOrders;
export const selectActiveOrders = (state: OrdersState) => state.activeOrders;
export const selectOrderHistory = (state: OrdersState) => state.orderHistory;
export const selectCurrentOrder = (state: OrdersState) => state.currentOrder;
export const selectShopStats = (state: OrdersState) => state.shopStats;
export const selectCompanyStats = (state: OrdersState) => state.companyStats;
export const selectDriverStats = (state: OrdersState) => state.driverStats;
export const selectIsLoading = (state: OrdersState) => state.isLoading;
export const selectError = (state: OrdersState) => state.error;

export default useOrdersStore;
