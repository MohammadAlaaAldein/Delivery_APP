import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToOne } from 'typeorm';
import { ENTITY_TYPE, USER_ROLE } from '../user-roles.service';

@Entity('users_roles')
export class UserRole {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	user_id: number;

	@Column({ type: 'varchar', length: 50 })
	role: USER_ROLE;

	@Column({ type: 'varchar', length: 50 })
	entity_type: ENTITY_TYPE;

	@Column({ nullable: true })
	entity_id?: number;

	@CreateDateColumn()
	created_at: Date;

	@UpdateDateColumn()
	updated_at: Date;

	@DeleteDateColumn()
	deleted_at: Date;
}
