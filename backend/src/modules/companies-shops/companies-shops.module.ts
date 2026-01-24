import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyShop } from './company-shop.entity';
import { CompaniesShopsService } from './companies-shops.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([CompanyShop]),
	],
	providers: [CompaniesShopsService],
	exports: [CompaniesShopsService, TypeOrmModule],
})
export class CompaniesShopsModule { }
