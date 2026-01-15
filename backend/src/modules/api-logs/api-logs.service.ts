import { Injectable } from '@nestjs/common';
import { CreateApiLogDto } from './dto/create-api-log.dto';
import { UpdateApiLogDto } from './dto/update-api-log.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiLog } from './entities/api-log.entity';
import { Repository } from 'typeorm';
import { ListApiLogsDto } from './dto/list-logs.dto';

@Injectable()
export class ApiLogsService {
	constructor(
		@InjectRepository(ApiLog)
		private readonly apiLogsRepository: Repository<ApiLog>,
	) { }

	async saveRequestDetails(createApiLogDto: CreateApiLogDto) {
		try {
			const log = this.apiLogsRepository.create(createApiLogDto);
			return await this.apiLogsRepository.save(log);
		} catch (ex) {
			throw ex;
		}
	}

	async getLogs(filters: ListApiLogsDto) {
			try {
			const criteria = {};
			if (filters && Object.keys(filters).length > 0) {
				for (const field in filters) {
					const value = filters[field];
					if (value !== null && value !== undefined && value !== '' && value !== 0)
						criteria[field] = value;
				}
			}

			const qb = this.apiLogsRepository.createQueryBuilder().select('*');

			for (const field in criteria) {
				const params = { [field]: criteria[field] };
				switch (field) {
					case 'end_point':
						params[field] = `${params[field].trim().toLowerCase()}%`;
						qb.andWhere(`LOWER(${field}) ILIKE :${field}`, { [field]: params[field] });
						break;
					case 'user_id':
						qb.andWhere(`${field} = :${field}`, params);
						break;
					default:
						break;
				}
			}

			const result = await qb.getRawMany();
			return result.map(({ updated_at, deleted_at, ...rest }) => rest);
		} catch (ex) {
			throw ex;
		}	
	}
}
