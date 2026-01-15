import { DynamicModule, Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { NodeCacheService } from './node-cache.service';

@Global()
@Module({})
export class RedisModule {
	static forRoot(config: {
		readHost: string;
		readPort: number;
		db: number;
		enableSingleRedisConnection?: boolean;
		writeHost?: string;
		writePort?: number;
	}): DynamicModule {
		return {
			module: RedisModule,
			providers: [
				{
					provide: RedisService,
					useFactory: () => {
						return new RedisService(
							config.writeHost,
							config.writePort,
							config.db || 0,
							null,
							config.readHost || config.writeHost,
							config.readPort || config.writePort,
							config.enableSingleRedisConnection || false
						);
					},
				},
				{
					provide: NodeCacheService,
					useFactory() {
						return new NodeCacheService();
					},
				},
			],
			exports: [RedisService, NodeCacheService],
		};
	}
}

