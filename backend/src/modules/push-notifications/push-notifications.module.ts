import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushNotificationsController } from './push-notifications.controller';
import { PushNotificationsService } from './push-notifications.service';
import { DeviceToken } from './entities/device-token.entity';
import { NotificationLog } from './entities/notification-log.entity';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([DeviceToken, NotificationLog])],
    controllers: [PushNotificationsController],
    providers: [PushNotificationsService],
    exports: [PushNotificationsService],
})
export class PushNotificationsModule { }
