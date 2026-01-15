import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm/entity-manager/EntityManager';
import { Repository } from 'typeorm/repository/Repository';
import { Shop } from './entities/shop.entity';
import { DataSource } from 'typeorm';
import { CreateShopDto } from './dto/create-shop.dto';
import { FastifyRequest } from 'fastify';

@Injectable()
export class ShopsService {

	constructor(
		private connection: DataSource,
		private readonly shopsRepository: Repository<Shop>,
	) { }

	private getShopRepository(entityManager?: EntityManager): Repository<Shop> {
		return entityManager ? entityManager.getRepository(Shop) : this.connection.getRepository(Shop);
	}

	async create(createShopDto: CreateShopDto): Promise<any> {
		try {
			const shop = this.shopsRepository.create(createShopDto);
			return await this.shopsRepository.save(shop);
		} catch (ex) {
			throw ex;
		}
	}
}
