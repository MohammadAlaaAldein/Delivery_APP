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
import { ShopRequestsService } from './shop-requests.service';
import { CreateShopRequestDto } from './dto/create-shop-request.dto';
import { UpdateShopRequestDto } from './dto/update-shop-request.dto';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';
import { FastifyRequest } from 'fastify';
import { handleSuccessApiResponse, handleThrowApiError } from 'src/common/api-response';
import { ListShopRequestDto } from './dto/list-shop-request.dto';
import { getControllersPrefixes, translate } from 'src/common/utilities';
import { RoleInterceptor } from 'src/interceptors/role-interceptor';
import { USER_ROLE } from '../users/users.service';

@Controller(getControllersPrefixes('shop-requests'))
export class ShopRequestsController {

    readonly THROW_API_MODULE: string = 'shop_requests';

    constructor(
        private readonly shopRequestsService: ShopRequestsService,
    ) { }

    // ==================== COMPANY ENDPOINTS ====================

    /**
     * Company creates a new shop request
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    @Post('my/add')
    async createMyShopRequest(
        @Req() req: FastifyRequest,
        @Body() createDto: CreateShopRequestDto,
    ) {
        const companyId = req.user.entity_id;
        const result = await this.shopRequestsService.create(companyId, createDto, { req });

        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return handleSuccessApiResponse({
            message: translate('shop_requests.request_created_successfully'),
            data: result.res
        });
    }

    /**
     * Company views their own shop requests
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    @Get('my')
    async getMyShopRequests(
        @Req() req: FastifyRequest,
    ) {
        const companyId = req.user.entity_id;
        const requests = await this.shopRequestsService.getMyShopRequests(companyId);
        return handleSuccessApiResponse({ data: requests });
    }

    /**
     * Company updates their own shop request (only if pending or rejected)
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    @Patch('my/:id')
    async updateMyShopRequest(
        @Req() req: FastifyRequest,
        @Param('id') id: number,
        @Body() updateDto: UpdateShopRequestDto,
    ) {
        const companyId = req.user.entity_id;
        const result = await this.shopRequestsService.updateMyRequest(id, companyId, updateDto, { req });

        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return handleSuccessApiResponse({
            message: translate('shop_requests.request_updated_successfully'),
            data: result.res
        });
    }

    /**
     * Company deletes their own shop request (only if pending or rejected)
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    @Delete('my/:id')
    async deleteMyShopRequest(
        @Req() req: FastifyRequest,
        @Param('id') id: number,
    ) {
        const companyId = req.user.entity_id;
        const result = await this.shopRequestsService.deleteMyRequest(id, companyId, { req });

        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return handleSuccessApiResponse({ message: translate('shop_requests.request_deleted_successfully') });
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Admin lists all shop requests
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    @Get('list')
    async list(
        @Req() req: FastifyRequest,
        @Query() filters: ListShopRequestDto,
    ) {
        const requests = await this.shopRequestsService.getShopRequests(filters);
        return handleSuccessApiResponse({ data: requests });
    }

    /**
     * Admin updates a shop request
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    @Patch(':id')
    async update(
        @Req() req: FastifyRequest,
        @Param('id') id: number,
        @Body() updateDto: UpdateShopRequestDto,
    ) {
        const result = await this.shopRequestsService.update(id, updateDto, { req });

        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return handleSuccessApiResponse({
            message: translate('shop_requests.request_updated_successfully'),
            data: result.res
        });
    }

    /**
     * Admin approves a shop request - creates the shop
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    @Post(':id/approve')
    async approve(
        @Req() req: FastifyRequest,
        @Param('id') id: number,
    ) {
        const result = await this.shopRequestsService.approve(id, { req });

        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return handleSuccessApiResponse({
            message: translate('shop_requests.request_approved_successfully'),
            data: result.res
        });
    }

    /**
     * Admin rejects a shop request
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    @Post(':id/reject')
    async reject(
        @Req() req: FastifyRequest,
        @Param('id') id: number,
        @Body() body: { admin_notes?: string },
    ) {
        const result = await this.shopRequestsService.reject(id, body.admin_notes, { req });

        if (result.err)
            return handleThrowApiError(this.THROW_API_MODULE, result.err);

        return handleSuccessApiResponse({
            message: translate('shop_requests.request_rejected_successfully'),
            data: result.res
        });
    }

    /**
     * Admin deletes a shop request
     */
    @UseGuards(JwtGuard)
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    @Delete(':id')
    async delete(
        @Req() req: FastifyRequest,
        @Param('id') id: number,
    ) {
        await this.shopRequestsService.delete(+id, { req });
        return handleSuccessApiResponse({ message: translate('shop_requests.request_deleted_successfully') });
    }
}
