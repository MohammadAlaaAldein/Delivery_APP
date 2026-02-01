import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderHistory } from './entities/order-history.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { TakeOrderDto, AssignDriverDto, CancelOrderDto } from './dto/order-actions.dto';
import { CompaniesShopsService } from '../companies-shops/companies-shops.service';
import { DriversService } from '../drivers/drivers.service';
import { OrdersGateway } from './orders.gateway';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @InjectRepository(OrderHistory)
        private ordersHistoryRepository: Repository<OrderHistory>,
        private companiesShopsService: CompaniesShopsService,
        private driversService: DriversService,
        private ordersGateway: OrdersGateway,
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

        const savedOrder = await this.ordersRepository.save(order);

        // Emit real-time event
        // If order is PENDING (no company assigned), get all connected companies to notify them
        if (!createOrderDto.company_id) {
            const connectedCompanyIds = await this.companiesShopsService.getCompanyIdsByShopId(shopId);
            this.ordersGateway.emitOrderCreated(savedOrder, connectedCompanyIds);
        } else {
            this.ordersGateway.emitOrderCreated(savedOrder);
        }

        return savedOrder;
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

    // Shop cancels their order - moves to history table
    async cancelShopOrder(shopId: number, orderId: number, cancelDto: CancelOrderDto): Promise<OrderHistory> {
        const order = await this.getShopOrder(shopId, orderId);

        // Can only cancel if not already picked up or delivered
        if ([OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED].includes(order.status)) {
            throw new BadRequestException('Cannot cancel order after pickup');
        }

        const previousCompanyId = order.company_id;
        const previousDriverId = order.driver_id;

        // Get all connected company IDs before cancelling (to notify them if order was pending)
        let connectedCompanyIds: number[] = [];
        if (order.status === OrderStatus.PENDING) {
            connectedCompanyIds = await this.companiesShopsService.getCompanyIdsByShopId(order.shop_id);
        }

        order.status = OrderStatus.CANCELLED;
        order.cancelled_at = new Date();
        order.cancellation_reason = cancelDto.cancellation_reason;

        // Emit real-time event before moving to history
        this.ordersGateway.emitOrderCancelled({
            ...order,
            company_id: previousCompanyId,
            driver_id: previousDriverId,
        }, connectedCompanyIds);

        // Move to history table
        const historyRecord = await this.moveOrderToHistory(order);

        // Delete from orders table
        await this.ordersRepository.remove(order);

        return historyRecord;
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

        // Get all connected company IDs before assigning (to notify them)
        const connectedCompanyIds = await this.companiesShopsService.getCompanyIdsByShopId(order.shop_id);

        order.company_id = companyId;
        order.status = OrderStatus.ASSIGNED_TO_COMPANY;
        order.company_assigned_at = new Date();
        if (takeOrderDto.company_notes) {
            order.company_notes = takeOrderDto.company_notes;
        }

        const savedOrder = await this.ordersRepository.save(order);

        // Emit real-time event (notify all connected companies so they remove it from available)
        this.ordersGateway.emitOrderAssignedToCompany(savedOrder, connectedCompanyIds);

        return savedOrder;
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

        await this.ordersRepository.save(order);

        // Reload order to ensure driver_id is set for the event emission
        const savedOrder = await this.ordersRepository.findOne({
            where: { id: orderId },
            relations: ['shop', 'company', 'driver', 'driver.user'],
        });

        // Emit real-time event
        this.ordersGateway.emitOrderAssignedToDriver(savedOrder);

        return savedOrder;
    }

    // Company unassigns order from driver
    async unassignDriver(companyId: number, orderId: number): Promise<Order> {
        const order = await this.getCompanyOrder(companyId, orderId);
        const previousDriverId = order.driver_id;

        if (order.status !== OrderStatus.ASSIGNED_TO_DRIVER) {
            throw new BadRequestException('Cannot unassign driver at this stage');
        }

        order.driver_id = null;
        order.status = OrderStatus.ASSIGNED_TO_COMPANY;
        order.driver_assigned_at = null;

        const savedOrder = await this.ordersRepository.save(order);

        // Emit real-time event - notify the previous driver that order was unassigned
        this.ordersGateway.emitOrderUnassignedFromDriver(savedOrder, previousDriverId);

        return savedOrder;
    }

    // Company releases order (returns to available pool)
    async releaseOrder(companyId: number, orderId: number): Promise<Order> {
        const order = await this.getCompanyOrder(companyId, orderId);
        const previousCompanyId = order.company_id;
        const previousDriverId = order.driver_id;

        if (![OrderStatus.ASSIGNED_TO_COMPANY, OrderStatus.ASSIGNED_TO_DRIVER].includes(order.status)) {
            throw new BadRequestException('Cannot release order at this stage');
        }

        order.company_id = null;
        order.driver_id = null;
        order.status = OrderStatus.PENDING;
        order.company_assigned_at = null;
        order.driver_assigned_at = null;

        const savedOrder = await this.ordersRepository.save(order);

        // Emit real-time event
        this.ordersGateway.emitOrderReleased(savedOrder, previousCompanyId, previousDriverId);

        return savedOrder;
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

        const savedOrder = await this.ordersRepository.save(order);

        // Emit real-time event
        this.ordersGateway.emitOrderPickedUp(savedOrder);

        return savedOrder;
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

        const savedOrder = await this.ordersRepository.save(order);

        // Emit real-time event
        this.ordersGateway.emitOrderInTransit(savedOrder);

        return savedOrder;
    }

    // Driver marks order as delivered - moves order to history table
    async deliverOrder(driverId: number, orderId: number, notes?: string): Promise<OrderHistory> {
        const order = await this.getDriverOrder(driverId, orderId);

        if (![OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(order.status)) {
            throw new BadRequestException('Order must be picked up or in transit');
        }

        order.status = OrderStatus.DELIVERED;
        order.delivered_at = new Date();
        if (notes) {
            order.driver_notes = notes;
        }

        // Clear driver's current location since delivery is complete
        await this.driversService.clearLocation(driverId);

        // Emit real-time event before moving to history
        this.ordersGateway.emitOrderDelivered(order);

        // Move to history table
        const historyRecord = await this.moveOrderToHistory(order);

        // Delete from orders table
        await this.ordersRepository.remove(order);

        return historyRecord;
    }

    // Move order to history table
    private async moveOrderToHistory(order: Order): Promise<OrderHistory> {
        const historyRecord = this.ordersHistoryRepository.create({
            order_number: order.order_number,
            shop_id: order.shop_id,
            company_id: order.company_id,
            driver_id: order.driver_id,
            status: order.status,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_phone_alt: order.customer_phone_alt,
            customer_email: order.customer_email,
            delivery_city: order.delivery_city,
            delivery_area: order.delivery_area,
            delivery_street: order.delivery_street,
            delivery_building: order.delivery_building,
            delivery_address: order.delivery_address,
            delivery_latitude: order.delivery_latitude,
            delivery_longitude: order.delivery_longitude,
            delivery_notes: order.delivery_notes,
            order_items: order.order_items,
            requires_large_vehicle: order.requires_large_vehicle,
            order_amount: order.order_amount,
            delivery_fee: order.delivery_fee,
            total_amount: order.total_amount,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
            is_paid: order.is_paid,
            priority: order.priority,
            scheduled_pickup_time: order.scheduled_pickup_time,
            scheduled_delivery_time: order.scheduled_delivery_time,
            company_assigned_at: order.company_assigned_at,
            driver_assigned_at: order.driver_assigned_at,
            picked_up_at: order.picked_up_at,
            delivered_at: order.delivered_at,
            cancelled_at: order.cancelled_at,
            cancellation_reason: order.cancellation_reason,
            shop_notes: order.shop_notes,
            company_notes: order.company_notes,
            driver_notes: order.driver_notes,
            archived_at: new Date(),
        });

        return await this.ordersHistoryRepository.save(historyRecord);
    }

    // Driver gets their delivery history (from history table)
    async getDriverHistory(driverId: number): Promise<OrderHistory[]> {
        return await this.ordersHistoryRepository.find({
            where: {
                driver_id: driverId,
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

        const driver = await this.driversService.findByUserId(driverId);
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

    // ==================== ORDER HISTORY ENDPOINTS ====================

    // Admin gets all order history
    async getAllOrdersHistory(filters?: {
        shop_id?: number;
        company_id?: number;
        driver_id?: number;
    }): Promise<OrderHistory[]> {
        const where: any = {};

        if (filters?.shop_id) where.shop_id = filters.shop_id;
        if (filters?.company_id) where.company_id = filters.company_id;
        if (filters?.driver_id) where.driver_id = filters.driver_id;

        return await this.ordersHistoryRepository.find({
            where,
            relations: ['shop', 'company', 'driver', 'driver.user'],
            order: { archived_at: 'DESC' },
        });
    }

    // Admin gets a specific order from history
    async getOrderHistory(historyId: number): Promise<OrderHistory> {
        const order = await this.ordersHistoryRepository.findOne({
            where: { id: historyId },
            relations: ['shop', 'company', 'driver', 'driver.user'],
        });

        if (!order) {
            throw new NotFoundException('Order history not found');
        }

        return order;
    }

    // Shop gets their order history
    async getShopOrdersHistory(shopId: number): Promise<OrderHistory[]> {
        return await this.ordersHistoryRepository.find({
            where: { shop_id: shopId },
            relations: ['company', 'driver', 'driver.user'],
            order: { archived_at: 'DESC' },
        });
    }

    // Company gets their order history
    async getCompanyOrdersHistory(companyId: number): Promise<OrderHistory[]> {
        return await this.ordersHistoryRepository.find({
            where: { company_id: companyId },
            relations: ['shop', 'driver', 'driver.user'],
            order: { archived_at: 'DESC' },
        });
    }
}
