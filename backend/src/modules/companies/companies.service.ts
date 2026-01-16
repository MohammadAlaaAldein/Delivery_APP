import { Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { FastifyRequest } from 'fastify';
import { ErrorKeys } from 'src/common/api-response';
import { ListCompanyDto } from './dto/list-companies.dto';

@Injectable()
export class CompaniesService {

	constructor(
		@InjectRepository(Company)
		private readonly companiesRepository: Repository<Company>,
		private connection: DataSource,
	) { }

	private getCompanyRepository(entityManager?: EntityManager): Repository<Company> {
		return entityManager ? entityManager.getRepository(Company) : this.connection.getRepository(Company);
	}

	async create(createCompanyDto: CreateCompanyDto, options?: { req?: FastifyRequest }): Promise<any> {
		try {
			const company = this.companiesRepository.create(createCompanyDto);

			const uniqueFieldFound = await this.checkCompanyUniqueFields(createCompanyDto);
			if (uniqueFieldFound)
				return this.checkCompanyUniqueFieldsError(uniqueFieldFound);

			await this.companiesRepository.save(company);
			const { ...result } = company;

			return result;
		} catch (ex) {
			throw ex;
		}
	}

	async update(id: number, fields: UpdateCompanyDto, options?: { req?: FastifyRequest }): Promise<any> {
		try {
			const allowedFields = [
				'name',
			];

			const company = (await this.getCompanies({ id }))[0];

			// Check uniqueness
			const uniqueFieldFound = await this.checkCompanyUniqueFields(fields, company);
			if (uniqueFieldFound)
				return this.checkCompanyUniqueFieldsError(uniqueFieldFound);

			const updateFields: UpdateCompanyDto = {};

			for (const field in fields) {
				if (allowedFields.includes(field))
					updateFields[field] = fields[field];
			}

			if (!Object.keys(updateFields).length)
				return { err: 'no_changes', res: null };

			await this.companiesRepository.createQueryBuilder().update().set(updateFields).where('id = :id', { id }).execute();

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

	async getCompanies(filters: ListCompanyDto): Promise<Company[]> {
		try {
			const criteria = {};
			if (filters && Object.keys(filters).length) {
				for (const field in filters) {
					const value = filters[field];

					if (value !== null && value !== undefined && value !== '' && value !== 0)
						criteria[field] = value;
				}
			}

			const qb = this.companiesRepository.createQueryBuilder().select('*');

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
