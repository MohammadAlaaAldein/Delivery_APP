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
	UnauthorizedException,
	Query,
	Res,
	UseInterceptors,
} from '@nestjs/common';
import { USER_ROLE, UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ChangeUserPasswordDto } from './dto/change-password.dto';
import { handleSuccessApiResponse, handleThrowApiError } from 'src/common/api-response';
import { ListUsersDto } from './dto/list-users.dto';
import { getControllersPrefixes, translate } from 'src/common/utilities';
import { AuthCaptchaService } from '../auth/auth-captcha/auth-captcha.service';
import { ForgotPasswordDto, ResetUserPasswordDto } from './dto/forgot-password.dto';
import { NotAuthenticatedGuard } from '../auth/guards/not-authenticated.guard';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { RoleInterceptor } from 'src/interceptors/role-interceptor';
import { RolesService } from './roles.service';

@Controller(getControllersPrefixes('users'))

export class UsersController {

	readonly THROW_API_MODULE: string = 'users';

	constructor(
		private readonly usersService: UsersService,
		private readonly authCaptchaService: AuthCaptchaService,
		private readonly rolesService: RolesService
	) { }

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
	@Post('register')
	async registerUser(
		@Body() createUserDto: CreateUserDto,
		@Req() req: FastifyRequest,
	) {
		const result = await this.usersService.create(createUserDto, { req });

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
		@Body() updateUserDto: UpdateUserDto,
	) {
		const result = await this.usersService.update(id, updateUserDto, { req });

		if (result.err)
			return handleThrowApiError(this.THROW_API_MODULE, result.err);

		return handleSuccessApiResponse({ message: translate('users.user_updated_successfully'), data: result.res });
	}

	@UseGuards(JwtGuard)
	@Patch('change-password')
	async changeUserPassword(
		@Body() data: ChangeUserPasswordDto,
		@Req() req: FastifyRequest,
	) {
		const result = await this.usersService.changeUserPassword(req.user.id, data);

		if (result?.err)
			return handleThrowApiError(this.THROW_API_MODULE, result.err);

		return handleSuccessApiResponse({ message: translate('users.password_changed_successfully'), data: result.res });
	}

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
	@Delete(':id')
	async delete(
		@Req() req: FastifyRequest,
		@Param('id') id: number,
	) {
		await this.usersService.deleteUser(+id, { req });
		return handleSuccessApiResponse({ message: translate('users.user_deleted_successfully') });
	}

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
	@Patch(':id/toggle-active')
	async toggleActive(
		@Req() req: FastifyRequest,
		@Param('id') id: number,
	) {
		const result = await this.usersService.toggleActive(id, { req });

		if (result.err)
			return handleThrowApiError(this.THROW_API_MODULE, result.err);

		return handleSuccessApiResponse({ message: translate('users.user_status_updated_successfully'), data: result.res });
	}

	@UseGuards(JwtGuard)
	@UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
	@Get('list')
	async listUsers(
		@Req() req: FastifyRequest,
		@Query() filters: ListUsersDto,
	) {
		let users: any = await this.usersService.getUsers(filters);
		users = await this.usersService.mapUsersEntity(users);

		return handleSuccessApiResponse({ data: users });
	}

	@UseGuards(NotAuthenticatedGuard)
	@Post('forgotPassword')
	async forgotPassword(
		@Req() req: FastifyRequest,
		@Body() body: ForgotPasswordDto
	) {
		const response = await this.usersService.forgotPassword(body, { req });
		if (response.err)
			return handleThrowApiError(this.THROW_API_MODULE, response.err);
		return handleSuccessApiResponse({ data: translate('users.forgot_email_sent_successfully') });
	}

	@Get('captchaImage')
	async getCaptchaImage(
		@Query('captchaKey') captchaKey: string,
		@Res() res: FastifyReply
	) {
		const captchaImg = await this.authCaptchaService.getCaptcha(captchaKey, true);

		res.header('Content-Type', 'image/svg+xml');
		res.header('Cache-Control', 'no-store');
		res.send(captchaImg); // SVG string
	}

	@UseGuards(NotAuthenticatedGuard)
	@Post('reset-password')
	async resetPassword(
		@Req() req: FastifyRequest,
		@Body() changePasswordData: ResetUserPasswordDto
	) {
		const response = await this.usersService.resetUserPassword(changePasswordData, { req });
		if (response.err)
			return handleThrowApiError(this.THROW_API_MODULE, response.err);
		return handleSuccessApiResponse({ data: response });
	}

	@UseGuards(JwtGuard)
	@Post('update-user-password')
	async updateUserPassword(
		@Req() req: FastifyRequest,
		@Body() updateUserPasswords: UpdateUserPasswordDto
	) {
		const response = await this.usersService.updateUserPassword(updateUserPasswords, { req });
		if (response.err)
			return handleThrowApiError(this.THROW_API_MODULE, response.err);
		return handleSuccessApiResponse({ data: response });
	}
}
