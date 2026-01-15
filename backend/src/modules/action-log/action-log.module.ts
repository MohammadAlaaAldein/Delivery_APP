import { Module } from '@nestjs/common';
import { ActionLogService } from './action-log.service';
import { ActionLogController } from './action-log.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionLog } from './entities/action-log.entity';
import { UsersModule } from '../users/users.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([ActionLog]),
		UsersModule
	],
	controllers: [ActionLogController],
	providers: [ActionLogService],
	exports: [ActionLogService],
})
export class ActionLogModule {}
