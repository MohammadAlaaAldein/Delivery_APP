import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleModule as SchedModule } from '@nestjs/schedule';

@Module({
	imports: [
		SchedModule.forRoot(),
	],
	controllers: [ScheduleController],
	providers: [ScheduleService],
})
export class ScheduleModule { }
