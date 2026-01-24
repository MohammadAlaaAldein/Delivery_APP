import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
	Req,
	Query,
	UseInterceptors,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';
import { FastifyRequest } from 'fastify';
import { handleSuccessApiResponse, handleThrowApiError } from 'src/common/api-response';
import { ListCompanyDto } from './dto/list-companies.dto';
import { getControllersPrefixes, translate } from 'src/common/utilities';
import { RoleInterceptor } from 'src/interceptors/role-interceptor';
import { USER_ROLE } from '../users/users.service';
import { DriversService } from '../drivers/drivers.service';

@Controller(getControllersPrefixes('companies'))

export class CompaniesController {

	readonly THROW_API_MODULE: string = 'companies';

	constructor(
		private readonly companiesService: CompaniesService,
		private readonly driversService: DriversService,
	) { }

	// ==================== MY COMPANY ENDPOINTS (for company users) ====================

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
	@Get('my')
	async getMyCompany(
		@Req() req: FastifyRequest,
	) {
		const companyId = req.user.entity_id;
		const companies = await this.companiesService.getCompanies({ id: companyId });
		if (!companies.length)
			return handleThrowApiError(this.THROW_API_MODULE, 'NOT_FOUND');

		return handleSuccessApiResponse({ data: companies[0] });
	}

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
	@Patch('my')
	async updateMyCompany(
		@Req() req: FastifyRequest,
		@Body() updateCompanyDto: UpdateCompanyDto,
	) {
		const companyId = req.user.entity_id;

		// Remove shop_ids from update - company users cannot modify their associated shops
		const { shop_ids, ...allowedFields } = updateCompanyDto;

		const result = await this.companiesService.update(companyId, allowedFields, { req });

		if (result.err)
			return handleThrowApiError(this.THROW_API_MODULE, result.err);

		return handleSuccessApiResponse({ message: translate('companies.company_updated_successfully'), data: result.res });
	}

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
	@Get('my/drivers')
	async getMyCompanyDrivers(
		@Req() req: FastifyRequest,
	) {
		const companyId = req.user.entity_id;
		const drivers = await this.driversService.getDrivers({ company_id: companyId });
		return handleSuccessApiResponse({ data: drivers });
	}

	// ==================== ADMIN ENDPOINTS ====================

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
	@Post('add')
	async createCompany(
		@Body() createCompanyDto: CreateCompanyDto,
		@Req() req: FastifyRequest,
	) {
		const result = await this.companiesService.create(createCompanyDto, { req });
		if (result.err)
			return handleThrowApiError(this.THROW_API_MODULE, result.err);

		return result;
	}

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
	@Patch(':id')
	async update(
		@Req() req: FastifyRequest,
		@Param('id') id: number,
		@Body() updateCompanyDto: UpdateCompanyDto,
	) {
		const result = await this.companiesService.update(id, updateCompanyDto, { req });

		if (result.err)
			return handleThrowApiError(this.THROW_API_MODULE, result.err);

		return handleSuccessApiResponse({ message: translate('companies.company_updated_successfully'), data: result.res });
	}

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
	@Patch(':id/toggle-active')
	async toggleActive(
		@Req() req: FastifyRequest,
		@Param('id') id: number,
	) {
		const result = await this.companiesService.toggleActive(id, { req });

		if (result.err)
			return handleThrowApiError(this.THROW_API_MODULE, result.err);

		return handleSuccessApiResponse({ message: translate('companies.company_status_updated_successfully'), data: result.res });
	}

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
	@Delete(':id')
	async delete(
		@Req() req: FastifyRequest,
		@Param('id') id: number,
	) {
		await this.companiesService.deleteCompany(+id, { req });
		return handleSuccessApiResponse({ message: translate('companies.company_deleted_successfully') });
	}

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
	@Get('list')
	async listCompanies(
		@Req() req: FastifyRequest,
		@Query() filters: ListCompanyDto,
	) {
		const companies = await this.companiesService.getCompanies(filters);
		return handleSuccessApiResponse({ data: companies });
	}

}
