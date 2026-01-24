import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './modules/redis/redis.module';
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from '@nestjs/config';
import { typeOrmConfig } from './config/data-source';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { SentryModule } from "@sentry/nestjs/setup";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { HttpExceptionFilter } from './http-exception/http-exception.filter';
import { SentryGlobalFilter } from "@sentry/nestjs/setup";
import { ScheduleModule } from './modules/schedule/schedule.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ApiLogsInterceptor } from './modules/api-logs/api-logs.interceptor';
import { ApiLogsModule } from './modules/api-logs/api-logs.module';
import { MailersModule } from './modules/mailers/mailers.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ActionLogModule } from './modules/action-log/action-log.module';
import { MainRouteController } from './main-route/main-route.controller';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { ShopsModule } from './modules/shops/shops.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { ShopRequestsModule } from './modules/shop-requests/shop-requests.module';
import { DriverRequestsModule } from './modules/driver-requests/driver-requests.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: ['.env'],
			cache: true,
		}),
		TypeOrmModule.forRoot(typeOrmConfig),
		TypeOrmModule.forFeature([]),
		RedisModule.forRoot({
			readHost: process.env.REDIS_HOST || process.env.REDIS_WRITE_HOST,
			readPort: +process.env.REDIS_PORT || +process.env.REDIS_WRITE_PORT,
			db: +process.env.REDIS_DB,
			enableSingleRedisConnection: !!+process.env.REDIS_SINGLE_CONNECTION || false,
			writeHost: process.env.REDIS_WRITE_HOST,
			writePort: +process.env.REDIS_WRITE_PORT,
		}),
		EventEmitterModule.forRoot(),
		UsersModule,
		ShopsModule,
		CompaniesModule,
		DriversModule,
		ShopRequestsModule,
		DriverRequestsModule,
		AuthModule,
		// ActionLogModule,
		// SentryModule.forRoot(),
		// ScheduleModule,
		ServeStaticModule.forRoot({
			rootPath: join(__dirname, '..', '..', 'frontend', 'dist'),
			serveRoot: '/',
		}),
		// ApiLogsModule,
		// MailersModule,
		// MailerModule.forRoot({
		// 	transport: {
		// 		host: process.env.MAILER_HOST,
		// 		port: process.env.MAILER_PORT,
		// 		ignoreTLS: true
		// 	},
		// 	defaults: {
		// 		from: `"Delivery APP" mohammad.aladin996@gmail.com`,
		// 	},
		// 	template: {
		// 		adapter: new EjsAdapter(),
		// 	},
		// }),
		// AttachmentsModule,
	],
	controllers: [AppController, MainRouteController],
	providers: [
		AppService,
		// {
		// 	provide: APP_FILTER,
		// 	useClass: SentryGlobalFilter,
		// },
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter,
		},
		// {
		// 	provide: APP_INTERCEPTOR,
		// 	useClass: ApiLogsInterceptor,
		// },
	],
})
export class AppModule { }
