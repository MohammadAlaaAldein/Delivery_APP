import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseInterceptors,
    Req,
    ParseIntPipe,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { TakeOrderDto, AssignDriverDto, CancelOrderDto, UpdateStatusDto } from './dto/order-actions.dto';
import { RoleInterceptor } from 'src/interceptors/role-interceptor';
import { USER_ROLE } from '../users/users.service';
import { OrderStatus } from './entities/order.entity';
import { DriversService } from '../drivers/drivers.service';
import { JwtGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtGuard)
@Controller('orders')
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly driversService: DriversService,
    ) { }

    // Helper to get driver_id from user
    private async getDriverId(userId: number): Promise<number> {
        const driver = await this.driversService.findByUserId(userId);
        if (!driver) {
            throw new BadRequestException('Driver profile not found');
        }
        return driver.user_id;
    }

    // ==================== SHOP ENDPOINTS ====================

    // Shop creates an order
    @Post('shop/create')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.SHOP, { requireEntityOwnership: true }))
    async createOrder(@Req() req, @Body() createOrderDto: CreateOrderDto) {
        const shopId = req.user.entity_id;
        const order = await this.ordersService.createOrder(shopId, createOrderDto);
        return { data: order };
    }

    // Shop gets their orders
    @Get('shop/my')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.SHOP, { requireEntityOwnership: true }))
    async getShopOrders(@Req() req, @Query('status') status?: OrderStatus) {
        const shopId = req.user.entity_id;
        const orders = await this.ordersService.getShopOrders(shopId, status);
        return { data: orders };
    }

    // Shop gets a specific order
    @Get('shop/my/:id')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.SHOP, { requireEntityOwnership: true }))
    async getShopOrder(@Req() req, @Param('id', ParseIntPipe) id: number) {
        const shopId = req.user.entity_id;
        const order = await this.ordersService.getShopOrder(shopId, id);
        return { data: order };
    }

    // Shop updates their order
    @Patch('shop/my/:id')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.SHOP, { requireEntityOwnership: true }))
    async updateShopOrder(
        @Req() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() updateOrderDto: UpdateOrderDto,
    ) {
        const shopId = req.user.entity_id;
        const order = await this.ordersService.updateShopOrder(shopId, id, updateOrderDto);
        return { data: order };
    }

    // Shop cancels their order
    @Post('shop/my/:id/cancel')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.SHOP, { requireEntityOwnership: true }))
    async cancelShopOrder(
        @Req() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() cancelDto: CancelOrderDto,
    ) {
        const shopId = req.user.entity_id;
        const order = await this.ordersService.cancelShopOrder(shopId, id, cancelDto);
        return { data: order };
    }

    // Shop gets statistics
    @Get('shop/statistics')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.SHOP, { requireEntityOwnership: true }))
    async getShopStatistics(@Req() req) {
        const shopId = req.user.entity_id;
        const stats = await this.ordersService.getShopStatistics(shopId);
        return { data: stats };
    }

    // ==================== COMPANY ENDPOINTS ====================

    // Company gets available orders (not assigned to any company)
    @Get('company/available')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    async getAvailableOrders(@Req() req) {
        const companyId = req.user.entity_id;
        const orders = await this.ordersService.getAvailableOrders(companyId);
        return { data: orders };
    }

    // Company takes an order
    @Post('company/take/:id')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    async takeOrder(
        @Req() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() takeOrderDto: TakeOrderDto,
    ) {
        const companyId = req.user.entity_id;
        const order = await this.ordersService.takeOrder(companyId, id, takeOrderDto);
        return { data: order };
    }

    // Company gets their assigned orders
    @Get('company/my')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    async getCompanyOrders(@Req() req, @Query('status') status?: OrderStatus) {
        const companyId = req.user.entity_id;
        const orders = await this.ordersService.getCompanyOrders(companyId, status);
        return { data: orders };
    }

    // Company gets a specific order
    @Get('company/my/:id')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    async getCompanyOrder(@Req() req, @Param('id', ParseIntPipe) id: number) {
        const companyId = req.user.entity_id;
        const order = await this.ordersService.getCompanyOrder(companyId, id);
        return { data: order };
    }

    // Company assigns order to driver
    @Post('company/my/:id/assign-driver')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    async assignDriver(
        @Req() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() assignDriverDto: AssignDriverDto,
    ) {
        const companyId = req.user.entity_id;
        const order = await this.ordersService.assignDriver(companyId, id, assignDriverDto);
        return { data: order };
    }

    // Company unassigns driver from order
    @Post('company/my/:id/unassign-driver')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    async unassignDriver(@Req() req, @Param('id', ParseIntPipe) id: number) {
        const companyId = req.user.entity_id;
        const order = await this.ordersService.unassignDriver(companyId, id);
        return { data: order };
    }

    // Company releases order (returns to available pool)
    @Post('company/my/:id/release')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    async releaseOrder(@Req() req, @Param('id', ParseIntPipe) id: number) {
        const companyId = req.user.entity_id;
        const order = await this.ordersService.releaseOrder(companyId, id);
        return { data: order };
    }

    // Company gets statistics
    @Get('company/statistics')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    async getCompanyStatistics(@Req() req) {
        const companyId = req.user.entity_id;
        const stats = await this.ordersService.getCompanyStatistics(companyId);
        return { data: stats };
    }

    // ==================== DRIVER ENDPOINTS ====================

    // Driver gets their active orders
    @Get('driver/my')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.DRIVER, { requireEntityOwnership: true }))
    async getDriverOrders(@Req() req, @Query('status') status?: OrderStatus) {
        const driverId = await this.getDriverId(req.user.id);
        const orders = await this.ordersService.getDriverOrders(driverId, status);
        return { data: orders };
    }

    // Driver gets a specific order
    @Get('driver/my/:id')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.DRIVER, { requireEntityOwnership: true }))
    async getDriverOrder(@Req() req, @Param('id', ParseIntPipe) id: number) {
        const driverId = await this.getDriverId(req.user.id);
        const order = await this.ordersService.getDriverOrder(driverId, id);
        return { data: order };
    }

    // Driver picks up order
    @Post('driver/my/:id/pickup')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.DRIVER, { requireEntityOwnership: true }))
    async pickupOrder(
        @Req() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateStatusDto,
    ) {
        const driverId = await this.getDriverId(req.user.id);
        const order = await this.ordersService.pickupOrder(driverId, id, body.notes);
        return { data: order };
    }

    // Driver starts delivery
    @Post('driver/my/:id/start-delivery')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.DRIVER, { requireEntityOwnership: true }))
    async startDelivery(
        @Req() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateStatusDto,
    ) {
        const driverId = await this.getDriverId(req.user.id);
        const order = await this.ordersService.startDelivery(driverId, id, body.notes);
        return { data: order };
    }

    // Driver delivers order
    @Post('driver/my/:id/deliver')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.DRIVER, { requireEntityOwnership: true }))
    async deliverOrder(
        @Req() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateStatusDto,
    ) {
        const driverId = await this.getDriverId(req.user.id);
        const order = await this.ordersService.deliverOrder(driverId, id, body.notes);
        return { data: order };
    }

    // Driver gets delivery history
    @Get('driver/history')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.DRIVER, { requireEntityOwnership: true }))
    async getDriverHistory(@Req() req) {
        const driverId = await this.getDriverId(req.user.id);
        const orders = await this.ordersService.getDriverHistory(driverId);
        return { data: orders };
    }

    // Driver gets statistics
    @Get('driver/statistics')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.DRIVER, { requireEntityOwnership: true }))
    async getDriverStatistics(@Req() req) {
        const driverId = await this.getDriverId(req.user.id);
        const stats = await this.ordersService.getDriverStatistics(driverId);
        return { data: stats };
    }

    // ==================== ADMIN ENDPOINTS ====================

    // Admin gets all orders
    @Get('list')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    async getAllOrders(
        @Query('status') status?: OrderStatus,
        @Query('shop_id') shopId?: string,
        @Query('company_id') companyId?: string,
        @Query('driver_id') driverId?: string,
    ) {
        const filters: any = {};
        if (status) filters.status = status;
        if (shopId) filters.shop_id = parseInt(shopId, 10);
        if (companyId) filters.company_id = parseInt(companyId, 10);
        if (driverId) filters.driver_id = parseInt(driverId, 10);

        const orders = await this.ordersService.getAllOrders(filters);
        return { data: orders };
    }

    // Admin gets a specific order
    @Get(':id')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    async getOrder(@Param('id', ParseIntPipe) id: number) {
        const order = await this.ordersService.getOrder(id);
        return { data: order };
    }

    // Admin creates order for a shop
    @Post('create/:shopId')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    async adminCreateOrder(
        @Param('shopId', ParseIntPipe) shopId: number,
        @Body() createOrderDto: CreateOrderDto,
    ) {
        const order = await this.ordersService.adminCreateOrder(shopId, createOrderDto);
        return { data: order };
    }

    // Admin updates order
    @Patch(':id')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    async adminUpdateOrder(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateOrderDto: UpdateOrderDto,
    ) {
        const order = await this.ordersService.adminUpdateOrder(id, updateOrderDto);
        return { data: order };
    }

    // Admin assigns company to order
    @Post(':id/assign-company/:companyId')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    async adminAssignCompany(
        @Param('id', ParseIntPipe) id: number,
        @Param('companyId', ParseIntPipe) companyId: number,
    ) {
        const order = await this.ordersService.adminAssignCompany(id, companyId);
        return { data: order };
    }

    // Admin assigns driver to order
    @Post(':id/assign-driver/:driverId')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    async adminAssignDriver(
        @Param('id', ParseIntPipe) id: number,
        @Param('driverId', ParseIntPipe) driverId: number,
    ) {
        const order = await this.ordersService.adminAssignDriver(id, driverId);
        return { data: order };
    }

    // Admin deletes order
    @Delete(':id')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    async deleteOrder(@Param('id', ParseIntPipe) id: number) {
        await this.ordersService.deleteOrder(id);
        return { message: 'Order deleted successfully' };
    }

    // ==================== ORDER HISTORY ENDPOINTS ====================

    // Admin gets all order history
    @Get('history/list')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    async getAllOrdersHistory(
        @Query('shop_id') shopId?: string,
        @Query('company_id') companyId?: string,
        @Query('driver_id') driverId?: string,
    ) {
        const filters: any = {};
        if (shopId) filters.shop_id = parseInt(shopId, 10);
        if (companyId) filters.company_id = parseInt(companyId, 10);
        if (driverId) filters.driver_id = parseInt(driverId, 10);

        const orders = await this.ordersService.getAllOrdersHistory(filters);
        return { data: orders };
    }

    // Admin gets a specific order from history
    @Get('history/:id')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.ADMIN))
    async getOrderHistory(@Param('id', ParseIntPipe) id: number) {
        const order = await this.ordersService.getOrderHistory(id);
        return { data: order };
    }

    // Shop gets their order history
    @Get('shop/history')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.SHOP, { requireEntityOwnership: true }))
    async getShopOrdersHistory(@Req() req) {
        const shopId = await this.getShopId(req.user.id);
        const orders = await this.ordersService.getShopOrdersHistory(shopId);
        return { data: orders };
    }

    // Company gets their order history
    @Get('company/history')
    @UseInterceptors(new RoleInterceptor(USER_ROLE.COMPANY, { requireEntityOwnership: true }))
    async getCompanyOrdersHistory(@Req() req) {
        const companyId = await this.getCompanyId(req.user.id);
        const orders = await this.ordersService.getCompanyOrdersHistory(companyId);
        return { data: orders };
    }
}
