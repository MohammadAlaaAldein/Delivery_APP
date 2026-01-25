export enum OrderStatus {
    PENDING = 'pending',
    ASSIGNED_TO_COMPANY = 'assigned_to_company',
    ASSIGNED_TO_DRIVER = 'assigned_to_driver',
    PICKED_UP = 'picked_up',
    IN_TRANSIT = 'in_transit',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
}

export enum PaymentMethod {
    CASH = 'cash',
    CARD = 'card',
    ONLINE = 'online',
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed',
    REFUNDED = 'refunded',
}

export interface Order {
    id: number;
    order_number: string;

    // Relationships
    shop_id: number;
    company_id?: number;
    driver_id?: number;

    // Related entities
    shop?: {
        id: number;
        name: string;
        city?: string;
        phone?: string;
        address?: string;
    };
    company?: {
        id: number;
        name: string;
        phone?: string;
    };
    driver?: {
        id: number;
        user?: {
            name: string;
            email: string;
        };
        phone?: string;
        vehicle_type?: string;
    };

    // Status
    status: OrderStatus;

    // Customer Information
    customer_name: string;
    customer_phone: string;
    customer_phone_alt?: string;
    customer_email?: string;

    // Delivery Address
    delivery_city?: string;
    delivery_area?: string;
    delivery_street?: string;
    delivery_building?: string;
    delivery_address?: string;
    delivery_latitude?: number;
    delivery_longitude?: number;
    delivery_notes?: string;

    // Order Details
    order_description?: string;
    items_count: number;
    order_amount: number;
    delivery_fee: number;
    total_amount: number;

    // Payment
    payment_method: PaymentMethod;
    payment_status: PaymentStatus;
    is_paid: boolean;

    // Priority & Scheduling
    priority: number;
    scheduled_pickup_time?: string;
    scheduled_delivery_time?: string;

    // Timestamps
    company_assigned_at?: string;
    driver_assigned_at?: string;
    picked_up_at?: string;
    delivered_at?: string;
    cancelled_at?: string;
    cancellation_reason?: string;

    // Notes
    shop_notes?: string;
    company_notes?: string;
    driver_notes?: string;

    // System timestamps
    created_at: string;
    updated_at: string;
}

export interface OrderHistory extends Omit<Order, 'id' | 'created_at' | 'updated_at'> {
    id: number;
    original_order_id: number;
    order_created_at: string;
    order_updated_at: string;
    archived_at: string;
}

export interface OrderStatistics {
    total: number;
    pending: number;
    inProgress: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
    deliveryRate: number;
}
