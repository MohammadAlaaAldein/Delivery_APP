import consoleStamp from 'console-stamp';
consoleStamp(console, { format: ':date(mm/dd/yy HH:MM:ss) :label' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { RedisService } from './modules/redis/redis.service';
import Redis from 'ioredis';
import fastifyRedis from '@fastify/redis';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import { getGitBranchInfo } from './common/utilities';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

async function bootstrap() {
	// Sentry.init({
	// 	dsn: process.env.SENTRY_DSN,
	// 	environment: process.env.SERVER,
	// 	integrations: [
	// 		// Add our Profiling integration
	// 		nodeProfilingIntegration(),
	// 	],
	// 	tracesSampleRate: +process.env.SENTRY_TRACES_SAMPLE_RATE,
	// 	profilesSampleRate: +process.env.SENTRY_PROFILES_SAMPLE_RATE,
	// });

	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter({
			bodyLimit: 50 * 1024 * 1024, // 50MB,
		}),
	);

	// Enable CORS using Fastify plugin
	await app.register(cors as any, {
		origin: true, // Allow all origins in development
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
		credentials: true,
		preflight: true,
		preflightContinue: false,
	});

	ServeStaticModule.forRoot({
		rootPath: join(__dirname, '..', '..', '..', 'frontend', 'dist'),
		serveRoot: '/',
	});

	// Enable validation globally
	app.useGlobalPipes(new ValidationPipe({ transform: true }));

	const redis = app.get(RedisService);
	const redisClient: Redis = redis.newRedisClient('write');

	app.register(fastifyRedis as any, { client: redisClient });

	// Removed Cookie and Session plugins - using JWT only now

	await app.register(multipart as any, {
		limits: {
			fileSize: 20 * 1024 * 1024, // 20MB
		}
	});

	await getGitBranchInfo();

	app.enableVersioning({
		type: VersioningType.CUSTOM,
		defaultVersion: '1',
		extractor: (req: any) => {
			const url = req.url || '';

			// Split URL and filter empty parts
			const parts = url.split('/').filter(Boolean);

			// Look for version segment in different positions:
			// /api/v1/auth/login -> parts: ['api', 'v1', 'auth', 'login'] 
			// /api/auth/login -> parts: ['api', 'auth', 'login']

			let version = '1';

			// Check second part (covers /api/v1/...)
			if (parts[1]?.match(/^v\d+$/))
				version = parts[1].replace(/^v/, '');

			return version;
		}
	});

	console.log(`Node version: ${process.version}`);
	await app.listen(process.env.NEST_PORT, '0.0.0.0');
}

bootstrap();
