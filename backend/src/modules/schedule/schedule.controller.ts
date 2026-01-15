import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';
import { FastifyRequest } from 'fastify';
import { hasAccessFunction } from '../auth/auth.service';
import { ACCESS_FUNCTIONS } from 'src/common/access-functions';
import { handleSuccessApiResponse } from 'src/common/api-response';
import { getControllersPrefixes, translate } from 'src/common/utilities';
import { IsProd } from 'src/common/constants';

@UseGuards(JwtGuard)
@Controller(getControllersPrefixes('schedule'))
export class ScheduleController {
	constructor(private readonly scheduleService: ScheduleService) { }

	@Get('get-cron-jobs-status')
	async getCronsSchedule(@Req() req: FastifyRequest) {
		if (!hasAccessFunction(req, ACCESS_FUNCTIONS.ADMIN))
			throw new UnauthorizedException();

		const result = await this.scheduleService.getCronJobsStatus();
		return handleSuccessApiResponse({ data: result });
	}

	@Get('get-sched-functions-status')
	async getSchedFunctionsStatus(@Req() req: FastifyRequest) {
		if (!hasAccessFunction(req, ACCESS_FUNCTIONS.ADMIN))
			throw new UnauthorizedException();

		const result = await this.scheduleService.getSchedFunctionsStatus();
		return handleSuccessApiResponse({ data: result });
	}

	@Post('update-sched-functions-status')
	async updateSchedFunctionsStatus(
		@Req() req: FastifyRequest,
		@Body() data: any
	) {
		if (!hasAccessFunction(req, ACCESS_FUNCTIONS.ADMIN))
			throw new UnauthorizedException();

		await this.scheduleService.updateSchedFunctionsStatus(data);

		return handleSuccessApiResponse({ message: translate('schedules.schedules_updated_successfully') });
	}

	@Post('addSchedToRun')
	async addSchedToRun(
		@Req() req: FastifyRequest,
		@Body() body: any
	) {
		if (!hasAccessFunction(req, ACCESS_FUNCTIONS.ADMIN) || IsProd())
			throw new UnauthorizedException();

		await this.scheduleService.addSchedToRun(body.sched);

		return handleSuccessApiResponse({ message: translate('schedules.scheduled_successfully') });
	}
}
