import { Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { FastifyRequest } from 'fastify';
import { ErrorKeys } from 'src/common/api-response';
import { ListCompanyDto } from './dto/list-companies.dto';
import { CompaniesShopsService } from '../companies-shops/companies-shops.service';

@Injectable()
export class CompaniesService {

	constructor(
		@InjectRepository(Company)
		private readonly companiesRepository: Repository<Company>,
		private readonly companiesShopsService: CompaniesShopsService,
		private connection: DataSource,
	) { }

	private getCompanyRepository(entityManager?: EntityManager): Repository<Company> {
		return entityManager ? entityManager.getRepository(Company) : this.connection.getRepository(Company);
	}

	async toggleActive(id: number, options?: { req?: FastifyRequest }): Promise<any> {
		try {
			const company = (await this.getCompanies({ id }))[0];
			if (!company)
				return { err: ErrorKeys.NOT_FOUND };

			const newStatus = !company.is_active;
			await this.companiesRepository.createQueryBuilder().update().set({ is_active: newStatus }).where('id = :id', { id }).execute();

			return { err: null, res: { is_active: newStatus } };
		} catch (ex) {
			throw ex;
		}
	}

	async create(createCompanyDto: CreateCompanyDto, options?: { req?: FastifyRequest }): Promise<any> {
		try {
			const { shop_ids, ...companyData } = createCompanyDto;
			const company = this.companiesRepository.create(companyData);

			const uniqueFieldFound = await this.checkCompanyUniqueFields(companyData);
			if (uniqueFieldFound)
				return this.checkCompanyUniqueFieldsError(uniqueFieldFound);

			await this.companiesRepository.save(company);

			// Handle shop associations
			if (shop_ids && shop_ids.length > 0) {
				await this.companiesShopsService.updateRelations('company', company.id, shop_ids);
			}

			const { ...result } = company;
			return result;
		} catch (ex) {
			throw ex;
		}
	}

	async update(id: number, fields: UpdateCompanyDto, options?: { req?: FastifyRequest }): Promise<any> {
		try {
			const { shop_ids, ...updateData } = fields;
			const allowedFields = [
				'name',
			];

			const company = (await this.getCompanies({ id }))[0];

			// Check uniqueness
			const uniqueFieldFound = await this.checkCompanyUniqueFields(updateData, company);
			if (uniqueFieldFound)
				return this.checkCompanyUniqueFieldsError(uniqueFieldFound);

			const updateFields: Partial<UpdateCompanyDto> = {};

			for (const field in updateData) {
				if (allowedFields.includes(field))
					updateFields[field] = updateData[field];
			}

			if (Object.keys(updateFields).length) {
				await this.companiesRepository.createQueryBuilder().update().set(updateFields).where('id = :id', { id }).execute();
			}

			// Handle shop associations if provided
			if (shop_ids !== undefined) {
				await this.companiesShopsService.updateRelations('company', id, shop_ids);
			}

			const { ...updatedFields } = updateFields;
			return { err: null, res: updatedFields };
		} catch (ex) {
			throw ex;
		}
	}

	private checkCompanyUniqueFieldsError(field: string) {
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

	private async checkCompanyUniqueFields(fields: UpdateCompanyDto, oldCompanyInfo?: UpdateCompanyDto): Promise<any> {
		try {
			// Check uniqueness
			const uniqueFields = ['name'];
			const conditions = [];
			const values = {};

			for (const field of uniqueFields) {
				if (field in fields && (!oldCompanyInfo || oldCompanyInfo[field] != fields[field])) {
					conditions.push(`${field} = :${field}`);
					values[field] = fields[field];
				}
			}

			if (conditions.length) {
				const company = await this.companiesRepository.createQueryBuilder().where(conditions.join(' OR '), values).getOne();
				if (company) {
					for (const field of uniqueFields) {
						if (company[field] == fields[field])
							return field;
					}
				}
			}

			return null;
		} catch (ex) {
			throw ex;
		}
	}

	async deleteCompany(id: number, options: { entityManager?: EntityManager, req?: FastifyRequest } = {}): Promise<any> {
		try {
			const repository = this.getCompanyRepository(options.entityManager);
			return await repository.createQueryBuilder().softDelete().where({ id }).execute();
		} catch (ex) {
			throw ex;

		}
	}

	async getCompanies(filters: ListCompanyDto): Promise<any[]> {
		try {
			const criteria = {};
			if (filters && Object.keys(filters).length) {
				for (const field in filters) {
					const value = filters[field];

					if (value !== null && value !== undefined && value !== '' && value !== 0)
						criteria[field] = value;
				}
			}

			const qb = this.companiesRepository.createQueryBuilder('company').select('company.*');

			for (const field in criteria) {
				const params = { [field]: criteria[field] };
				switch (field) {
					case 'id':
						if (!Array.isArray(params[field]))
							params[field] = [params[field]];

						qb.andWhere(`company.${field} = ANY(:${field})`, params);
						break;
					case 'name':
						params[field] = params[field].trim().toLowerCase();
						qb.andWhere(`LOWER(company.${field}) = :${field}`, params);
						break;
					default:
						break;
				}
			}

			const companies = await qb.getRawMany();

			// Fetch shop_ids for each company
			const result = await Promise.all(companies.map(async (company) => {
				const { password, ...rest } = company;
				const shop_ids = await this.companiesShopsService.getShopIdsByCompanyId(company.id);
				return { ...rest, shop_ids };
			}));

			return result;
		} catch (ex) {
			throw ex;
		}
	}
}
