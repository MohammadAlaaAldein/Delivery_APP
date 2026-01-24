import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Company } from "../../companies/entities/company.entity";

export enum ShopRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

@Entity('shops_requests')
export class ShopRequest {
    @PrimaryGeneratedColumn()
    id: number;

    // The company that submitted the request
    @Column({ type: 'integer' })
    requesting_company_id: number;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'requesting_company_id' })
    requesting_company: Company;

    @Column({ type: 'enum', enum: ShopRequestStatus, default: ShopRequestStatus.PENDING })
    status: ShopRequestStatus;

    // Shop fields (same as Shop entity)
    @Column({ type: 'character varying', length: 256 })
    name: string;

    // Location fields
    @Column({ type: 'character varying', length: 100, nullable: true })
    city: string;

    @Column({ type: 'character varying', length: 100, nullable: true })
    area: string;

    @Column({ type: 'character varying', length: 255, nullable: true })
    street: string;

    @Column({ type: 'character varying', length: 100, nullable: true })
    building: string;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude: number;

    @Column({ type: 'text', nullable: true })
    address: string;

    // Contact fields
    @Column({ type: 'character varying', length: 30, nullable: true })
    phone: string;

    @Column({ type: 'character varying', length: 30, nullable: true })
    whatsapp: string;

    @Column({ type: 'character varying', length: 255, nullable: true })
    email: string;

    // License fields
    @Column({ type: 'character varying', length: 100, nullable: true })
    license_number: string;

    @Column({ type: 'character varying', length: 100, nullable: true })
    license_type: string;

    @Column({ type: 'date', nullable: true })
    license_expiry_date: Date;

    // Admin notes (for rejection reason, etc.)
    @Column({ type: 'text', nullable: true })
    admin_notes: string;

    @CreateDateColumn({ type: 'timestamp without time zone' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp without time zone' })
    updated_at: Date;

    @DeleteDateColumn({ type: 'timestamp without time zone', nullable: true })
    deleted_at: Date;
}
