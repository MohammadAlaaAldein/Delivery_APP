import Redis from 'ioredis';

export class CoreRedisService {

	redis: any;
	redisHost: string;
	redisPort: number;
	redisDb: number;
	redisReadHost: string;
	redisReadPort: number;
	redisOptions: any;
	reportErrorCallback: any;
	enableSingleRedisConnection: boolean;
	writeClient: any;
	readOnlyClient: any;
	shouldSaveCacheMiss = false;
	keyFieldCombineTag = '_#_';
	cacheMissTimeoutKey = 'CACHE_MISS_TIMEOUT';
	cacheMissTimeoutKeyTtl = 'CACHE_MISS_TIMEOUT_TTL';


	constructor(redisHost: string, redisPort: number, redisDb = 0, reportErrorCallback: any, rHost?: string, rPort?: number, enableSingleRedisConnection?: boolean) {

		this.redisOptions = {
			enableReadyCheck: false,
			maxRetriesPerRequest: 1,
			showFriendlyErrorStack: true,
			db: redisDb || 0,
		};
		this.redisHost = redisHost;
		this.redisPort = redisPort;
		this.redisDb = redisDb;
		this.redisReadHost = rHost || redisHost;
		this.redisReadPort = rPort || redisPort;
		this.reportErrorCallback = reportErrorCallback;
		this.enableSingleRedisConnection = enableSingleRedisConnection || false;
		this.shouldSaveCacheMissSub();
	}

	getRedisClient(operation = 'write') {
		if (this.enableSingleRedisConnection) {
			if (operation == 'write') {
				if (!this.writeClient)
					this.writeClient = this.newRedis(operation);
				return this.writeClient;
			}
			if (!this.readOnlyClient)
				this.readOnlyClient = this.newRedis(operation);
			return this.readOnlyClient;
		}
		return this.newRedis(operation);
	};

	getCacheMissKey(operation: string) {
		return `cache_miss_${operation}`;
	};

	async multi(commandsArr: any[][]) {
		return await this.multiFunc(commandsArr);
	}

	async set(key: string, data: any, ttl?: number, stringfy: boolean = false, ID: number | string = 0) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient();
			if (ID && ID != 0)
				key = key + '_' + ID;

			if (stringfy)
				data = JSON.stringify(data);

			if (ttl && ttl > 0) {
				await redisClient.setex(key, ttl, data);
			} else {
				await redisClient.set(key, data);
			}
			await this.redisClientQuit(redisClient);
			return;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::set key:' + key + " " + e);
		}
	}

	async get(key: string, ID: number | string = 0, parse: boolean = false) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient('read');
			if (ID && ID != 0)
				key = key + '_' + ID;

			let response = await redisClient.get(key);
			await this.redisClientQuit(redisClient);
			if (response && parse) {
				response = JSON.parse(response);
			}

			if (response == null)
				await this.saveCacheMiss('get', key);

			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			await this.reportRedisError(e, 'get', [key, ID, parse]);
			throw new Error('Redis::get key:' + key + " " + e);
		}
	}

	async exists(key: string) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient();
			const response = await redisClient.exists(key);
			await this.redisClientQuit(redisClient);
			return response;
		} catch (e) {
			if (redisClient)
				await this.redisClientQuit(redisClient);

			throw new Error('Redis::exists key:' + key + " " + e);
		}
	}

	async incr(key: string, ttl?: number, ID: number | string = 0) {
		try {
			if (ID && ID != 0)
				key = key + '_' + ID;

			var redisCommands = [
				['incr', key],
				['expire', key, ttl]
			];
			var response = await this.multiFunc(redisCommands);
			return response?.[0]?.[1] || null;
		} catch (e) {
			throw new Error('Redis::incr key:' + key + " " + e);
		}
	}

	async decr(key: string, ttl?: number, ID: number | string = 0) {
		try {
			if (ID && ID != 0)
				key = key + '_' + ID;

			var redisCommands = [
				['decr', key],
				['expire', key, ttl]
			];
			var response = await this.multiFunc(redisCommands);
			return response?.[0]?.[1] || null;
		} catch (e) {
			throw new Error('Redis::decr key:' + key + " " + e);
		}
	}

	async del(keys: string[]) {
		let redisClient = null;
		try {
			if (!keys.length || !keys[0].length) {
				let trace = ((new Error().stack)?.split("at ")[3])?.trim();
				await this.reportRedisError('redisBase.del', 'del', { keys, trace });
				return;
			}

			redisClient = this.getRedisClient();
			var response = await redisClient.del(keys);

			if (keys.length - response)
				await this.saveCacheMiss('del', keys.toString(), 'write', keys.length - response);

			await this.redisClientQuit(redisClient);
			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			if (!Array.isArray(keys))
				keys = [keys];
			throw new Error('Redis::del key:' + keys.join(', ') + " " + e);
		}
	}

	async mget(keys: string[], ID: number | string = 0, parse: boolean = false) {
		let redisClient = null;
		try {
			//Get unique ids only
			keys = keys.filter(function (item, i, ar) {
				return ar.indexOf(item) === i;
			});
			if (keys.length === 0)
				return [];
			var cacheKeys = keys;
			if (ID) {
				cacheKeys = [];
				for (var i = 0; i < keys.length; i++) {
					cacheKeys.push(keys[i] + "_" + ID);
				}
			}
			redisClient = this.getRedisClient('read');
			let response = await redisClient.mget(cacheKeys);
			await this.redisClientQuit(redisClient);

			for (let i = 0; i < keys.length; i++) {
				if (response[i] == null)
					await this.saveCacheMiss('mget', keys[i]);
				else if (parse)
					response[i] = JSON.parse(response[i]);
			}

			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			if (!Array.isArray(keys))
				keys = [keys];
			throw new Error('Redis::mget key:' + keys.join(', ') + " " + e);
		}
	}

	async mset(keys: string[], values: any[], ttl?: number, ID: number | string = 0) {
		if (keys.length != values.length || keys.length === 0) {
			throw new Error('mset: keys length (' + keys.length + ') and values length (' + values.length + ') are not equal!');
		}
		let redisClient = null;
		var combinedArr = [];
		var expireArr = [];
		var postFix = "";
		if (ID)
			postFix = '_' + ID;

		for (var i = 0; i < keys.length; i++) {
			var key = keys[i] + postFix;
			combinedArr.push(key);
			combinedArr.push(values[i]);

			if (ttl && ttl > 0)
				expireArr.push(['expire', key, ttl]);
		}

		try {
			var response;
			if (ttl && ttl > 0) {
				var redisCommands = [['mset', combinedArr]].concat(expireArr);
				response = await this.multi(redisCommands);

			} else {
				redisClient = this.getRedisClient();
				response = await redisClient.mset(combinedArr);
				await this.redisClientQuit(redisClient);
			}
			return response;
		} catch (e) {
			if (redisClient)
				await this.redisClientQuit(redisClient);
			throw new Error('Redis::mset key:' + keys.join('|') + " " + e);
		}
	}

	async hgetall(key: string, ID: number | string = 0) {
		let redisClient = null;
		if (ID != 0)
			key = key + '_' + ID;

		try {
			redisClient = this.getRedisClient('read');
			var response = await redisClient.hgetall(key);
			await this.redisClientQuit(redisClient);

			if (!Object.keys(response).length)
				await this.saveCacheMiss('hgetall', key);

			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::hgetall key:' + key + " ID: " + ID + " " + e);
		}
	}

	async hvals(key: string, ID: number | string = 0) {

		let redisClient = null;
		if (ID != 0)
			key = key + '_' + ID;

		try {
			redisClient = this.getRedisClient('read');
			var response = await redisClient.hvals(key);
			await this.redisClientQuit(redisClient);

			if (!response.length)
				await this.saveCacheMiss('hvals', key);

			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::hvals key:' + key + " ID: " + ID + " " + e);
		}
	}

	async keys(pattern: string) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient('read');
			var response = redisClient.keys(pattern);
			await this.redisClientQuit(redisClient);

			if (!response.length)
				await this.saveCacheMiss('keys', pattern);

			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::keys pattern:' + pattern + " " + e);
		}
	}

	async hkeys(key: string, ID: number | string = 0) {

		let redisClient = null;
		if (ID != 0)
			key = key + '_' + ID;

		try {
			redisClient = this.getRedisClient('read');
			var response = redisClient.hkeys(key);
			await this.redisClientQuit(redisClient);

			if (!response.length)
				await this.saveCacheMiss('hkeys', key);

			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::hkeys key:' + key + " ID: " + ID + " " + e);
		}
	}

	async hget(key: string, field: string, ID: number | string = 0, parseJson: boolean = false) {
		let redisClient = null;

		try {
			if (ID != 0)
				key = key + '_' + ID;

			redisClient = this.getRedisClient('read');
			var response = await redisClient.hget(key, field);
			if (response && parseJson)
				response = JSON.parse(response);

			await this.redisClientQuit(redisClient);

			if (response == null)
				await this.saveCacheMiss('hget', `${key}${this.keyFieldCombineTag}${field}`);

			return response;
		} catch (e) {
			if (redisClient)
				await this.redisClientQuit(redisClient);

			throw new Error('Redis::hget key:' + key + " ID: " + ID + " " + e);
		}
	}

	async hset(key: string, field: string | string[], value: any, ttl?: number, stringify: boolean = false, ID: number | string = 0) {

		if (Array.isArray(field) && Array.isArray(value) && (field.length != value.length || field.length == 0))
			throw new Error('hset: keys length (' + field.length + ') and values length (' + value.length + ') are not equal! or empty, ' + key);

		if (!Array.isArray(field) && !Array.isArray(value)) {
			field = [field];
			value = [value];
		}

		try {
			if (ID != 0) {
				key = key + '_' + ID;
			}
			let combinedArr = [];

			for (let i = 0; i < field.length; i++) {
				combinedArr.push(field[i]);
				if (stringify)
					combinedArr.push(JSON.stringify(value[i]));
				else
					combinedArr.push(value[i]);
			}

			var redisCommands: any[][] = [
				['hset', key].concat(combinedArr),
			];

			if (ttl && ttl > 0)
				redisCommands.push(['expire', key, ttl]);

			let response = await this.multiFunc(redisCommands);
			return response?.[0]?.[1] || null;
		} catch (e) {

			throw new Error('Redis::hset key:' + key + " ID: " + ID + " " + e);
		}
	}

	async hmget(key: string, field: string[], ID: number | string = 0, parseJson: boolean = false) {
		if (ID != 0) {
			key = key + '_' + ID;
		}
		let redisClient = null;
		try {
			redisClient = this.getRedisClient('read');
			var response: any = await redisClient.hmget(key, field);
			await this.redisClientQuit(redisClient);

			if (response[0] == null)
				await this.saveCacheMiss('hmget', `${key}${this.keyFieldCombineTag}${field}`);

			if (parseJson) {
				var parsedResponse = [];
				for (var i in response) {
					if (response[i])
						parsedResponse.push(JSON.parse(response[i]));
					else
						parsedResponse.push(null);
				}
				response = parsedResponse;
			}
			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			await this.reportRedisError(e, 'hmget', [key, response]);
			throw new Error('Redis::hset key:' + key + " ID: " + ID + " " + e);
		}
	}

	async hincrby(hashKey: string, key: string, incrBy: number) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient();
			var response = await redisClient.hincrby(hashKey, key, incrBy);
			await this.redisClientQuit(redisClient);
			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::hincrby hashKey:' + hashKey + " key: " + key + " incrBy" + incrBy + " " + e);
		}
	}

	async hdel(key: string, field: string | string[], ID: number | string = 0) {
		if (ID != 0) {
			key = key + '_' + ID;
		}
		let redisClient = null;
		try {
			redisClient = this.getRedisClient();
			var response = await redisClient.hdel(key, field);
			await this.redisClientQuit(redisClient);

			if (!response)
				await this.saveCacheMiss('hdel', `${key}${this.keyFieldCombineTag}{field}`, 'write');

			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::hdel key:' + key + " field: " + field + " ID" + ID + " " + e);
		}
	}

	async zadd(hashKey: string, scores: number[] | string[], values: any[], ttl?: number, ID: number | string = 0) {
		try {
			if (scores.length != values.length || scores.length == 0) {
				throw new Error('zadd: scores length (' + scores.length + ') and values length (' + values.length + ') are not equal!');
			}
			let combinedArr: any[] = [];
			if (ID != 0)
				hashKey += '_' + ID;

			for (let i = 0; i < scores.length; i++) {
				combinedArr.push(scores[i]);
				combinedArr.push(JSON.stringify(values[i]));
			}

			var redisCommands: any[][] = [
				['zadd', hashKey].concat(combinedArr),
			];

			if (ttl && ttl > 0)
				redisCommands.push(['expire', hashKey, ttl]);

			let response = await this.multiFunc(redisCommands);
			return response?.[0]?.[1] || null;
		} catch (e) {
			throw new Error('Redis::zadd key: ' + hashKey + " scores: " + scores + " values: " + values + " ID: " + ID + " ttl: " + ttl + " " + e);
		}
	}

	async zremrangebyscore(hashKey: string, minScore: number, maxScore: number, ID: number | string = 0) {
		if (ID != 0) {
			hashKey += '_' + ID;
		}
		let redisClient = null;
		try {
			redisClient = this.getRedisClient();
			var response = await redisClient.zremrangebyscore(hashKey, minScore, maxScore);
			await this.redisClientQuit(redisClient);

			if (!response)
				await this.saveCacheMiss('zremrangebyscore', `${hashKey}`, 'write');

			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::zremrangebyscore params:' + hashKey + minScore + maxScore + ID + " " + e);
		}
	}

	async bzpopmin(keys: string, timeout: number) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient();
			var response = await redisClient.bzpopmin(keys, timeout);

			if (!response)
				await this.saveCacheMiss('bzpopmin', keys.toString());

			await this.redisClientQuit(redisClient);
			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::bzpopmin keys:' + keys + " timeout: " + timeout + " " + e);
		}
	}

	async zrembyscores(key: string, scores: number[], ID: number | string = 0) {
		try {
			if (ID != 0)
				key += '_' + ID;

			let redisCommands: any[][] = [];

			scores.forEach((score) => {
				redisCommands.push(['zremrangebyscore', key, score, score]);
			});

			let response = await this.multiFunc(redisCommands);
			return response;
		} catch (e) {
			throw new Error('Redis::zrembyscores key: ' + key + " ID: " + ID + " scores: " + scores + " " + e);
		}
	}

	async zrange(key: string, min: number | string, max: number | string, options: any = {}, ID: number | string = 0) {
		// options are: withScores, parseJson, outputToJson
		if (ID != 0) {
			key += '_' + ID;
		}
		var response;
		let redisClient = null;
		try {
			redisClient = this.getRedisClient('read');
			if (options.withScores) {
				response = await redisClient.zrangebyscore(key, min, max, 'WITHSCORES');
			} else {
				response = await redisClient.zrangebyscore(key, min, max);
			}

			// if (options.withScores) {
			// 	response = await redisClient.zrange(key, min, max, 'byscore', 'withscores');
			// } else {
			// 	response = await redisClient.zrange(key, min, max, 'byscore');
			// }

			await this.redisClientQuit(redisClient);

			if (!response.length)
				await this.saveCacheMiss('zrange', key);

			if (options.parseJson) {
				response.forEach(function (item: any, i: number) {
					response[i] = JSON.parse(item);
				});
			}
			if (options.outputToJson) {
				var output: any = {};
				var previousValue = "";
				for (let key in response) {
					if (previousValue != "") {
						output[response[key]] = previousValue;
						previousValue = "";
						continue;
					}
					previousValue = response[key];
				}
				response = output;
			}
			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::zrangebyscore params:' + 'key=' + key + 'ID=' + ID + " " + e);
		}
	}

	async expire(key: string, ttl: number) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient();
			var response = await redisClient.expire(key, ttl);
			await this.redisClientQuit(redisClient);

			if (!response)
				await this.saveCacheMiss('expire', key, 'write');

			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::expire params:' + 'key=' + key + 'ttl=' + ttl + " " + e);
		}
	}

	async ttl(key: string) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient('read');
			var response = await redisClient.ttl(key);
			await this.redisClientQuit(redisClient);

			if (response == -2)
				await this.saveCacheMiss('ttl', key);

			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::expire key:' + key + " " + e);
		}
	}

	async setWithoutAffectingTTL(key: string, data: any, options: any = {}) {
		let redisClient = null;
		var ttl = options.defaultTtl || (1 * 24 * 60 * 60);
		try {
			if (options.stringify)
				data = JSON.stringify(data);

			redisClient = this.getRedisClient();
			var response = await redisClient.eval("local ttl = redis.call('ttl', ARGV[1]) if ttl > 0 then return redis.call('SETEX', ARGV[1], ttl, ARGV[2]) else  return redis.call('SETEX', ARGV[1], ARGV[3], ARGV[2]) end", 0, key, data, ttl);
			await this.redisClientQuit(redisClient);
			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::setWithoutAffectingTTL key=' + key + " " + e);
		}
	}

	async rpush(key: string, value: any) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient();
			var response = await redisClient.rpush(key, value);
			await this.redisClientQuit(redisClient);
			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::rpush key=' + key + " " + e);
		}
	}

	async lrem(key: string, count: number, elements: (string | number)[]) {
		try {
			let redisCommands: any[][] = [];

			elements.forEach((element) => {
				redisCommands.push(['lrem', key, count, element]);
			});

			let response = await this.multiFunc(redisCommands);
			return response;
		} catch (e) {
			throw new Error('Redis::lrem key: ' + key + " count: " + count + " elements: " + elements + " " + e);
		}
	}

	async lrange(key: string, start: number, stop: number) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient('read');
			var response = await redisClient.lrange(key, start, stop);
			await this.redisClientQuit(redisClient);

			if (!response.length)
				await this.saveCacheMiss('lrange', key);

			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::lrange key:' + key + " " + start + " " + stop + " " + e);
		}
	}

	async lpop(key: string, count: number = 1) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient();
			if (count < 1)
				count = 1;
			var response = await redisClient.lpop(key, count);
			await this.redisClientQuit(redisClient);

			if (!response)
				await this.saveCacheMiss('lpop', key);

			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::lpop key=:' + key + " " + e);
		}
	}

	async llen(key: string) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient('read');
			var response = await redisClient.llen(key);
			if (!response)
				await this.saveCacheMiss('llen', key);
			await this.redisClientQuit(redisClient);
			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::llen key:' + key + " " + e);
		}
	}

	async sadd(key: string, value: any) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient();
			var response = await redisClient.sadd(key, value);
			await this.redisClientQuit(redisClient);

			if (!response)
				await this.saveCacheMiss('sadd', key, 'write');
			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::sadd key=' + key + " " + e);
		}
	}

	async pub(key: string, data: any) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient();
			const response = await redisClient.publish(key, data);
			await this.redisClientQuit(redisClient);
			return response;
		} catch (err) {
			if (redisClient)
				await this.redisClientQuit(redisClient);
			throw new Error('Redis::pub key:' + key + ' ' + err);
		}
	}

	async sub(key: string) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient();
			redisClient.subscribe(key);
			return redisClient;
		} catch (err) {
			if (redisClient)
				await this.redisClientQuit(redisClient);
			throw new Error('Redis::sub key:' + key + ' ' + err);
		}
	}

	async smembers(key: string) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient('read');
			var response = await redisClient.smembers(key);
			await this.redisClientQuit(redisClient);

			if (!response)
				await this.saveCacheMiss('smembers', key);

			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::smembers key=' + key + " " + e);
		}
	}

	async srem(key: string, value: any) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient();
			var response = await redisClient.srem(key, value);
			await this.redisClientQuit(redisClient);

			if (!response)
				await this.saveCacheMiss('srem', key, 'write');

			return response;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			throw new Error('Redis::srem key=' + key + " " + e);
		}
	}

	async closeClient() {
		try {
			if (this.enableSingleRedisConnection) {
				if (this.writeClient && (this.writeClient.status == 'ready' || this.writeClient.status == 'connect')) {
					await this.writeClient.quit();
					this.writeClient = null;
				}
				if (this.readOnlyClient && (this.readOnlyClient.status == 'ready' || this.readOnlyClient.status == 'connect')) {
					await this.readOnlyClient.quit();
					this.readOnlyClient = null;
				}
			}
		} catch (e) {
			throw new Error('Redis::redisClientQuit ' + e);
		}
	}

	async setSaveCacheMissTimeout(timeout: number) {
		try {
			await this.pub(this.cacheMissTimeoutKey, timeout);
			await this.set(this.cacheMissTimeoutKeyTtl, timeout, timeout);
			return {};
		} catch (err) {
			throw new Error('Redis::setSaveCacheMissTimeout ' + err);
		}
	};

	async getSaveCacheMissTimeout() {
		try {
			return await this.ttl(this.cacheMissTimeoutKeyTtl);
		} catch (err) {
			throw new Error('Redis::getSaveCacheMissTimeout ' + err);
		}
	};

	/****************************************************************************************** */

	private async redisClientQuit(redisClient: any) {
		try {
			if (!this.enableSingleRedisConnection && redisClient)
				await redisClient.quit(redisClient);
		} catch (e) {
			throw new Error('Redis::redisClientQuit ' + e);
		}
	};

	private newRedis(operation = 'write') {
		if (operation == 'read')
			return new Redis(this.redisReadPort, this.redisReadHost, this.redisOptions);
		return new Redis(this.redisPort, this.redisHost, this.redisOptions);
	}

	private async saveCacheMiss(command: string, key: string | number, operation = 'read', incr = 1) {
		try {
			// Redis Miss Commands: ['get', 'mget', 'hgetall', 'hvals', 'hkeys', 'hget', 'hmget', 'zrange', 'ttl', 'lrange', 'llen'];
			if (!this.shouldSaveCacheMiss)
				return;
			const missKey = this.getCacheMissKey(operation);
			const redisClient = this.getRedisClient();
			await redisClient.zincrby(missKey, incr, `${command}${this.keyFieldCombineTag}${key}`);
			redisClient.expire(missKey, 7 * 86400);
			await this.redisClientQuit(redisClient);
		} catch (err) {
			throw new Error('Redis::saveCacheMiss ' + err);
		}
	};

	private async shouldSaveCacheMissSub() {
		try {
			const subscription = await this.sub(this.cacheMissTimeoutKey);
			subscription.on('message', async (timeout: number) => {
				timeout = +timeout;
				if (!timeout) {
					this.shouldSaveCacheMiss = false;
					return {};
				}
				this.shouldSaveCacheMiss = true;
				setTimeout(() => {
					this.shouldSaveCacheMiss = false;
				}, timeout * 1000);
			});
		} catch (err) {
			throw new Error('Redis::shouldSaveCacheMissSub ' + err);
		}
	};

	private async multiFunc(commandsArr: any[][]) {
		let redisClient = null;
		try {
			redisClient = this.getRedisClient();
			let replies = await redisClient.multi(commandsArr).exec();
			await this.redisClientQuit(redisClient);
			for (let i = 0; i < commandsArr.length; i++) {
				if (Array.isArray(commandsArr[i][1]))
					continue;

				if (!replies[i][1])
					await this.saveCacheMiss('multiFunc', `${commandsArr[i][0]}${this.keyFieldCombineTag}${commandsArr[i][1]}`, 'write');
			}
			return replies;
		} catch (e) {
			if (redisClient) {
				await this.redisClientQuit(redisClient);
			}
			await this.reportRedisError(e, 'multi', commandsArr);
			throw new Error('Redis::multiFunc ' + commandsArr.join(',') + " " + e);
		}
	};

	private async reportRedisError(err: unknown | Error, cmd: string, args: object | any[]) {
		if (this.reportErrorCallback) {
			this.reportErrorCallback(err, cmd, args);
		}
	};
}