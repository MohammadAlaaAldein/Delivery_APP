import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { registerAs } from '@nestjs/config';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

// Load environment variables from .env file
dotenv.config();

const dataSourceOptions: DataSourceOptions = {
	type: "postgres",
	host: process.env.DATABASE_HOST,
	port: +process.env.DATABASE_PORT,
	database: process.env.DATABASE_NAME,
	username: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	entities: [__dirname + '/../**/*.entity.{js,ts}'],
	migrations: ['dist/database/migrations/**/*.js'],
	synchronize: false,
	logging: false,
}

export const typeOrmConfig: TypeOrmModuleOptions = {
	...dataSourceOptions,
	retryAttempts: +process.env.DATABASE_RETRY_ATTEMPTS
}

export const dataSource = new DataSource(dataSourceOptions);

export default registerAs('dbConfig', (): PostgresConnectionOptions => (dataSourceOptions));