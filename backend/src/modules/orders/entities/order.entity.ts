import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Shop } from '../../shops/entities/shop.entity';
import { Company } from '../../companies/entities/company.entity';
import { Driver } from '../../drivers/entities/driver.entity';

// Order item types
export enum OrderItemType {
    BAG = 'bag',
    ENVELOPE = 'envelope',
    SMALL_BOX = 'small_box',
    MEDIUM_BOX = 'medium_box',
    LARGE_BOX = 'large_box',
    CUSTOM = 'custom',
}

// Order item interface for JSON column
export interface OrderItem {
    type: OrderItemType | string;
    count: number;
    size?: string;       // e.g., "30cm x 50cm"
    description?: string; // additional notes for this item
}

export enum OrderStatus {
    PENDING = 'pending',                           // Created by shop, not assigned to any company
    ASSIGNED_TO_COMPANY = 'assigned_to_company',   // Taken/assigned to a company
    ASSIGNED_TO_DRIVER = 'assigned_to_driver',     // Company assigned to a driver
    PICKED_UP = 'picked_up',                       // Driver picked up the order
    IN_TRANSIT = 'in_transit',                     // Driver is delivering
    DELIVERED = 'delivered',                       // Order delivered successfully
    CANCELLED = 'cancelled',                       // Order cancelled
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

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    // Order number for display (e.g., ORD-2024-0001)
    @Column({ type: 'varchar', length: 50, unique: true })
    order_number: string;

    // Relationships
    @Column({ type: 'int' })
    shop_id: number;

    @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'shop_id' })
    shop: Shop;

    @Column({ type: 'int', nullable: true })
    company_id: number;

    @ManyToOne(() => Company, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'int', nullable: true })
    driver_id: number;

    @ManyToOne(() => Driver, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'driver_id', referencedColumnName: 'user_id' })
    driver: Driver;

    // Status
    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    // Customer Information
    @Column({ type: 'varchar', length: 256 })
    customer_name: string;

    @Column({ type: 'varchar', length: 30 })
    customer_phone: string;

    @Column({ type: 'varchar', length: 30, nullable: true })
    customer_phone_alt: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    customer_email: string;

    // Delivery Address
    @Column({ type: 'varchar', length: 100, nullable: true })
    delivery_city: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    delivery_area: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    delivery_street: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    delivery_building: string;

    @Column({ type: 'text', nullable: true })
    delivery_address: string;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    delivery_latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    delivery_longitude: number;

    @Column({ type: 'text', nullable: true })
    delivery_notes: string;

    // Order Items (JSON array)
    @Column({ type: 'jsonb', nullable: true })
    order_items: OrderItem[];

    // Flag for large vehicle requirement
    @Column({ type: 'boolean', default: false })
    requires_large_vehicle: boolean;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    order_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    delivery_fee: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    total_amount: number;

    // Payment
    @Column({
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.CASH,
    })
    payment_method: PaymentMethod;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    payment_status: PaymentStatus;

    @Column({ type: 'boolean', default: false })
    is_paid: boolean;

    // Priority & Scheduling
    @Column({ type: 'int', default: 0 })
    priority: number;

    @Column({ type: 'timestamp', nullable: true })
    scheduled_pickup_time: Date;

    @Column({ type: 'timestamp', nullable: true })
    scheduled_delivery_time: Date;

    // Tracking timestamps
    @Column({ type: 'timestamp', nullable: true })
    company_assigned_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    driver_assigned_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    picked_up_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    delivered_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    cancelled_at: Date;

    @Column({ type: 'text', nullable: true })
    cancellation_reason: string;

    // Notes
    @Column({ type: 'text', nullable: true })
    shop_notes: string;

    @Column({ type: 'text', nullable: true })
    company_notes: string;

    @Column({ type: 'text', nullable: true })
    driver_notes: string;

    // Timestamps
    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
