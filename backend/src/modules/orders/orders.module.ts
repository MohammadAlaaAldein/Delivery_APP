import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderHistory } from './entities/order-history.entity';
import { CompaniesShopsModule } from '../companies-shops/companies-shops.module';
import { DriversModule } from '../drivers/drivers.module';
import { OrdersGateway } from './orders.gateway';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderHistory]),
        CompaniesShopsModule,
        DriversModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService, OrdersGateway],
    exports: [OrdersService, OrdersGateway],
})
export class OrdersModule { }
