import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Company } from "../../companies/entities/company.entity";
import { VehicleType } from "../../drivers/entities/driver.entity";

export enum DriverRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

@Entity('drivers_requests')
export class DriverRequest {
    @PrimaryGeneratedColumn()
    id: number;

    // The company that submitted the request
    @Column({ type: 'integer' })
    requesting_company_id: number;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'requesting_company_id' })
    requesting_company: Company;

    @Column({ type: 'enum', enum: DriverRequestStatus, default: DriverRequestStatus.PENDING })
    status: DriverRequestStatus;

    // Driver personal fields
    @Column({ type: 'character varying', length: 100 })
    name: string;

    @Column({ type: 'character varying', length: 255, nullable: true })
    email: string;

    @Column({ type: 'character varying', length: 50, nullable: true })
    national_id: string;

    @Column({ type: 'date', nullable: true })
    birth_date: Date;

    @Column({ type: 'character varying', length: 20, nullable: true })
    phone: string;

    @Column({ type: 'character varying', length: 100, nullable: true })
    city: string;

    @Column({ type: 'character varying', length: 500, nullable: true })
    personal_image: string;

    // License fields
    @Column({ type: 'character varying', length: 50, nullable: true })
    license_number: string;

    @Column({ type: 'date', nullable: true })
    license_expiry_date: Date;

    @Column({ type: 'character varying', length: 500, nullable: true })
    license_image: string;

    // Vehicle fields
    @Column({ type: 'enum', enum: VehicleType, nullable: true })
    vehicle_type: VehicleType;

    @Column({ type: 'character varying', length: 100, nullable: true })
    vehicle_brand: string;

    @Column({ type: 'character varying', length: 100, nullable: true })
    vehicle_model: string;

    @Column({ type: 'integer', nullable: true })
    vehicle_year: number;

    @Column({ type: 'character varying', length: 50, nullable: true })
    vehicle_color: string;

    @Column({ type: 'character varying', length: 20, nullable: true })
    plate_number: string;

    @Column({ type: 'character varying', length: 500, nullable: true })
    vehicle_image: string;

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
