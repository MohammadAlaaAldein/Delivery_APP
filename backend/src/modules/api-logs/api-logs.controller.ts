import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiLogsService } from './api-logs.service';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';
import { FastifyRequest } from 'fastify';
import { handleSuccessApiResponse } from 'src/common/api-response';
import { ListApiLogsDto } from './dto/list-logs.dto';
import { getControllersPrefixes } from 'src/common/utilities';

@Controller(getControllersPrefixes('api-logs'))
export class ApiLogsController {
	constructor(private readonly apiLogsService: ApiLogsService) { }

	@Get('list')
	@UseGuards(JwtGuard)
	async apiLogs(
		@Req() req: FastifyRequest,
		@Query() filters: ListApiLogsDto,
	) {
		const logs = await this.apiLogsService.getLogs(filters);
		return handleSuccessApiResponse({ data: logs });
	}
}
