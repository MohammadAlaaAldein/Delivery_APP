import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Shop } from '../../shops/entities/shop.entity';
import { Company } from '../../companies/entities/company.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { OrderStatus, PaymentMethod, PaymentStatus } from './order.entity';

@Entity('orders_history')
export class OrderHistory {
    @PrimaryGeneratedColumn()
    id: number;

    // Original order ID for reference
    @Column({ type: 'int' })
    original_order_id: number;

    // Order number for display (e.g., ORD-2024-0001)
    @Column({ type: 'varchar', length: 50 })
    order_number: string;

    // Relationships (stored as IDs for historical reference)
    @Column({ type: 'int' })
    shop_id: number;

    @ManyToOne(() => Shop, { onDelete: 'SET NULL', nullable: true })
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

    // Status (will be DELIVERED or CANCELLED)
    @Column({
        type: 'enum',
        enum: OrderStatus,
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

    // Order Details
    @Column({ type: 'text', nullable: true })
    order_description: string;

    @Column({ type: 'int', default: 1 })
    items_count: number;

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

    // Tracking timestamps from original order
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

    // Original order timestamps
    @Column({ type: 'timestamp' })
    order_created_at: Date;

    @Column({ type: 'timestamp' })
    order_updated_at: Date;

    // History record timestamp
    @CreateDateColumn()
    archived_at: Date;
}
