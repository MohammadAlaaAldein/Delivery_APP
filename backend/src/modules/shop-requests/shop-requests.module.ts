import { Module } from '@nestjs/common';
import { ShopRequestsService } from './shop-requests.service';
import { ShopRequestsController } from './shop-requests.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopRequest } from './entities/shop-request.entity';
import { ShopsModule } from '../shops/shops.module';
import { CompaniesShopsModule } from '../companies-shops/companies-shops.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ShopRequest]),
        ShopsModule,
        CompaniesShopsModule,
    ],
    controllers: [ShopRequestsController],
    providers: [ShopRequestsService],
    exports: [ShopRequestsService],
})
export class ShopRequestsModule { }
