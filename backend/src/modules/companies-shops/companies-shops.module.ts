import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyShop } from './company-shop.entity';
import { CompaniesShopsService } from './companies-shops.service';
import { Shop } from '../shops/entities/shop.entity';
import { Company } from '../companies/entities/company.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([CompanyShop, Shop, Company]),
	],
	providers: [CompaniesShopsService],
	exports: [CompaniesShopsService, TypeOrmModule],
})
export class CompaniesShopsModule { }
