import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET_TOKEN } from '../../common/constants';
import { DriversService } from '../drivers/drivers.service';

export enum OrderEventType {
    ORDER_CREATED = 'order_created',
    ORDER_STATUS_CHANGED = 'order_status_changed',
    ORDER_ASSIGNED_TO_COMPANY = 'order_assigned_to_company',
    ORDER_ASSIGNED_TO_DRIVER = 'order_assigned_to_driver',
    ORDER_UNASSIGNED_FROM_DRIVER = 'order_unassigned_from_driver',
    ORDER_PICKED_UP = 'order_picked_up',
    ORDER_IN_TRANSIT = 'order_in_transit',
    ORDER_DELIVERED = 'order_delivered',
    ORDER_CANCELLED = 'order_cancelled',
    ORDER_RELEASED = 'order_released',
    ORDER_UPDATED = 'order_updated',
    DRIVER_LOCATION_UPDATED = 'driver_location_updated',
}

export interface OrderEventPayload {
    eventType: OrderEventType;
    orderId: number;
    orderNumber: string;
    status: string;
    shopId?: number;
    companyId?: number;
    driverId?: number;
    timestamp: Date;
    data?: any;
    // Location data for DRIVER_LOCATION_UPDATED event
    location?: {
        latitude: number;
        longitude: number;
        speed?: number;
        heading?: number;
        accuracy?: number;
    };
}

interface JwtPayload {
    sub: number;
    email: string;
    role: string;
    entity_id?: number;
    iat?: number;
    exp?: number;
    id: number;
}

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
    namespace: '/orders',
})
export class OrdersGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger('OrdersGateway');

    constructor(
        @Inject(forwardRef(() => DriversService))
        private readonly driversService: DriversService,
    ) { }

    afterInit(server: Server) {
        this.logger.log('Orders WebSocket Gateway initialized');
    }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                this.logger.warn(`Client ${client.id} attempted connection without token`);
                client.emit('error', { message: 'Authentication required' });
                client.disconnect();
                return;
            }

            // Verify JWT token using the secret directly
            const secret = JWT_SECRET_TOKEN;
            if (!secret) {
                this.logger.error('JWT_SECRET_TOKEN is not defined');
                client.emit('error', { message: 'Server configuration error' });
                client.disconnect();
                return;
            }

            const decoded = jwt.verify(token, secret) as unknown as JwtPayload;

            // Store user info on socket
            client.data.user = decoded;
            client.data.userId = decoded.id;
            client.data.role = decoded.role;
            client.data.entityId = decoded.entity_id;

            // Join appropriate rooms based on role
            await this.joinRooms(client, decoded);

            this.logger.log(`Client connected: ${client.id} | User ID: ${decoded.id} | Role: ${decoded.role} | Entity ID: ${decoded.entity_id}`);
        } catch (error) {
            this.logger.error(`Connection error for client ${client.id}: ${error.message}`);
            client.emit('error', { message: 'Authentication failed' });
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    private async joinRooms(client: Socket, user: JwtPayload) {
        const role = user.role;
        const entityId = user.entity_id;

        // Join role-based room
        if (role === 'admin' || role === 'super_admin') {
            await client.join('admin');
            this.logger.log(`Client ${client.id} joined room: admin`);
        }

        if (role === 'shop' && entityId) {
            await client.join(`shop:${entityId}`);
            this.logger.log(`Client ${client.id} joined room: shop:${entityId}`);
        }

        if (role === 'company' && entityId) {
            await client.join(`company:${entityId}`);
            this.logger.log(`Client ${client.id} joined room: company:${entityId}`);
        }

        if (role === 'driver') {
            // For drivers, use user.id (which equals order.driver_id) instead of entity_id (which is company_id)
            await client.join(`driver:${user.id}`);
            this.logger.log(`Client ${client.id} joined room: driver:${user.id}`);
        }
    }

    // ==================== LOCATION TRACKING ====================

    // Driver sends location update via WebSocket
    @SubscribeMessage('driver:updateLocation')
    async handleDriverLocationUpdate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: {
            orderId: number;
            orderNumber: string;
            shopId: number;
            companyId?: number;
            latitude: number;
            longitude: number;
            speed?: number;
            heading?: number;
            accuracy?: number;
        },
    ) {
        // For drivers, entityId equals user_id (driver primary key)
        const driverId = client.data.userId;
        this.logger.log(`[Location] Received from driver ${driverId}: lat=${data.latitude}, lng=${data.longitude}, order=${data.orderId}`);

        if (!driverId || client.data.role !== 'driver') {
            this.logger.warn(`[Location] Unauthorized: client ${client.id}, role=${client.data.role}`);
            return { success: false, error: 'Unauthorized' };
        }

        try {
            // Save driver location to database
            await this.driversService.updateLocation(driverId, {
                latitude: data.latitude,
                longitude: data.longitude,
                speed: data.speed,
                heading: data.heading,
                accuracy: data.accuracy,
                orderId: data.orderId,
            });
            this.logger.log(`[Location] Saved to DB for driver ${driverId}`);

            // Emit location update to relevant parties
            this.emitDriverLocationUpdate({
                ...data,
                driverId,
            });

            return { success: true };
        } catch (error) {
            this.logger.error(`[Location] Failed: ${error.message}`, error.stack);
            return { success: false, error: 'Failed to update location' };
        }
    }

    // Emit driver location update to shop, company, admin
    emitDriverLocationUpdate(data: {
        orderId: number;
        orderNumber: string;
        shopId: number;
        companyId?: number;
        driverId: number;
        latitude: number;
        longitude: number;
        speed?: number;
        heading?: number;
        accuracy?: number;
    }) {
        const payload: OrderEventPayload = {
            eventType: OrderEventType.DRIVER_LOCATION_UPDATED,
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            status: 'tracking',
            shopId: data.shopId,
            companyId: data.companyId,
            driverId: data.driverId,
            timestamp: new Date(),
            location: {
                latitude: data.latitude,
                longitude: data.longitude,
                speed: data.speed,
                heading: data.heading,
                accuracy: data.accuracy,
            },
        };

        // Emit to shop
        this.emitToRoom(`shop:${data.shopId}`, 'orderUpdate', payload);

        // Emit to company if assigned
        if (data.companyId) {
            this.emitToRoom(`company:${data.companyId}`, 'orderUpdate', payload);
        }

        // Emit to admin
        this.emitToRoom('admin', 'orderUpdate', payload);
    }

    // ==================== ORDER EVENTS ====================

    // Emit to specific rooms
    private emitToRoom(room: string, event: string, payload: OrderEventPayload) {
        this.logger.log(`Emitting ${payload.eventType} to room ${room} for order ${payload.orderNumber}`);
        this.server.to(room).emit(event, payload);
    }

    // Emit order created event
    // connectedCompanyIds: array of company IDs connected to the shop (for pending orders)
    emitOrderCreated(order: any, connectedCompanyIds?: number[]) {
        const payload: OrderEventPayload = {
            eventType: OrderEventType.ORDER_CREATED,
            orderId: order.id,
            orderNumber: order.order_number,
            status: order.status,
            shopId: order.shop_id,
            companyId: order.company_id,
            timestamp: new Date(),
            data: order,
        };

        // Emit to shop
        this.emitToRoom(`shop:${order.shop_id}`, 'orderUpdate', payload);

        // Emit to admin
        this.emitToRoom('admin', 'orderUpdate', payload);

        // If assigned to specific company, emit to that company
        if (order.company_id) {
            this.emitToRoom(`company:${order.company_id}`, 'orderUpdate', payload);
        } else if (connectedCompanyIds && connectedCompanyIds.length > 0) {
            // If pending (not assigned), emit to ALL connected companies
            for (const companyId of connectedCompanyIds) {
                this.emitToRoom(`company:${companyId}`, 'orderUpdate', payload);
            }
        }
    }

    // Emit order status changed
    emitOrderStatusChanged(order: any, previousStatus: string) {
        const payload: OrderEventPayload = {
            eventType: OrderEventType.ORDER_STATUS_CHANGED,
            orderId: order.id,
            orderNumber: order.order_number,
            status: order.status,
            shopId: order.shop_id,
            companyId: order.company_id,
            driverId: order.driver_id,
            timestamp: new Date(),
            data: { ...order, previousStatus },
        };

        // Emit to all relevant parties
        this.emitToRoom(`shop:${order.shop_id}`, 'orderUpdate', payload);
        this.emitToRoom('admin', 'orderUpdate', payload);

        if (order.company_id) {
            this.emitToRoom(`company:${order.company_id}`, 'orderUpdate', payload);
        }
        if (order.driver_id) {
            this.emitToRoom(`driver:${order.driver_id}`, 'orderUpdate', payload);
        }
    }

    // Emit order assigned to company
    // connectedCompanyIds: all companies that were showing this order as available
    emitOrderAssignedToCompany(order: any, connectedCompanyIds?: number[]) {
        const payload: OrderEventPayload = {
            eventType: OrderEventType.ORDER_ASSIGNED_TO_COMPANY,
            orderId: order.id,
            orderNumber: order.order_number,
            status: order.status,
            shopId: order.shop_id,
            companyId: order.company_id,
            timestamp: new Date(),
            data: order,
        };

        this.emitToRoom(`shop:${order.shop_id}`, 'orderUpdate', payload);
        this.emitToRoom('admin', 'orderUpdate', payload);

        // Notify the company that took the order
        this.emitToRoom(`company:${order.company_id}`, 'orderUpdate', payload);

        // Also notify all other connected companies so they remove it from available
        if (connectedCompanyIds && connectedCompanyIds.length > 0) {
            for (const cid of connectedCompanyIds) {
                if (cid !== order.company_id) {
                    this.emitToRoom(`company:${cid}`, 'orderUpdate', payload);
                }
            }
        }
    }

    // Emit order assigned to driver
    emitOrderAssignedToDriver(order: any) {
        const payload: OrderEventPayload = {
            eventType: OrderEventType.ORDER_ASSIGNED_TO_DRIVER,
            orderId: order.id,
            orderNumber: order.order_number,
            status: order.status,
            shopId: order.shop_id,
            companyId: order.company_id,
            driverId: order.driver_id,
            timestamp: new Date(),
            data: order,
        };

        this.emitToRoom(`shop:${order.shop_id}`, 'orderUpdate', payload);
        this.emitToRoom(`company:${order.company_id}`, 'orderUpdate', payload);
        this.emitToRoom(`driver:${order.driver_id}`, 'orderUpdate', payload);
        this.emitToRoom('admin', 'orderUpdate', payload);
    }

    // Emit order unassigned from driver
    emitOrderUnassignedFromDriver(order: any, previousDriverId: number) {
        const payload: OrderEventPayload = {
            eventType: OrderEventType.ORDER_UNASSIGNED_FROM_DRIVER,
            orderId: order.id,
            orderNumber: order.order_number,
            status: order.status,
            shopId: order.shop_id,
            companyId: order.company_id,
            driverId: previousDriverId,
            timestamp: new Date(),
            data: order,
        };

        this.emitToRoom(`shop:${order.shop_id}`, 'orderUpdate', payload);
        if (order.company_id) {
            this.emitToRoom(`company:${order.company_id}`, 'orderUpdate', payload);
        }
        // Notify the previous driver that the order was unassigned
        this.emitToRoom(`driver:${previousDriverId}`, 'orderUpdate', payload);
        this.emitToRoom('admin', 'orderUpdate', payload);
    }

    // Emit order picked up
    emitOrderPickedUp(order: any) {
        const payload: OrderEventPayload = {
            eventType: OrderEventType.ORDER_PICKED_UP,
            orderId: order.id,
            orderNumber: order.order_number,
            status: order.status,
            shopId: order.shop_id,
            companyId: order.company_id,
            driverId: order.driver_id,
            timestamp: new Date(),
            data: order,
        };

        this.emitToRoom(`shop:${order.shop_id}`, 'orderUpdate', payload);
        if (order.company_id) {
            this.emitToRoom(`company:${order.company_id}`, 'orderUpdate', payload);
        }
        this.emitToRoom(`driver:${order.driver_id}`, 'orderUpdate', payload);
        this.emitToRoom('admin', 'orderUpdate', payload);
    }

    // Emit order in transit
    emitOrderInTransit(order: any) {
        const payload: OrderEventPayload = {
            eventType: OrderEventType.ORDER_IN_TRANSIT,
            orderId: order.id,
            orderNumber: order.order_number,
            status: order.status,
            shopId: order.shop_id,
            companyId: order.company_id,
            driverId: order.driver_id,
            timestamp: new Date(),
            data: order,
        };

        this.emitToRoom(`shop:${order.shop_id}`, 'orderUpdate', payload);
        if (order.company_id) {
            this.emitToRoom(`company:${order.company_id}`, 'orderUpdate', payload);
        }
        this.emitToRoom(`driver:${order.driver_id}`, 'orderUpdate', payload);
        this.emitToRoom('admin', 'orderUpdate', payload);
    }

    // Emit order delivered
    emitOrderDelivered(order: any) {
        const payload: OrderEventPayload = {
            eventType: OrderEventType.ORDER_DELIVERED,
            orderId: order.id,
            orderNumber: order.order_number,
            status: order.status,
            shopId: order.shop_id,
            companyId: order.company_id,
            driverId: order.driver_id,
            timestamp: new Date(),
            data: order,
        };

        this.emitToRoom(`shop:${order.shop_id}`, 'orderUpdate', payload);
        if (order.company_id) {
            this.emitToRoom(`company:${order.company_id}`, 'orderUpdate', payload);
        }
        if (order.driver_id) {
            this.emitToRoom(`driver:${order.driver_id}`, 'orderUpdate', payload);
        }
        this.emitToRoom('admin', 'orderUpdate', payload);
    }

    // Emit order cancelled
    // connectedCompanyIds: for pending orders, all companies that were showing it as available
    emitOrderCancelled(order: any, connectedCompanyIds?: number[]) {
        const payload: OrderEventPayload = {
            eventType: OrderEventType.ORDER_CANCELLED,
            orderId: order.id,
            orderNumber: order.order_number,
            status: order.status,
            shopId: order.shop_id,
            companyId: order.company_id,
            driverId: order.driver_id,
            timestamp: new Date(),
            data: order,
        };

        this.emitToRoom(`shop:${order.shop_id}`, 'orderUpdate', payload);
        this.emitToRoom('admin', 'orderUpdate', payload);

        // Notify assigned company if any
        if (order.company_id) {
            this.emitToRoom(`company:${order.company_id}`, 'orderUpdate', payload);
        }

        // Notify assigned driver if any
        if (order.driver_id) {
            this.emitToRoom(`driver:${order.driver_id}`, 'orderUpdate', payload);
        }

        // Notify all connected companies (for pending orders that were visible to all)
        if (connectedCompanyIds && connectedCompanyIds.length > 0) {
            for (const cid of connectedCompanyIds) {
                if (cid !== order.company_id) {
                    this.emitToRoom(`company:${cid}`, 'orderUpdate', payload);
                }
            }
        }
    }

    // Emit order released (back to available pool)
    emitOrderReleased(order: any, previousCompanyId?: number, previousDriverId?: number) {
        const payload: OrderEventPayload = {
            eventType: OrderEventType.ORDER_RELEASED,
            orderId: order.id,
            orderNumber: order.order_number,
            status: order.status,
            shopId: order.shop_id,
            timestamp: new Date(),
            data: order,
        };

        this.emitToRoom(`shop:${order.shop_id}`, 'orderUpdate', payload);
        this.emitToRoom('admin', 'orderUpdate', payload);

        // Notify previous company if any
        if (previousCompanyId) {
            this.emitToRoom(`company:${previousCompanyId}`, 'orderUpdate', payload);
        }
        // Notify previous driver if any
        if (previousDriverId) {
            this.emitToRoom(`driver:${previousDriverId}`, 'orderUpdate', payload);
        }
    }

    // Emit order updated (general details update)
    emitOrderUpdated(order: any) {
        const payload: OrderEventPayload = {
            eventType: OrderEventType.ORDER_UPDATED,
            orderId: order.id,
            orderNumber: order.order_number,
            status: order.status,
            shopId: order.shop_id,
            companyId: order.company_id,
            driverId: order.driver_id,
            timestamp: new Date(),
            data: order,
        };

        this.emitToRoom(`shop:${order.shop_id}`, 'orderUpdate', payload);
        this.emitToRoom('admin', 'orderUpdate', payload);

        if (order.company_id) {
            this.emitToRoom(`company:${order.company_id}`, 'orderUpdate', payload);
        }
        if (order.driver_id) {
            this.emitToRoom(`driver:${order.driver_id}`, 'orderUpdate', payload);
        }
    }
}
