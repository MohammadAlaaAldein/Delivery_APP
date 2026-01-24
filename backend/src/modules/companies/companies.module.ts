import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompaniesShopsModule } from '../companies-shops/companies-shops.module';
import { DriversModule } from '../drivers/drivers.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Company]),
		CompaniesShopsModule,
		DriversModule,
	],
	controllers: [CompaniesController],
	providers: [CompaniesService],
	exports: [CompaniesService],
})
export class CompaniesModule { }