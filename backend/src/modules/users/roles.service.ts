import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { comparePasswords, hashPassword, nowTime, translate } from '../../common/utilities';
import { ChangeUserPasswordDto } from './dto/change-password.dto';
import { FastifyRequest } from 'fastify';
import { ErrorKeys } from 'src/common/api-response';
import { ListUsersDto } from './dto/list-users.dto';
import { AuthCaptchaService } from '../auth/auth-captcha/auth-captcha.service';
import { ForgotPasswordDto, ResetUserPasswordDto } from './dto/forgot-password.dto';
import moment from 'moment';
import { RedisService } from '../redis/redis.service';
// import { MailersService } from '../mailers/mailers.service';
import { getSiteBaseURL, RESET_PASSWORD_LINK_TTL } from 'src/common/constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { encrypt } from 'src/common/common';
import { ShopsService } from '../shops/shops.service';
import { CompaniesService } from '../companies/companies.service';
import { USER_ROLE } from './users.service';
import { keyBy } from 'lodash';

@Injectable()
export class RolesService {

	constructor(
		private shopsService: ShopsService,
		private companiesService: CompaniesService,
	) { }

}
