import { Controller, Get, Query, Req, UnauthorizedException, UseGuards} from '@nestjs/common';
import { ActionLogService } from './action-log.service';
import { FastifyRequest } from 'fastify';
import { GetActionLogDto } from './dto/get-action-logs.dto';
import { ACCESS_FUNCTIONS } from 'src/common/access-functions';
import { hasAccessFunction } from '../auth/auth.service';
import { handleSuccessApiResponse } from 'src/common/api-response';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';

@Controller('action-log')
@UseGuards(JwtGuard)
export class ActionLogController {
 	constructor(private readonly actionLogService: ActionLogService) {}

	@Get('get-action-logs')
	async getActionLogs(
		@Req() req: FastifyRequest,
		@Query() getActionLogDto: GetActionLogDto,
	) {
		if (!hasAccessFunction(req, ACCESS_FUNCTIONS.ADMIN))
			throw new UnauthorizedException();

		const result = await this.actionLogService.getActionLogs(getActionLogDto);

		return handleSuccessApiResponse({data: result});
	}
}
