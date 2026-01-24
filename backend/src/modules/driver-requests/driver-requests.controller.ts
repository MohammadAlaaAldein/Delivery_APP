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
import { DriverRequestsService } from './driver-requests.service';
import { CreateDriverRequestDto } from './dto/create-driver-request.dto';
import { UpdateDriverRequestDto } from './dto/update-driver-request.dto';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';
import { FastifyRequest } from 'fastify';
import { handleSuccessApiResponse, handleThrowApiError } from 'src/common/api-response';
import { ListDriverRequestDto } from './dto/list-driver-request.dto';
import { getControllersPrefixes, translate } from 'src/common/utilities';
import { RoleInterceptor } from 'src/interceptors/role-interceptor';
import { USER_ROLE } from '../users/users.service';

@Controller(getControllersPrefixes('driver-requests'))
export class DriverRequestsController {

    readonly THROW_API_MODULE: string = 'driver_requests';

    constructor(
        private readonly driverRequestsService: DriverRequestsService,
    ) { }

    // ==================== COMPANY ENDPOINTS ====================

    /**
     * Company creates a new driver request
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    @Post('my/add')
    async createMyDriverRequest(
        @Req() req: FastifyRequest,
        @Body() createDto: CreateDriverRequestDto,
    ) {
        const companyId = req.user.entity_id;
        const result = await this.driverRequestsService.create(companyId, createDto, { req });

        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return handleSuccessApiResponse({
            message: translate('driver_requests.request_created_successfully'),
            data: result.res
        });
    }

    /**
     * Company views their own driver requests
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    @Get('my')
    async getMyDriverRequests(
        @Req() req: FastifyRequest,
    ) {
        const companyId = req.user.entity_id;
        const requests = await this.driverRequestsService.getMyDriverRequests(companyId);
        return handleSuccessApiResponse({ data: requests });
    }

    /**
     * Company updates their own driver request (only if pending or rejected)
     * If rejected, resubmitting will reset status to pending
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    @Patch('my/:id')
    async updateMyDriverRequest(
        @Req() req: FastifyRequest,
        @Param('id') id: number,
        @Body() updateDto: UpdateDriverRequestDto,
    ) {
        const companyId = req.user.entity_id;
        const result = await this.driverRequestsService.updateMyRequest(id, companyId, updateDto, { req });

        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return handleSuccessApiResponse({
            message: translate('driver_requests.request_updated_successfully'),
            data: result.res
        });
    }

    /**
     * Company deletes their own driver request (only if pending or rejected)
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    @Delete('my/:id')
    async deleteMyDriverRequest(
        @Req() req: FastifyRequest,
        @Param('id') id: number,
    ) {
        const companyId = req.user.entity_id;
        const result = await this.driverRequestsService.deleteMyRequest(id, companyId, { req });

        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return handleSuccessApiResponse({ message: translate('driver_requests.request_deleted_successfully') });
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Admin lists all driver requests
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    @Get('list')
    async list(
        @Req() req: FastifyRequest,
        @Query() filters: ListDriverRequestDto,
    ) {
        const requests = await this.driverRequestsService.getDriverRequests(filters);
        return handleSuccessApiResponse({ data: requests });
    }

    /**
     * Admin updates a driver request
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    @Patch(':id')
    async update(
        @Req() req: FastifyRequest,
        @Param('id') id: number,
        @Body() updateDto: UpdateDriverRequestDto,
    ) {
        const result = await this.driverRequestsService.update(id, updateDto, { req });

        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return handleSuccessApiResponse({
            message: translate('driver_requests.request_updated_successfully'),
            data: result.res
        });
    }

    /**
     * Admin approves a driver request - creates user and driver
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    @Post(':id/approve')
    async approve(
        @Req() req: FastifyRequest,
        @Param('id') id: number,
    ) {
        const result = await this.driverRequestsService.approve(id, { req });

        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return handleSuccessApiResponse({
            message: translate('driver_requests.request_approved_successfully'),
            data: result.res
        });
    }

    /**
     * Admin rejects a driver request
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    @Post(':id/reject')
    async reject(
        @Req() req: FastifyRequest,
        @Param('id') id: number,
        @Body() body: { admin_notes?: string },
    ) {
        const result = await this.driverRequestsService.reject(id, body.admin_notes, { req });

        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return handleSuccessApiResponse({
            message: translate('driver_requests.request_rejected_successfully'),
            data: result.res
        });
    }

    /**
     * Admin deletes a driver request
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    @Delete(':id')
    async delete(
        @Req() req: FastifyRequest,
        @Param('id') id: number,
    ) {
        await this.driverRequestsService.delete(+id, { req });
        return handleSuccessApiResponse({ message: translate('driver_requests.request_deleted_successfully') });
    }
}
