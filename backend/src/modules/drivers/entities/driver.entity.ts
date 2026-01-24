import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";

export enum VehicleType {
    CAR = 'car',
    MOTORCYCLE = 'motorcycle',
    TRUCK = 'truck',
    VAN = 'van',
    BICYCLE = 'bicycle',
}

@Entity('drivers')
export class Driver {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'integer', unique: true })
    user_id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ type: 'integer', nullable: true })
    company_id: number;

    @Column({ type: 'character varying', length: 50, nullable: true })
    national_id: string;

    @Column({ type: 'date', nullable: true })
    birth_date: Date;

    @Column({ type: 'character varying', length: 20, nullable: true })
    phone: string;

    @Column({ type: 'character varying', length: 100, nullable: true })
    city: string;

    // TODO: Implement file upload functionality later
    @Column({ type: 'character varying', length: 500, nullable: true })
    personal_image: string;

    @Column({ type: 'character varying', length: 50, nullable: true })
    license_number: string;

    @Column({ type: 'date', nullable: true })
    license_expiry_date: Date;

    // TODO: Implement file upload functionality later
    @Column({ type: 'character varying', length: 500, nullable: true })
    license_image: string;

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

    // TODO: Implement file upload functionality later
    @Column({ type: 'character varying', length: 500, nullable: true })
    vehicle_image: string;

    @CreateDateColumn({ type: 'timestamp without time zone' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp without time zone' })
    updated_at: Date;

    @DeleteDateColumn({ type: 'timestamp without time zone', nullable: true })
    deleted_at: Date;
}
