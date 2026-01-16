import { Injectable } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Shop } from './entities/shop.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { FastifyRequest } from 'fastify';
import { ErrorKeys } from 'src/common/api-response';
import { ListShopDto } from './dto/list-shops.dto';

@Injectable()
export class ShopsService {

	constructor(
		@InjectRepository(Shop)
		private readonly shopsRepository: Repository<Shop>,
		private connection: DataSource,
	) { }

	private getShopRepository(entityManager?: EntityManager): Repository<Shop> {
		return entityManager ? entityManager.getRepository(Shop) : this.connection.getRepository(Shop);
	}

	async create(createShopDto: CreateShopDto, options?: { req?: FastifyRequest }): Promise<any> {
		try {
			const shop = this.shopsRepository.create(createShopDto);

			const uniqueFieldFound = await this.checkShopUniqueFields(createShopDto);
			if (uniqueFieldFound)
				return this.checkShopUniqueFieldsError(uniqueFieldFound);

			await this.shopsRepository.save(shop);
			const { ...result } = shop;

			return result;
		} catch (ex) {
			throw ex;
		}
	}

	async update(id: number, fields: UpdateShopDto, options?: { req?: FastifyRequest }): Promise<any> {
		try {
			const allowedFields = [
				'name',
			];

			const shop = (await this.getShops({ id }))[0];

			// Check uniqueness
			const uniqueFieldFound = await this.checkShopUniqueFields(fields, shop);
			if (uniqueFieldFound)
				return this.checkShopUniqueFieldsError(uniqueFieldFound);

			const updateFields: UpdateShopDto = {};

			for (const field in fields) {
				if (allowedFields.includes(field))
					updateFields[field] = fields[field];
			}

			if (!Object.keys(updateFields).length)
				return { err: 'no_changes', res: null };

			await this.shopsRepository.createQueryBuilder().update().set(updateFields).where('id = :id', { id }).execute();

			const { ...updatedFields } = updateFields;
			return { err: null, res: updatedFields };
		} catch (ex) {
			throw ex;
		}
	}

	private checkShopUniqueFieldsError(field: string) {
		let errorKey = '';
		switch (field) {
			case 'name':
				errorKey = ErrorKeys.UNIQUE_VIOLATION_NAME;
				break;
			default:
				break;
		}
		return { err: errorKey };
	}

	private async checkShopUniqueFields(fields: UpdateShopDto, oldShopInfo?: UpdateShopDto): Promise<any> {
		try {
			// Check uniqueness
			const uniqueFields = ['name'];
			const conditions = [];
			const values = {};

			for (const field of uniqueFields) {
				if (field in fields && (!oldShopInfo || oldShopInfo[field] != fields[field])) {
					conditions.push(`${field} = :${field}`);
					values[field] = fields[field];
				}
			}

			if (conditions.length) {
				const shop = await this.shopsRepository.createQueryBuilder().where(conditions.join(' OR '), values).getOne();
				if (shop) {
					for (const field of uniqueFields) {
						if (shop[field] == fields[field])
							return field;
					}
				}
			}

			return null;
		} catch (ex) {
			throw ex;
		}
	}

	async deleteShop(id: number, options: { entityManager?: EntityManager, req?: FastifyRequest } = {}): Promise<any> {
		try {
			const repository = this.getShopRepository(options.entityManager);
			return await repository.createQueryBuilder().softDelete().where({ id }).execute();
		} catch (ex) {
			throw ex;

		}
	}

	async getShops(filters: ListShopDto): Promise<Shop[]> {
		try {
			const criteria = {};
			if (filters && Object.keys(filters).length) {
				for (const field in filters) {
					const value = filters[field];

					if (value !== null && value !== undefined && value !== '' && value !== 0)
						criteria[field] = value;
				}
			}

			const qb = this.shopsRepository.createQueryBuilder().select('*');

			for (const field in criteria) {
				const params = { [field]: criteria[field] };
				switch (field) {
					case 'id':
						if (!Array.isArray(params[field]))
							params[field] = [params[field]];

						qb.andWhere(`${field} = ANY(:${field})`, params);
						break;
					case 'name':
						params[field] = params[field].trim().toLowerCase();
						qb.andWhere(`LOWER(${field}) = :${field}`, params);
						break;
					default:
						break;
				}
			}

			const result = await qb.getRawMany();
			return result.map(({ password, ...rest }) => rest);
		} catch (ex) {
			throw ex;
		}
	}
}
