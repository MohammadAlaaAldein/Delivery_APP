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
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';
import { FastifyRequest } from 'fastify';
import { handleSuccessApiResponse, handleThrowApiError } from 'src/common/api-response';
import { ListDriversDto } from './dto/list-drivers.dto';
import { getControllersPrefixes, translate } from 'src/common/utilities';
import { RoleInterceptor } from 'src/interceptors/role-interceptor';
import { USER_ROLE } from '../users/users.service';

@Controller(getControllersPrefixes('drivers'))
export class DriversController {

    readonly THROW_API_MODULE: string = 'drivers';

    constructor(
        private readonly driversService: DriversService,
    ) { }

    // ==================== MY DRIVER ENDPOINTS (for driver users) ====================

    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.DRIVER, { requireEntityOwnership: true }))
    @Get('my')
    async getMyDriver(
        @Req() req: FastifyRequest,
    ) {
        const driverId = req.user.id;
        const drivers = await this.driversService.getDrivers({ user_id: driverId });
        if (!drivers.length)
            return handleThrowApiError(this.THROW_API_MODULE, 'NOT_FOUND');

        return handleSuccessApiResponse({ data: drivers[0] });
    }

    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.DRIVER, { requireEntityOwnership: true }))
    @Patch('my')
    async updateMyDriver(
        @Req() req: FastifyRequest,
        @Body() updateDriverDto: UpdateDriverDto,
    ) {
        const driverId = req.user.id;

        // Remove fields that drivers cannot modify themselves
        const { is_active, company_id, ...allowedFields } = updateDriverDto;

        const result = await this.driversService.update(driverId, allowedFields, { req });

        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return handleSuccessApiResponse({ message: translate('drivers.driver_updated_successfully'), data: result.res });
    }

    // ==================== ADMIN ENDPOINTS ====================

    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    @Post('add')
    async createDriver(
        @Body() createDriverDto: CreateDriverDto,
        @Req() req: FastifyRequest,
    ) {
        const result = await this.driversService.create(createDriverDto, { req });
        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return result;
    }

    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    @Patch(':userId')
    async update(
        @Req() req: FastifyRequest,
        @Param('userId') userId: number,
        @Body() updateDriverDto: UpdateDriverDto,
    ) {
        const result = await this.driversService.update(userId, updateDriverDto, { req });

        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return handleSuccessApiResponse({ message: translate('drivers.driver_updated_successfully'), data: result.res });
    }

    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    @Patch(':userId/toggle-active')
    async toggleActive(
        @Req() req: FastifyRequest,
        @Param('userId') userId: number,
    ) {
        const result = await this.driversService.toggleActive(userId, { req });

        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return handleSuccessApiResponse({ message: translate('drivers.driver_status_updated_successfully'), data: result.res });
    }

    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    @Delete(':userId')
    async delete(
        @Req() req: FastifyRequest,
        @Param('userId') userId: number,
    ) {
        await this.driversService.deleteDriver(+userId, { req });
        return handleSuccessApiResponse({ message: translate('drivers.driver_deleted_successfully') });
    }

    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    @Get('list')
    async listDrivers(
        @Req() req: FastifyRequest,
        @Query() listDriversDto: ListDriversDto,
    ) {
        const drivers = await this.driversService.getDrivers(listDriversDto);
        return handleSuccessApiResponse({ data: drivers });
    }
}
