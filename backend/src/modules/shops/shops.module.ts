import { Module } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { ShopsController } from './shops.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from './entities/shop.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Shop,
		]),
	],
	controllers: [ShopsController],
	providers: [ShopsService],
	exports: [ShopsService],
})
export class ShopsModule { }