import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('api_logs')
export class ApiLog {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'int2' })
	user_id: number;

	@Column({ type: 'text', nullable: true })
	end_point: string;

	@Column({ type: 'text', nullable: true })
	body_request: string;

	@Column({ type: 'text', nullable: true })
	query_request: string;

	@CreateDateColumn({ type: 'timestamp without time zone', primary: true })
	created_at: Date;

	@UpdateDateColumn({ type: 'timestamp without time zone' })
	updated_at: Date;

	@DeleteDateColumn({ type: 'timestamp without time zone', nullable: true })
	deleted_at: Date;
}
