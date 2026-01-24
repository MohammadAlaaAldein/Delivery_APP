import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('companies')
export class Company {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'character varying', length: 256 })
	name: string;

	@Column({ type: 'boolean' })
	is_active: boolean;

	// Location fields
	@Column({ type: 'character varying', length: 100, nullable: true })
	city: string;

	@Column({ type: 'text', nullable: true })
	address: string;

	// Contact fields
	@Column({ type: 'character varying', length: 30, nullable: true })
	phone: string;

	@Column({ type: 'character varying', length: 255, nullable: true })
	email: string;

	@Column({ type: 'character varying', length: 255, nullable: true })
	website: string;

	// Company info
	@Column({ type: 'character varying', length: 50, nullable: true })
	company_type: string;

	// License fields
	@Column({ type: 'character varying', length: 100, nullable: true })
	license_number: string;

	@Column({ type: 'date', nullable: true })
	license_expiry_date: Date;

	@CreateDateColumn({ type: 'timestamp without time zone' })
	created_at: Date;

	@UpdateDateColumn({ type: 'timestamp without time zone' })
	updated_at: Date;

	@DeleteDateColumn({ type: 'timestamp without time zone', nullable: true })
	deleted_at: Date;
}
