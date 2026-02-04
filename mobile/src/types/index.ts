// User Roles
export enum UserRole {
    ADMIN = 'admin',
    SHOP = 'shop',
    COMPANY = 'company',
    DRIVER = 'driver',
}

// Order Statuses
export enum OrderStatus {
    PENDING = 'pending',
    ASSIGNED_TO_COMPANY = 'assigned_to_company',
    ASSIGNED_TO_DRIVER = 'assigned_to_driver',
    PICKED_UP = 'picked_up',
    IN_TRANSIT = 'in_transit',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
}

// Order Item Types
export enum OrderItemType {
    BAG = 'bag',
    ENVELOPE = 'envelope',
    SMALL_BOX = 'small_box',
    MEDIUM_BOX = 'medium_box',
    LARGE_BOX = 'large_box',
    CUSTOM = 'custom',
    DOCUMENT = 'document',
    PACKAGE = 'package',
    FOOD = 'food',
    OTHER = 'other',
}

// Payment Methods
export enum PaymentMethod {
    CASH = 'cash',
    CARD = 'card',
    ONLINE = 'online',
}

// Payment Status
export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed',
    REFUNDED = 'refunded',
}

// Notification Types
export enum NotificationType {
    ORDER_CREATED = 'ORDER_CREATED',
    ORDER_ASSIGNED = 'ORDER_ASSIGNED',
    ORDER_PICKED_UP = 'ORDER_PICKED_UP',
    ORDER_IN_TRANSIT = 'ORDER_IN_TRANSIT',
    ORDER_DELIVERED = 'ORDER_DELIVERED',
    ORDER_CANCELLED = 'ORDER_CANCELLED',
    ORDER_UPDATED = 'ORDER_UPDATED',
    DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
    DRIVER_UNASSIGNED = 'DRIVER_UNASSIGNED',
    NEW_ORDER_AVAILABLE = 'NEW_ORDER_AVAILABLE',
    GENERAL = 'GENERAL',
}

// Platform Types
export type Platform = 'ios' | 'android' | 'web';

// User Interface
export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    entity_id?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    shop?: Shop; // Associated shop for shop users
}

// Auth Response
export interface AuthResponse {
    id?: number;
    name: string;
    email: string;
    role: UserRole;
    entity_id?: number;
    accessToken: string;
    refreshToken: string;
}

// Shop Interface
export interface Shop {
    id: number;
    name: string;
    is_active: boolean;
    city: string;
    area?: string;
    street?: string;
    building?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    license_number?: string;
    license_type?: string;
    license_expiry_date?: string;
    company_ids?: number[];
    company_names?: string[];
    created_at: string;
    updated_at: string;
}

// Company Interface
export interface Company {
    id: number;
    name: string;
    is_active: boolean;
    city: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    company_type?: string;
    license_number?: string;
    license_expiry_date?: string;
    shop_ids?: number[];
    shop_names?: string[];
    created_at: string;
    updated_at: string;
}

// Driver Interface
export interface Driver {
    id: number;
    user_id: number;
    company_id?: number;
    is_active: boolean;
    name?: string;
    email?: string;
    national_id?: string;
    birth_date?: string;
    phone?: string;
    city?: string;
    personal_image?: string;
    license_number?: string;
    license_expiry_date?: string;
    license_image?: string;
    vehicle_type?: string;
    vehicle_brand?: string;
    vehicle_model?: string;
    vehicle_year?: number;
    vehicle_color?: string;
    plate_number?: string;
    vehicle_image?: string;
    current_latitude?: number;
    current_longitude?: number;
    last_location_update?: string;
    user?: User;
    company?: Company;
    created_at: string;
    updated_at: string;
    // camelCase aliases
    isActive?: boolean;
    vehicleType?: string;
    rating?: number;
}

// Order Item Interface
export interface OrderItem {
    type: OrderItemType;
    quantity: number;
    description?: string;
    weight?: number;
    name?: string; // Display name for the item
    price?: number; // Price per unit
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
}

// Order Interface
export interface Order {
    id: number | string;
    order_number: string;
    shop_id: number;
    company_id?: number;
    driver_id?: number;
    status: OrderStatus;
    // Customer Info (snake_case - primary)
    customer_name: string;
    customer_phone: string;
    customer_phone_alt?: string;
    customer_email?: string;
    // Customer Info (camelCase - aliases for compatibility)
    customerName?: string;
    customerPhone?: string;
    customerPhoneAlt?: string;
    customerEmail?: string;
    // Delivery Address
    delivery_city: string;
    delivery_area?: string;
    delivery_street?: string;
    delivery_building?: string;
    delivery_address?: string;
    delivery_latitude?: number;
    delivery_longitude?: number;
    delivery_notes?: string;
    // Order Items
    order_items?: OrderItem[];
    items?: OrderItem[]; // Alias for order_items
    requires_large_vehicle: boolean;
    // Delivery camelCase aliases
    deliveryCity?: string;
    deliveryArea?: string;
    deliveryStreet?: string;
    deliveryBuilding?: string;
    deliveryAddress?: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    deliveryNotes?: string;
    // Amounts
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
    // Tracking timestamps
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
    notes?: string; // General notes alias
    // Amount camelCase aliases
    orderAmount?: number;
    deliveryFee?: number;
    totalAmount?: number;
    // Payment camelCase aliases
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
    isPaid?: boolean;
    // Timestamp camelCase aliases
    createdAt?: string;
    updatedAt?: string;
    deliveredAt?: string;
    pickedUpAt?: string;
    cancelledAt?: string;
    assignedToCompanyAt?: string;
    assignedToDriverAt?: string;
    inTransitAt?: string;
    // camelCase field aliases
    orderNumber?: string;
    shopId?: number;
    companyId?: number;
    driverId?: number;
    // Relations
    shop?: Shop;
    company?: Company;
    driver?: Driver;
    // Timestamps
    created_at: string;
    updated_at: string;
}

// Order History Interface
export interface OrderHistory extends Order {
    archived_at: string;
}

// Create Order DTO
export interface CreateOrderDto {
    customer_name?: string;
    customer_phone?: string;
    customer_phone_alt?: string;
    customer_email?: string;
    delivery_city?: string;
    delivery_area?: string;
    delivery_street?: string;
    delivery_building?: string;
    delivery_address?: string;
    delivery_latitude?: number;
    delivery_longitude?: number;
    delivery_notes?: string;
    order_items?: OrderItem[];
    requires_large_vehicle?: boolean;
    order_amount?: number;
    delivery_fee?: number;
    payment_method?: PaymentMethod;
    priority?: number;
    scheduled_pickup_time?: string;
    scheduled_delivery_time?: string;
    shop_notes?: string;
    // camelCase aliases
    customerName?: string;
    customerPhone?: string;
    customerPhoneAlt?: string;
    customerEmail?: string;
    deliveryCity?: string;
    deliveryArea?: string;
    deliveryStreet?: string;
    deliveryBuilding?: string;
    deliveryAddress?: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    deliveryNotes?: string;
    orderAmount?: number;
    deliveryFee?: number;
    paymentMethod?: PaymentMethod;
    shopNotes?: string;
}

// Update Order DTO
export interface UpdateOrderDto extends Partial<CreateOrderDto> {
    status?: OrderStatus;
    company_id?: number;
    driver_id?: number;
    company_notes?: string;
    driver_notes?: string;
}

// Take Order DTO
export interface TakeOrderDto {
    company_notes?: string;
}

// Assign Driver DTO
export interface AssignDriverDto {
    driver_id: number;
    company_notes?: string;
}

// Location Update DTO
export interface LocationUpdateDto {
    latitude: number;
    longitude: number;
}

// API Response Interface
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    errors?: Record<string, string[]>;
}

// Pagination Interface
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Dashboard Stats Interfaces
export interface ShopDashboardStats {
    totalOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    todayOrders: number;
    recentOrders: Order[];
}

export interface CompanyDashboardStats {
    totalOrders: number;
    availableOrders: number;
    assignedOrders: number;
    activeDeliveries: number;
    deliveredToday: number;
    totalDrivers: number;
    activeDrivers: number;
    recentOrders: Order[];
}

export interface DriverDashboardStats {
    totalDeliveries: number;
    activeOrders: number;
    todayDeliveries: number;
    pendingPickups: number;
    inTransitOrders: number;
    weeklyDeliveries: number;
    currentOrder?: Order;
    upcomingOrders: Order[];
}

// Socket Events
export interface SocketEvent<T = any> {
    event: string;
    data: T;
}

// Push Notification Payload
export interface PushNotificationPayload {
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, any>;
}

// Device Token Registration
export interface DeviceTokenDto {
    token: string;
    platform: Platform;
    deviceId?: string;
    deviceName?: string;
}

// Jordan Cities
export const JORDAN_CITIES = [
    'Amman',
    'Irbid',
    'Zarqa',
    'Balqa',
    'Mafraq',
    'Jerash',
    'Ajloun',
    'Madaba',
    'Karak',
    'Tafilah',
    "Ma'an",
    'Aqaba',
] as const;

export type JordanCity = (typeof JORDAN_CITIES)[number];

// Vehicle Types
export const VEHICLE_TYPES = [
    'motorcycle',
    'car',
    'van',
    'pickup',
    'truck',
] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];

// Navigation Types
export type RootStackParamList = {
    Auth: undefined;
    Shop: undefined;
    Company: undefined;
    Driver: undefined;
};

export type AuthStackParamList = {
    Login: undefined;
    OTP: { email: string };
    ForgotPassword: undefined;
};

export type ShopTabParamList = {
    Dashboard: undefined;
    Orders: undefined;
    CreateOrder: undefined;
    Profile: undefined;
    Settings: undefined;
};

export type CompanyTabParamList = {
    Dashboard: undefined;
    Available: undefined;
    MyOrders: undefined;
    Drivers: undefined;
    Profile: undefined;
    Settings: undefined;
};

export type DriverTabParamList = {
    Dashboard: undefined;
    ActiveOrders: undefined;
    History: undefined;
    Profile: undefined;
    Settings: undefined;
};

// Common screen params
export type OrderDetailParams = {
    orderId: number;
};

export type AssignDriverParams = {
    orderId: number;
};

// Stack Navigation Param Lists
export type ShopStackParamList = {
    ShopTabs: undefined;
    Dashboard: undefined;
    Orders: undefined;
    OrderDetail: OrderDetailParams;
    CreateOrder: undefined;
    EditOrder: OrderDetailParams;
    Profile: undefined;
    Settings: undefined;
};

export type CompanyStackParamList = {
    CompanyTabs: undefined;
    Dashboard: undefined;
    AvailableOrders: undefined;
    Available: undefined;
    MyOrders: undefined;
    Drivers: undefined;
    OrderDetail: OrderDetailParams;
    AssignDriver: AssignDriverParams;
    DriverDetail: { driverId: number };
    Profile: undefined;
    Settings: undefined;
};

export type DriverStackParamList = {
    DriverTabs: undefined;
    Dashboard: undefined;
    ActiveOrders: undefined;
    History: undefined;
    OrderDetail: OrderDetailParams;
    DeliveryMap: OrderDetailParams;
    Profile: undefined;
    Settings: undefined;
};
