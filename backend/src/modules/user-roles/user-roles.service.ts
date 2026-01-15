import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm/entity-manager/EntityManager';
import { Repository } from 'typeorm/repository/Repository';
import { UserRole } from './entities/user-role.entity';
import { DataSource } from 'typeorm';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { FastifyRequest } from 'fastify';
import { InjectRepository } from '@nestjs/typeorm';
import { ListUsersRolesDto } from './dto/list-user-roles.dto';

export enum USER_ROLE {
	ADMIN = 'admin',
	SHOP = 'shop',
	COMPANY = 'company',
	DRIVER = 'driver',
};

export enum ENTITY_TYPE {
	SHOP = 'shop',
	COMPANY = 'company',
	DRIVER = 'driver',
};

@Injectable()
export class UserRolesService {

	constructor(
		@InjectRepository(UserRole)
		private readonly usersRolesRepository: Repository<UserRole>,
		private connection: DataSource,
	) { }

	private getUsersRolesRepository(entityManager?: EntityManager): Repository<UserRole> {
		return entityManager ? entityManager.getRepository(UserRole) : this.connection.getRepository(UserRole);
	}

	async save(createUserRoleDto: Partial<CreateUserRoleDto>, options?: { entityManager?: EntityManager }): Promise<any> {
		try {
			return await this.getUsersRolesRepository(options?.entityManager).save(createUserRoleDto);
		} catch (ex) {
			throw ex;
		}
	}

	async getUsersRoles(filters: ListUsersRolesDto) {
		try {
			const criteria = {};

			if (filters && Object.keys(filters).length > 0) {
				for (const field in filters) {
					const value = filters[field];

					if (value !== null && value !== undefined && value !== '' && value !== 0)
						criteria[field] = value;
				}
			}

			const qb = this.usersRolesRepository.createQueryBuilder().select('*');

			for (const field in criteria) {
				const params = { [field]: criteria[field] };
				switch (field) {
					case 'role':
						params[field] = params[field].trim().toLowerCase();
						qb.andWhere(`LOWER(${field}) = :${field}`, params);
						break;
					case 'user_id':
					case 'entity_id':
						qb.andWhere(`${field} = :${field}`, params);
						break;
					default:
						break;
				}
			}

			return await qb.getRawMany();
		} catch (ex) {
			throw ex;
		}
	}

	async deleteUserRole(userId: number, options: { entityManager?: EntityManager, req?: FastifyRequest } = {}): Promise<any> {
		try {
			const repository = this.getUsersRolesRepository(options.entityManager);
			return await repository.softDelete({ user_id: userId });
		} catch (ex) {
			throw ex;

		}
	}


}
