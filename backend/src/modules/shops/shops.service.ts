import { Injectable } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Shop } from './entities/shop.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { FastifyRequest } from 'fastify';
import { ErrorKeys } from 'src/common/api-response';
import { ListShopDto } from './dto/list-shops.dto';
import { CompaniesShopsService } from '../companies-shops/companies-shops.service';

@Injectable()
export class ShopsService {

	constructor(
		@InjectRepository(Shop)
		private readonly shopsRepository: Repository<Shop>,
		private readonly companiesShopsService: CompaniesShopsService,
		private connection: DataSource,
	) { }

	private getShopRepository(entityManager?: EntityManager): Repository<Shop> {
		return entityManager ? entityManager.getRepository(Shop) : this.connection.getRepository(Shop);
	}

	async toggleActive(id: number, options?: { req?: FastifyRequest }): Promise<any> {
		try {
			const shop = (await this.getShops({ id }))[0];
			if (!shop)
				return { err: ErrorKeys.NOT_FOUND };

			const newStatus = !shop.is_active;
			await this.shopsRepository.createQueryBuilder().update().set({ is_active: newStatus }).where('id = :id', { id }).execute();

			return { err: null, res: { is_active: newStatus } };
		} catch (ex) {
			throw ex;
		}
	}

	async create(createShopDto: CreateShopDto, options?: { req?: FastifyRequest }): Promise<any> {
		try {
			const { company_ids, ...shopData } = createShopDto;
			const shop = this.shopsRepository.create(shopData);

			const uniqueFieldFound = await this.checkShopUniqueFields(shopData);
			if (uniqueFieldFound)
				return this.checkShopUniqueFieldsError(uniqueFieldFound);

			await this.shopsRepository.save(shop);

			// Handle company associations
			if (company_ids && company_ids.length > 0) {
				await this.companiesShopsService.updateRelations('shop', shop.id, company_ids);
			}

			const { ...result } = shop;
			return result;
		} catch (ex) {
			throw ex;
		}
	}

	async update(id: number, fields: UpdateShopDto, options?: { req?: FastifyRequest }): Promise<any> {
		try {
			const { company_ids, ...updateData } = fields;
			const allowedFields = [
				'name',
			];

			const shop = (await this.getShops({ id }))[0];

			// Check uniqueness
			const uniqueFieldFound = await this.checkShopUniqueFields(updateData, shop);
			if (uniqueFieldFound)
				return this.checkShopUniqueFieldsError(uniqueFieldFound);

			const updateFields: Partial<UpdateShopDto> = {};

			for (const field in updateData) {
				if (allowedFields.includes(field))
					updateFields[field] = updateData[field];
			}

			if (Object.keys(updateFields).length) {
				await this.shopsRepository.createQueryBuilder().update().set(updateFields).where('id = :id', { id }).execute();
			}

			// Handle company associations if provided
			if (company_ids !== undefined) {
				await this.companiesShopsService.updateRelations('shop', id, company_ids);
			}

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

	async getShops(filters: ListShopDto): Promise<any[]> {
		try {
			const criteria = {};
			if (filters && Object.keys(filters).length) {
				for (const field in filters) {
					const value = filters[field];

					if (value !== null && value !== undefined && value !== '' && value !== 0)
						criteria[field] = value;
				}
			}

			const qb = this.shopsRepository.createQueryBuilder('shop').select('shop.*');

			for (const field in criteria) {
				const params = { [field]: criteria[field] };
				switch (field) {
					case 'id':
						if (!Array.isArray(params[field]))
							params[field] = [params[field]];

						qb.andWhere(`shop.${field} = ANY(:${field})`, params);
						break;
					case 'name':
						params[field] = params[field].trim().toLowerCase();
						qb.andWhere(`LOWER(shop.${field}) = :${field}`, params);
						break;
					default:
						break;
				}
			}

			const shops = await qb.getRawMany();

			// Fetch company_ids for each shop
			const result = await Promise.all(shops.map(async (shop) => {
				const { password, ...rest } = shop;
				const company_ids = await this.companiesShopsService.getCompanyIdsByShopId(shop.id);
				return { ...rest, company_ids };
			}));

			return result;
		} catch (ex) {
			throw ex;
		}
	}
}
