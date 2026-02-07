import { io, Socket } from 'socket.io-client';
import * as SecureStore from './secure-store';
import { SOCKET_CONFIG, STORAGE_KEYS } from '../constants';
import { Order, SocketEvent } from '../types';

// Socket event names
export const SOCKET_EVENTS = {
    // Connection events
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
    RECONNECT: 'reconnect',

    // Order events
    ORDER_CREATED: 'order:created',
    ORDER_UPDATED: 'order:updated',
    ORDER_ASSIGNED_TO_COMPANY: 'order:assigned_to_company',
    ORDER_ASSIGNED_TO_DRIVER: 'order:assigned_to_driver',
    ORDER_UNASSIGNED_FROM_DRIVER: 'order:unassigned_from_driver',
    ORDER_RELEASED: 'order:released',
    ORDER_PICKED_UP: 'order:picked_up',
    ORDER_IN_TRANSIT: 'order:in_transit',
    ORDER_DELIVERED: 'order:delivered',
    ORDER_CANCELLED: 'order:cancelled',

    // Driver events
    DRIVER_LOCATION_UPDATE: 'driver:location_update',

    // Room events
    JOIN_ROOM: 'join:room',
    LEAVE_ROOM: 'leave:room',
};

// Room types
export const ROOMS = {
    SHOP: (shopId: number) => `shop:${shopId}`,
    COMPANY: (companyId: number) => `company:${companyId}`,
    DRIVER: (driverId: number) => `driver:${driverId}`,
    ORDER: (orderId: number) => `order:${orderId}`,
    AVAILABLE_ORDERS: 'available_orders',
};

type EventCallback<T = any> = (data: T) => void;

class SocketService {
    private socket: Socket | null = null;
    private isConnected = false;
    private eventCallbacks: Map<string, Set<EventCallback>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;

    // Connect to socket server
    async connect(): Promise<void> {
        if (this.socket?.connected) {
            return;
        }

        try {
            const token = await SecureStore.getItemAsync(STORAGE_KEYS.accessToken);
            if (!token) {
                console.warn('No token available for socket connection');
                return;
            }

            this.socket = io(SOCKET_CONFIG.url, {
                ...SOCKET_CONFIG.options,
                auth: {
                    token,
                },
            });

            this.setupEventListeners();
        } catch (error) {
            console.error('Socket connection error:', error);
        }
    }

    // Setup socket event listeners
    private setupEventListeners(): void {
        if (!this.socket) return;

        this.socket.on(SOCKET_EVENTS.CONNECT, () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emitEvent(SOCKET_EVENTS.CONNECT, null);
        });

        this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
            this.isConnected = false;
            this.emitEvent(SOCKET_EVENTS.DISCONNECT, reason);
        });

        this.socket.on(SOCKET_EVENTS.ERROR, (error: any) => {
            console.error('Socket error:', error);
            this.emitEvent(SOCKET_EVENTS.ERROR, error);
        });

        this.socket.on(SOCKET_EVENTS.RECONNECT, (attemptNumber: number) => {
            this.reconnectAttempts = 0;
            this.emitEvent(SOCKET_EVENTS.RECONNECT, attemptNumber);
        });

        // Main order update event from backend - distributes to specific event callbacks
        this.socket.on('orderUpdate', (payload: any) => {
            // Emit to generic orderUpdate listeners
            this.emitEvent('orderUpdate', payload);

            // Also emit to specific event listeners based on eventType
            const eventType = payload.eventType;
            const eventMap: Record<string, string> = {
                'order_created': SOCKET_EVENTS.ORDER_CREATED,
                'order_updated': SOCKET_EVENTS.ORDER_UPDATED,
                'order_assigned_to_company': SOCKET_EVENTS.ORDER_ASSIGNED_TO_COMPANY,
                'order_assigned_to_driver': SOCKET_EVENTS.ORDER_ASSIGNED_TO_DRIVER,
                'order_unassigned_from_driver': SOCKET_EVENTS.ORDER_UNASSIGNED_FROM_DRIVER,
                'order_released': SOCKET_EVENTS.ORDER_RELEASED,
                'order_picked_up': SOCKET_EVENTS.ORDER_PICKED_UP,
                'order_in_transit': SOCKET_EVENTS.ORDER_IN_TRANSIT,
                'order_delivered': SOCKET_EVENTS.ORDER_DELIVERED,
                'order_cancelled': SOCKET_EVENTS.ORDER_CANCELLED,
                'driver_location_update': SOCKET_EVENTS.DRIVER_LOCATION_UPDATE,
            };

            if (eventType && eventMap[eventType]) {
                this.emitEvent(eventMap[eventType], payload.data || payload);
            }
        });

        // Driver location updates (might come separately)
        this.socket.on(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, (data: any) => {
            this.emitEvent(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, data);
        });
    }

    // Emit event to callbacks
    private emitEvent<T>(event: string, data: T): void {
        const callbacks = this.eventCallbacks.get(event);
        if (callbacks) {
            callbacks.forEach((callback) => callback(data));
        }
    }

    // Subscribe to event
    on<T = any>(event: string, callback: EventCallback<T>): () => void {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, new Set());
        }
        this.eventCallbacks.get(event)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.eventCallbacks.get(event)?.delete(callback);
        };
    }

    // Unsubscribe from event
    off(event: string, callback?: EventCallback): void {
        if (callback) {
            this.eventCallbacks.get(event)?.delete(callback);
        } else {
            this.eventCallbacks.delete(event);
        }
    }

    // Join a room
    joinRoom(room: string): void {
        if (this.socket?.connected) {
            this.socket.emit(SOCKET_EVENTS.JOIN_ROOM, room);
        }
    }

    // Leave a room
    leaveRoom(room: string): void {
        if (this.socket?.connected) {
            this.socket.emit(SOCKET_EVENTS.LEAVE_ROOM, room);
        }
    }

    // Emit event to server
    emit(event: string, data?: any): void {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        }
    }

    // Disconnect socket
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.eventCallbacks.clear();
        }
    }

    // Check connection status
    isSocketConnected(): boolean {
        return this.isConnected;
    }

    // Get socket instance
    getSocket(): Socket | null {
        return this.socket;
    }

    // Reconnect
    async reconnect(): Promise<void> {
        this.disconnect();
        await this.connect();
    }
}

export const socketService = new SocketService();
export default socketService;
