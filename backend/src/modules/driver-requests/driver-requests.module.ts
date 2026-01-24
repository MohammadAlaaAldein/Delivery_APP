import { forwardRef, Module } from '@nestjs/common';
import { DriverRequestsService } from './driver-requests.service';
import { DriverRequestsController } from './driver-requests.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverRequest } from './entities/driver-request.entity';
import { UsersModule } from '../users/users.module';
import { DriversModule } from '../drivers/drivers.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([DriverRequest]),
        forwardRef(() => UsersModule),
        DriversModule,
    ],
    controllers: [DriverRequestsController],
    providers: [DriverRequestsService],
    exports: [DriverRequestsService],
})
export class DriverRequestsModule { }
