import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { hashPassword } from '../../../common/utilities';
import { AccessFunctionsDto } from "../dto/update-access-functions.dto";
// import { UserRole } from "src/modules/user-roles/entities/user-role.entity";
import { ENTITY_TYPE, USER_ROLE } from "src/modules/user-roles/user-roles.service";

@Entity('users')
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'character varying', length: 256 })
	name: string;

	@Column({ type: 'character varying', length: 256, unique: true })
	@Index('users_email_idx')
	email: string;

	@Column({ type: 'text', nullable: true })
	password: string;

	@Column({ type: 'boolean' })
	is_active: boolean;

	@Column({ type: 'enum', enum: ENTITY_TYPE, nullable: false })
	role?: USER_ROLE;

	@Column({ type: 'integer', nullable: true })
	entity_id?: number;

	@Column({ type: 'jsonb', default: '{}' })
	access_functions: AccessFunctionsDto;

	@CreateDateColumn({ type: 'timestamp without time zone' })
	created_at: Date;

	@UpdateDateColumn({ type: 'timestamp without time zone' })
	updated_at: Date;

	@DeleteDateColumn({ type: 'timestamp without time zone', nullable: true })
	deleted_at: Date;

	@BeforeInsert()
	async hashPasswordBeforeSave() {
		if (this.password)
			this.password = await hashPassword(this.password);
	}
}
