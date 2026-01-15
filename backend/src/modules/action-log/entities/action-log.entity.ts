import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('action_logs')
@Index('action_logs_action_name_idx', ['action_name'])
@Index('action_logs_action_time_idx', ['action_time'])
@Index('action_logs_action_user_id_idx', ['action_user_id'])
@Index('action_logs_id_idx', ['id'])
@Index('action_logs_related_id_idx', ['related_id'])
export class ActionLog {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'json', default: () => "'{}'" })
	old_values: Record<string, any>;

	@Column({ type: 'json', default: () => "'{}'" })
	new_values: Record<string, any>;

	@Column({ type: 'varchar', length: 200 })
	action_name: string;

	@Column({ type: 'varchar', length: 50, default: '' })
	related_id: string;

	@Column({ type: 'varchar', length: 50, default: '' })
	additional_related_id: string;

	@Column({ type: 'bigint', default: 0 })
	action_user_id: number;

	@Column({ type: 'timestamp', default: () => 'now()' })
	action_time: Date;

	@Column({ type: 'varchar', length: 50, default: '' })
	ip_address: string;

	@Column({ type: 'varchar', length: 1000, default: '' })
	user_agent: string;

	@Column({ type: 'varchar', length: 600, nullable: true, default: '' })
	git_info: string | null;

	@CreateDateColumn({ type: 'timestamp without time zone', primary: true })
	created_at: Date;

	@UpdateDateColumn({ type: 'timestamp without time zone' })
	updated_at: Date;

	@DeleteDateColumn({ type: 'timestamp without time zone', nullable: true })
	deleted_at: Date;
}