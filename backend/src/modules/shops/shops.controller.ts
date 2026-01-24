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
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';
import { FastifyRequest } from 'fastify';
import { handleSuccessApiResponse, handleThrowApiError } from 'src/common/api-response';
import { ListShopDto } from './dto/list-shops.dto';
import { getControllersPrefixes, translate } from 'src/common/utilities';
import { RoleInterceptor } from 'src/interceptors/role-interceptor';
import { USER_ROLE } from '../users/users.service';

@Controller(getControllersPrefixes('shops'))

export class ShopsController {

	readonly THROW_API_MODULE: string = 'shops';

	constructor(
		private readonly shopsService: ShopsService,
	) { }

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
	@Post('add')
	async createShop(
		@Body() createShopDto: CreateShopDto,
		@Req() req: FastifyRequest,
	) {
		const result = await this.shopsService.create(createShopDto, { req });
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
		@Body() updateShopDto: UpdateShopDto,
	) {
		const result = await this.shopsService.update(id, updateShopDto, { req });

		if (result.err)
			return handleThrowApiError(this.THROW_API_MODULE, result.err);

		return handleSuccessApiResponse({ message: translate('shops.shop_updated_successfully'), data: result.res });
	}

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
	@Patch(':id/toggle-active')
	async toggleActive(
		@Req() req: FastifyRequest,
		@Param('id') id: number,
	) {
		const result = await this.shopsService.toggleActive(id, { req });

		if (result.err)
			return handleThrowApiError(this.THROW_API_MODULE, result.err);

		return handleSuccessApiResponse({ message: translate('shops.shop_status_updated_successfully'), data: result.res });
	}

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
	@Delete(':id')
	async delete(
		@Req() req: FastifyRequest,
		@Param('id') id: number,
	) {
		await this.shopsService.deleteShop(+id, { req });
		return handleSuccessApiResponse({ message: translate('shops.shop_deleted_successfully') });
	}

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
	@Get('list')
	async listUsers(
		@Req() req: FastifyRequest,
		@Query() filters: ListShopDto,
	) {
		const users = await this.shopsService.getShops(filters);
		return handleSuccessApiResponse({ data: users });
	}

}
