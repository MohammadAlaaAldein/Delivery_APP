import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('dispatched_emails_log')
export class Mailer {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'text', nullable: true })
	sender: string;

	@Column({ type: 'text', nullable: true })
	@Index('dispatched_emails_log_receiver')
	receiver: string;

	@Column({ type: 'text', nullable: true })
	subject: string;

	@Column({ type: 'text', nullable: true })
	body: string;

	@Column({ type: 'character varying', length: 50, nullable: true })
	server_name: string;

	@CreateDateColumn({ type: 'timestamp without time zone', primary: true })
	@Index('dispatched_emails_log_created_at')
	created_at: Date;

	@UpdateDateColumn({ type: 'timestamp without time zone' })
	updated_at: Date;

	@DeleteDateColumn({ type: 'timestamp without time zone', nullable: true })
	deleted_at: Date;
}
