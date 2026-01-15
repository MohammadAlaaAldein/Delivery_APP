import { Injectable } from '@nestjs/common';
import { CoreRedisService } from "./core-redis.service";
import Redis from 'ioredis';
import { EntityManager, In, Repository } from 'typeorm';
import _ from 'lodash';

@Injectable()
export class RedisService extends CoreRedisService {
	readonly allCachesTTL: number = 1 * 86400; // 1 day

	/**
	 * Creates a new Redis client for the specified operation.
	 *
	 * @param {string} operation - The operation for which the Redis client is needed.
	 *
	 * @returns {Redis} - Returns a new Redis client instance.
	 *
	 * @throws {CustomError} - Throws a custom error if an exception occurs during the operation.
	 */
	newRedisClient(operation: string): Redis {
		try {
			return this.getRedisClient(operation);
		} catch (ex) {
			throw ex;
		}
	}

	async getCachedInfo<T>(
		ids: any[],
		cacheKey: string,
		repository: Repository<T>,
		options?: {
			ignoreDeleted?: boolean,
			isDeletedColumn?: string,
			asyncBeforeCaching?: any,
			doBeforeCaching?: any,
			cacheTTL?: number,
			multipleValues?: boolean,
			idColumn?: string,
			getById?: string,
			select?: string,
			entityManager?: EntityManager,
			hash?: boolean
		}
	) {
		try {
			options = options || {};
			const ignoreDeleted = ('ignoreDeleted' in options) ? options.ignoreDeleted : true;
			const cacheTTL = options.cacheTTL || this.allCachesTTL;
			const doBeforeCaching = options.doBeforeCaching;
			const asyncBeforeCaching = options.asyncBeforeCaching;
			const idColumn = options.idColumn || 'id';
			const select = options.select || '*';

			// Filter duplicate and zero values
			ids = _.chain(ids).uniq().filter(Boolean).value();

			let cacheKeys = [];
			for (let i = 0; i < ids.length; i++) {
				cacheKeys.push(`${cacheKey}_${ids[i]}`);
			}

			// first get from cache
			const cached = [];
			const notCached = [];
			let response = [];
			if (options.hash) {
				for (const key of cacheKeys) {
					const hResponse = await this.hgetall(key);
					for (const field in hResponse) {
						hResponse[field] = JSON.parse(hResponse[field]);
					}
					const cacheRes = Object.keys(hResponse).length ? hResponse : null;
					response.push(cacheRes)
				}
			} else {
				response = await this.mget(cacheKeys);
			}

			for (let i = 0; i < ids.length; i++) {
				const currId = ids[i];
				if (response[i]) {
					const currObject = options.hash ? response[i] : JSON.parse(response[i]);
					cached.push(currObject);
				} else {
					notCached.push(currId);
				}
			}

			if (!notCached.length)
				return cached;

			const qb = repository.createQueryBuilder().select(select);
			if (options.getById)
				qb.where({ [options.getById]: In(notCached) });
			else
				qb.whereInIds(notCached);

			if (!ignoreDeleted)
				qb.withDeleted();

			const toCacheValues = await qb.getRawMany();
			if (toCacheValues.length != notCached.length && !ignoreDeleted) {
				// TODO: add error log
			}

			if (!toCacheValues.length)
				return cached;

			let asyncBeforeCachingRes = null;
			if (asyncBeforeCaching)
				asyncBeforeCachingRes = await asyncBeforeCaching(toCacheValues, options.entityManager);

			let dataToReturn: any = toCacheValues.concat(cached);

			cacheKeys = [];
			let values = [];
			let fields = [];

			if (options.multipleValues) {
				// Not tested with options.hash

				const existsKeys = [];
				const tempToCacheValues = {};
				for (const item in toCacheValues) {
					if (!existsKeys.includes(toCacheValues[item][idColumn])) {
						existsKeys.push(toCacheValues[item][idColumn]);
						tempToCacheValues[toCacheValues[item][idColumn]] = [];
					}
					tempToCacheValues[toCacheValues[item][idColumn]].push(toCacheValues[item]);
				}

				for (const id in tempToCacheValues) {
					const object = tempToCacheValues[id];
					if (doBeforeCaching)
						doBeforeCaching(object, asyncBeforeCachingRes);

					cacheKeys.push(cacheKey + '_' + id);
					values.push(JSON.stringify(object));
				}

				dataToReturn = Object.values(tempToCacheValues).concat(cached);
			} else {
				for (let i = 0; i < toCacheValues.length; i++) {
					const object = toCacheValues[i];

					if (options.hash) {
						values = [];
						fields = [];
					}

					if (doBeforeCaching)
						doBeforeCaching(object, asyncBeforeCachingRes);

					const itemCacheKey = `${cacheKey}_${object[idColumn]}`;
					if (!options.hash) {
						cacheKeys.push(itemCacheKey);
						values.push(JSON.stringify(object));
						continue;
					}

					for (const field of Object.keys(object)) {
						fields.push(field);
						values.push(JSON.stringify(object[field]));
					}

					await this.hset(itemCacheKey, fields, values, cacheTTL);
				}
			}
			if (!options.hash)
				await this.mset(cacheKeys, values, cacheTTL);

			return dataToReturn;
		} catch (ex) {
			throw ex;
		}
	}
}