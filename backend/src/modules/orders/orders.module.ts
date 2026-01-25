import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderHistory } from './entities/order-history.entity';
import { CompaniesShopsModule } from '../companies-shops/companies-shops.module';
import { DriversModule } from '../drivers/drivers.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderHistory]),
        CompaniesShopsModule,
        DriversModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule { }
