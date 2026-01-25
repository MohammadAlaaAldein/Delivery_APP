import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { TakeOrderDto, AssignDriverDto, CancelOrderDto } from './dto/order-actions.dto';
import { CompaniesShopsService } from '../companies-shops/companies-shops.service';
import { DriversService } from '../drivers/drivers.service';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        private companiesShopsService: CompaniesShopsService,
        private driversService: DriversService,
    ) { }

    // Generate unique order number
    private async generateOrderNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `ORD-${year}-`;

        // Get the last order number for this year
        const lastOrder = await this.ordersRepository
            .createQueryBuilder('order')
            .where('order.order_number LIKE :prefix', { prefix: `${prefix}%` })
            .orderBy('order.id', 'DESC')
            .getOne();

        let nextNumber = 1;
        if (lastOrder) {
            const lastNumber = parseInt(lastOrder.order_number.replace(prefix, ''), 10);
            nextNumber = lastNumber + 1;
        }

        return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
    }

    // ==================== SHOP ENDPOINTS ====================

    // Shop creates an order
    async createOrder(shopId: number, createOrderDto: CreateOrderDto): Promise<Order> {
        const orderNumber = await this.generateOrderNumber();

        // Calculate total amount
        const orderAmount = createOrderDto.order_amount || 0;
        const deliveryFee = createOrderDto.delivery_fee || 0;
        const totalAmount = orderAmount + deliveryFee;

        // If company_id is specified, verify the company is connected to the shop
        if (createOrderDto.company_id) {
            const isConnected = await this.companiesShopsService.isCompanyConnectedToShop(
                createOrderDto.company_id,
                shopId
            );
            if (!isConnected) {
                throw new BadRequestException('The specified company is not connected to your shop');
            }
        }

        const order = this.ordersRepository.create({
            ...createOrderDto,
            shop_id: shopId,
            order_number: orderNumber,
            total_amount: totalAmount,
            status: createOrderDto.company_id ? OrderStatus.ASSIGNED_TO_COMPANY : OrderStatus.PENDING,
            company_assigned_at: createOrderDto.company_id ? new Date() : null,
        });

        return await this.ordersRepository.save(order);
    }

    // Shop gets their own orders
    async getShopOrders(shopId: number, status?: OrderStatus): Promise<Order[]> {
        const where: any = { shop_id: shopId };
        if (status) {
            where.status = status;
        }

        return await this.ordersRepository.find({
            where,
            relations: ['company', 'driver', 'driver.user'],
            order: { created_at: 'DESC' },
        });
    }

    // Shop gets a specific order
    async getShopOrder(shopId: number, orderId: number): Promise<Order> {
        const order = await this.ordersRepository.findOne({
            where: { id: orderId, shop_id: shopId },
            relations: ['shop', 'company', 'driver', 'driver.user'],
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    // Shop updates their order (only if pending or assigned_to_company)
    async updateShopOrder(shopId: number, orderId: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
        const order = await this.getShopOrder(shopId, orderId);

        if (![OrderStatus.PENDING, OrderStatus.ASSIGNED_TO_COMPANY].includes(order.status)) {
            throw new BadRequestException('Cannot update order after it has been assigned to a driver');
        }

        // Recalculate total if amounts changed
        const orderAmount = updateOrderDto.order_amount ?? order.order_amount;
        const deliveryFee = updateOrderDto.delivery_fee ?? order.delivery_fee;

        // Don't allow shop to change status, company_id, or driver_id directly
        const { status, company_id, driver_id, ...allowedUpdates } = updateOrderDto;

        Object.assign(order, allowedUpdates, {
            total_amount: Number(orderAmount) + Number(deliveryFee),
        });

        return await this.ordersRepository.save(order);
    }

    // Shop cancels their order
    async cancelShopOrder(shopId: number, orderId: number, cancelDto: CancelOrderDto): Promise<Order> {
        const order = await this.getShopOrder(shopId, orderId);

        // Can only cancel if not already picked up or delivered
        if ([OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED].includes(order.status)) {
            throw new BadRequestException('Cannot cancel order after pickup');
        }

        order.status = OrderStatus.CANCELLED;
        order.cancelled_at = new Date();
        order.cancellation_reason = cancelDto.cancellation_reason;

        return await this.ordersRepository.save(order);
    }

    // ==================== COMPANY ENDPOINTS ====================

    // Company gets available orders (pending orders from connected shops, not assigned to any company)
    async getAvailableOrders(companyId: number): Promise<Order[]> {
        // Get all shops connected to this company
        const connectedShopIds = await this.companiesShopsService.getShopIdsByCompanyId(companyId);

        if (connectedShopIds.length === 0) {
            return [];
        }

        return await this.ordersRepository.find({
            where: {
                shop_id: In(connectedShopIds),
                status: OrderStatus.PENDING,
                company_id: IsNull(),
            },
            relations: ['shop'],
            order: { priority: 'DESC', created_at: 'ASC' },
        });
    }

    // Company takes an order
    async takeOrder(companyId: number, orderId: number, takeOrderDto: TakeOrderDto): Promise<Order> {
        const order = await this.ordersRepository.findOne({
            where: { id: orderId },
            relations: ['shop'],
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.status !== OrderStatus.PENDING) {
            throw new BadRequestException('Order is no longer available');
        }

        if (order.company_id) {
            throw new BadRequestException('Order is already assigned to a company');
        }

        // Verify company is connected to the shop
        const isConnected = await this.companiesShopsService.isCompanyConnectedToShop(companyId, order.shop_id);
        if (!isConnected) {
            throw new ForbiddenException('Your company is not connected to this shop');
        }

        order.company_id = companyId;
        order.status = OrderStatus.ASSIGNED_TO_COMPANY;
        order.company_assigned_at = new Date();
        if (takeOrderDto.company_notes) {
            order.company_notes = takeOrderDto.company_notes;
        }

        return await this.ordersRepository.save(order);
    }

    // Company gets their assigned orders
    async getCompanyOrders(companyId: number, status?: OrderStatus): Promise<Order[]> {
        const where: any = { company_id: companyId };
        if (status) {
            where.status = status;
        }

        return await this.ordersRepository.find({
            where,
            relations: ['shop', 'driver', 'driver.user'],
            order: { created_at: 'DESC' },
        });
    }

    // Company gets a specific order
    async getCompanyOrder(companyId: number, orderId: number): Promise<Order> {
        const order = await this.ordersRepository.findOne({
            where: { id: orderId, company_id: companyId },
            relations: ['shop', 'driver', 'driver.user'],
        });

        if (!order) {
            throw new NotFoundException('Order not found or not assigned to your company');
        }

        return order;
    }

    // Company assigns order to a driver
    async assignDriver(companyId: number, orderId: number, assignDriverDto: AssignDriverDto): Promise<Order> {
        const order = await this.getCompanyOrder(companyId, orderId);

        if (![OrderStatus.ASSIGNED_TO_COMPANY, OrderStatus.ASSIGNED_TO_DRIVER].includes(order.status)) {
            throw new BadRequestException('Cannot assign driver at this stage');
        }

        // Verify driver belongs to this company (driver_id is now user_id)
        const driver = await this.driversService.findByUserId(assignDriverDto.driver_id);
        if (!driver || driver.company_id !== companyId) {
            throw new BadRequestException('Driver not found or does not belong to your company');
        }

        if (!driver.is_active) {
            throw new BadRequestException('Driver is not active');
        }

        order.driver_id = assignDriverDto.driver_id;
        order.status = OrderStatus.ASSIGNED_TO_DRIVER;
        order.driver_assigned_at = new Date();
        if (assignDriverDto.company_notes) {
            order.company_notes = assignDriverDto.company_notes;
        }

        return await this.ordersRepository.save(order);
    }

    // Company unassigns order from driver
    async unassignDriver(companyId: number, orderId: number): Promise<Order> {
        const order = await this.getCompanyOrder(companyId, orderId);

        if (order.status !== OrderStatus.ASSIGNED_TO_DRIVER) {
            throw new BadRequestException('Cannot unassign driver at this stage');
        }

        order.driver_id = null;
        order.status = OrderStatus.ASSIGNED_TO_COMPANY;
        order.driver_assigned_at = null;

        return await this.ordersRepository.save(order);
    }

    // Company releases order (returns to available pool)
    async releaseOrder(companyId: number, orderId: number): Promise<Order> {
        const order = await this.getCompanyOrder(companyId, orderId);

        if (![OrderStatus.ASSIGNED_TO_COMPANY, OrderStatus.ASSIGNED_TO_DRIVER].includes(order.status)) {
            throw new BadRequestException('Cannot release order at this stage');
        }

        order.company_id = null;
        order.driver_id = null;
        order.status = OrderStatus.PENDING;
        order.company_assigned_at = null;
        order.driver_assigned_at = null;

        return await this.ordersRepository.save(order);
    }

    // ==================== DRIVER ENDPOINTS ====================

    // Driver gets their assigned orders
    async getDriverOrders(driverId: number, status?: OrderStatus): Promise<Order[]> {
        const where: any = { driver_id: driverId };
        if (status) {
            where.status = status;
        } else {
            // By default, show active orders (not delivered or cancelled)
            where.status = In([
                OrderStatus.ASSIGNED_TO_DRIVER,
                OrderStatus.PICKED_UP,
                OrderStatus.IN_TRANSIT,
            ]);
        }

        return await this.ordersRepository.find({
            where,
            relations: ['shop', 'company'],
            order: { priority: 'DESC', created_at: 'ASC' },
        });
    }

    // Driver gets a specific order
    async getDriverOrder(driverId: number, orderId: number): Promise<Order> {
        const order = await this.ordersRepository.findOne({
            where: { id: orderId, driver_id: driverId },
            relations: ['shop', 'company'],
        });

        if (!order) {
            throw new NotFoundException('Order not found or not assigned to you');
        }

        return order;
    }

    // Driver marks order as picked up
    async pickupOrder(driverId: number, orderId: number, notes?: string): Promise<Order> {
        const order = await this.getDriverOrder(driverId, orderId);

        if (order.status !== OrderStatus.ASSIGNED_TO_DRIVER) {
            throw new BadRequestException('Order cannot be picked up at this stage');
        }

        order.status = OrderStatus.PICKED_UP;
        order.picked_up_at = new Date();
        if (notes) {
            order.driver_notes = notes;
        }

        return await this.ordersRepository.save(order);
    }

    // Driver marks order as in transit
    async startDelivery(driverId: number, orderId: number, notes?: string): Promise<Order> {
        const order = await this.getDriverOrder(driverId, orderId);

        if (order.status !== OrderStatus.PICKED_UP) {
            throw new BadRequestException('Order must be picked up first');
        }

        order.status = OrderStatus.IN_TRANSIT;
        if (notes) {
            order.driver_notes = notes;
        }

        return await this.ordersRepository.save(order);
    }

    // Driver marks order as delivered
    async deliverOrder(driverId: number, orderId: number, notes?: string): Promise<Order> {
        const order = await this.getDriverOrder(driverId, orderId);

        if (![OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(order.status)) {
            throw new BadRequestException('Order must be picked up or in transit');
        }

        order.status = OrderStatus.DELIVERED;
        order.delivered_at = new Date();
        if (notes) {
            order.driver_notes = notes;
        }

        return await this.ordersRepository.save(order);
    }

    // Driver gets their delivery history
    async getDriverHistory(driverId: number): Promise<Order[]> {
        return await this.ordersRepository.find({
            where: {
                driver_id: driverId,
                status: In([OrderStatus.DELIVERED, OrderStatus.CANCELLED]),
            },
            relations: ['shop', 'company'],
            order: { delivered_at: 'DESC' },
        });
    }

    // ==================== ADMIN ENDPOINTS ====================

    // Admin gets all orders
    async getAllOrders(filters?: {
        status?: OrderStatus;
        shop_id?: number;
        company_id?: number;
        driver_id?: number;
    }): Promise<Order[]> {
        const where: any = {};

        if (filters?.status) where.status = filters.status;
        if (filters?.shop_id) where.shop_id = filters.shop_id;
        if (filters?.company_id) where.company_id = filters.company_id;
        if (filters?.driver_id) where.driver_id = filters.driver_id;

        return await this.ordersRepository.find({
            where,
            relations: ['shop', 'company', 'driver', 'driver.user'],
            order: { created_at: 'DESC' },
        });
    }

    // Admin gets a specific order
    async getOrder(orderId: number): Promise<Order> {
        const order = await this.ordersRepository.findOne({
            where: { id: orderId },
            relations: ['shop', 'company', 'driver', 'driver.user'],
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    // Admin creates order for a shop
    async adminCreateOrder(shopId: number, createOrderDto: CreateOrderDto): Promise<Order> {
        return await this.createOrder(shopId, createOrderDto);
    }

    // Admin updates any order
    async adminUpdateOrder(orderId: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
        const order = await this.getOrder(orderId);

        // Recalculate total if amounts changed
        const orderAmount = updateOrderDto.order_amount ?? order.order_amount;
        const deliveryFee = updateOrderDto.delivery_fee ?? order.delivery_fee;

        // Handle status changes
        if (updateOrderDto.status && updateOrderDto.status !== order.status) {
            this.handleStatusChange(order, updateOrderDto.status);
        }

        // Handle company assignment
        if (updateOrderDto.company_id !== undefined && updateOrderDto.company_id !== order.company_id) {
            order.company_id = updateOrderDto.company_id;
            order.company_assigned_at = updateOrderDto.company_id ? new Date() : null;
        }

        // Handle driver assignment
        if (updateOrderDto.driver_id !== undefined && updateOrderDto.driver_id !== order.driver_id) {
            order.driver_id = updateOrderDto.driver_id;
            order.driver_assigned_at = updateOrderDto.driver_id ? new Date() : null;
        }

        Object.assign(order, updateOrderDto, {
            total_amount: Number(orderAmount) + Number(deliveryFee),
        });

        return await this.ordersRepository.save(order);
    }

    // Handle status change timestamps
    private handleStatusChange(order: Order, newStatus: OrderStatus): void {
        switch (newStatus) {
            case OrderStatus.ASSIGNED_TO_COMPANY:
                if (!order.company_assigned_at) order.company_assigned_at = new Date();
                break;
            case OrderStatus.ASSIGNED_TO_DRIVER:
                if (!order.driver_assigned_at) order.driver_assigned_at = new Date();
                break;
            case OrderStatus.PICKED_UP:
                if (!order.picked_up_at) order.picked_up_at = new Date();
                break;
            case OrderStatus.DELIVERED:
                if (!order.delivered_at) order.delivered_at = new Date();
                break;
            case OrderStatus.CANCELLED:
                if (!order.cancelled_at) order.cancelled_at = new Date();
                break;
        }
    }

    // Admin assigns order to company
    async adminAssignCompany(orderId: number, companyId: number): Promise<Order> {
        const order = await this.getOrder(orderId);

        order.company_id = companyId;
        order.status = OrderStatus.ASSIGNED_TO_COMPANY;
        order.company_assigned_at = new Date();

        return await this.ordersRepository.save(order);
    }

    // Admin assigns order to driver
    async adminAssignDriver(orderId: number, driverId: number): Promise<Order> {
        const order = await this.getOrder(orderId);

        const driver = await this.driversService.findById(driverId);
        if (!driver) {
            throw new BadRequestException('Driver not found');
        }

        // If no company assigned, assign driver's company
        if (!order.company_id && driver.company_id) {
            order.company_id = driver.company_id;
            order.company_assigned_at = new Date();
        }

        order.driver_id = driverId;
        order.status = OrderStatus.ASSIGNED_TO_DRIVER;
        order.driver_assigned_at = new Date();

        return await this.ordersRepository.save(order);
    }

    // Admin deletes an order
    async deleteOrder(orderId: number): Promise<void> {
        const order = await this.getOrder(orderId);
        await this.ordersRepository.softRemove(order);
    }

    // ==================== STATISTICS ====================

    async getShopStatistics(shopId: number): Promise<any> {
        const orders = await this.ordersRepository.find({
            where: { shop_id: shopId },
        });

        return this.calculateStatistics(orders);
    }

    async getCompanyStatistics(companyId: number): Promise<any> {
        const orders = await this.ordersRepository.find({
            where: { company_id: companyId },
        });

        return this.calculateStatistics(orders);
    }

    async getDriverStatistics(driverId: number): Promise<any> {
        const orders = await this.ordersRepository.find({
            where: { driver_id: driverId },
        });

        return this.calculateStatistics(orders);
    }

    private calculateStatistics(orders: Order[]): any {
        const total = orders.length;
        const pending = orders.filter(o => o.status === OrderStatus.PENDING).length;
        const inProgress = orders.filter(o =>
            [OrderStatus.ASSIGNED_TO_COMPANY, OrderStatus.ASSIGNED_TO_DRIVER, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(o.status)
        ).length;
        const delivered = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
        const cancelled = orders.filter(o => o.status === OrderStatus.CANCELLED).length;

        const totalRevenue = orders
            .filter(o => o.status === OrderStatus.DELIVERED)
            .reduce((sum, o) => sum + Number(o.total_amount), 0);

        return {
            total,
            pending,
            inProgress,
            delivered,
            cancelled,
            totalRevenue,
            deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(2) : 0,
        };
    }
}
