import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

// Event types matching backend
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
    DRIVER_LOCATION_UPDATED = 'driver_location_updated',
}

// Payload interface for order events
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

// Connection state
export enum ConnectionState {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    RECONNECTING = 'reconnecting',
    ERROR = 'error',
}

// Queued event for offline handling
interface QueuedEvent {
    event: string;
    data: any;
    timestamp: Date;
}

@Injectable({
    providedIn: 'root'
})
export class SocketService implements OnDestroy {
    private socket: Socket | null = null;
    private destroy$ = new Subject<void>();

    // Connection state
    private connectionState$ = new BehaviorSubject<ConnectionState>(ConnectionState.DISCONNECTED);

    // Generic order update (any order event)
    private orderUpdate$ = new Subject<OrderEventPayload>();

    // Offline queue for events that couldn't be sent
    private offlineQueue: QueuedEvent[] = [];
    private maxQueueSize = 100;

    // Reconnection settings
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectDelay = 1000; // Start with 1 second

    constructor() {
        // Listen for online/offline events
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.handleOnline());
            window.addEventListener('offline', () => this.handleOffline());
        }
    }

    // Get current connection state
    getConnectionState(): Observable<ConnectionState> {
        return this.connectionState$.asObservable();
    }

    // Check if connected
    isConnected(): boolean {
        return this.connectionState$.value === ConnectionState.CONNECTED;
    }

    // Connect to WebSocket server
    connect(): void {
        if (this.socket?.connected) {
            return;
        }

        // Get token from localStorage
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            return;
        }

        let token: string;
        try {
            const user = JSON.parse(currentUser);
            token = user.accessToken;
            if (!token) {
                return;
            }
        } catch (e) {
            console.error('[Socket] Failed to parse user data:', e);
            return;
        }

        this.connectionState$.next(ConnectionState.CONNECTING);

        // Build WebSocket URL from API URL
        const baseUrl = environment.apiUrl.replace('/api', '');

        this.socket = io(baseUrl + '/orders', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.reconnectDelay,
            reconnectionDelayMax: 10000,
            timeout: 20000,
        });

        this.setupEventListeners();
    }

    // Disconnect from WebSocket server
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.connectionState$.next(ConnectionState.DISCONNECTED);
    }

    // Setup all event listeners
    private setupEventListeners(): void {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            this.connectionState$.next(ConnectionState.CONNECTED);
            this.reconnectAttempts = 0;
            this.processOfflineQueue();
        });

        this.socket.on('disconnect', (reason) => {
            this.connectionState$.next(ConnectionState.DISCONNECTED);
        });

        this.socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error.message);
            this.connectionState$.next(ConnectionState.ERROR);
        });

        this.socket.on('reconnect_attempt', (attempt) => {
            this.connectionState$.next(ConnectionState.RECONNECTING);
            this.reconnectAttempts = attempt;
        });

        this.socket.on('reconnect', () => {
            this.connectionState$.next(ConnectionState.CONNECTED);
            this.processOfflineQueue();
        });

        this.socket.on('error', (error) => {
            console.error('[Socket] Error:', error);
        });

        // Listen for the main orderUpdate event from backend
        this.socket.on('orderUpdate', (payload: OrderEventPayload) => {
            this.orderUpdate$.next(payload);
        });
    }

    // ==================== OBSERVABLE GETTERS ====================

    // Get all order updates (any event)
    onOrderUpdate(): Observable<OrderEventPayload> {
        return this.orderUpdate$.asObservable();
    }

    onOrderCreated(): Observable<OrderEventPayload> {
        return this.orderUpdate$.pipe(
            filter(payload => payload.eventType === OrderEventType.ORDER_CREATED)
        );
    }

    onOrderStatusChanged(): Observable<OrderEventPayload> {
        return this.orderUpdate$.pipe(
            filter(payload => payload.eventType === OrderEventType.ORDER_STATUS_CHANGED)
        );
    }

    onOrderAssignedToCompany(): Observable<OrderEventPayload> {
        return this.orderUpdate$.pipe(
            filter(payload => payload.eventType === OrderEventType.ORDER_ASSIGNED_TO_COMPANY)
        );
    }

    onOrderAssignedToDriver(): Observable<OrderEventPayload> {
        return this.orderUpdate$.pipe(
            filter(payload => payload.eventType === OrderEventType.ORDER_ASSIGNED_TO_DRIVER)
        );
    }

    onOrderUnassignedFromDriver(): Observable<OrderEventPayload> {
        return this.orderUpdate$.pipe(
            filter(payload => payload.eventType === OrderEventType.ORDER_UNASSIGNED_FROM_DRIVER)
        );
    }

    onOrderPickedUp(): Observable<OrderEventPayload> {
        return this.orderUpdate$.pipe(
            filter(payload => payload.eventType === OrderEventType.ORDER_PICKED_UP)
        );
    }

    onOrderInTransit(): Observable<OrderEventPayload> {
        return this.orderUpdate$.pipe(
            filter(payload => payload.eventType === OrderEventType.ORDER_IN_TRANSIT)
        );
    }

    onOrderDelivered(): Observable<OrderEventPayload> {
        return this.orderUpdate$.pipe(
            filter(payload => payload.eventType === OrderEventType.ORDER_DELIVERED)
        );
    }

    onOrderCancelled(): Observable<OrderEventPayload> {
        return this.orderUpdate$.pipe(
            filter(payload => payload.eventType === OrderEventType.ORDER_CANCELLED)
        );
    }

    onOrderReleased(): Observable<OrderEventPayload> {
        return this.orderUpdate$.pipe(
            filter(payload => payload.eventType === OrderEventType.ORDER_RELEASED)
        );
    }

    // Listen for driver location updates (for tracking on map)
    onDriverLocationUpdate(): Observable<OrderEventPayload> {
        return this.orderUpdate$.pipe(
            filter(payload => payload.eventType === OrderEventType.DRIVER_LOCATION_UPDATED)
        );
    }

    // Filter location updates for a specific order
    onOrderLocationUpdate(orderId: number): Observable<OrderEventPayload> {
        return this.orderUpdate$.pipe(
            filter(payload =>
                payload.eventType === OrderEventType.DRIVER_LOCATION_UPDATED &&
                payload.orderId === orderId
            )
        );
    }

    // ==================== EMIT METHODS ====================

    // Driver sends location update (called from driver app)
    sendDriverLocation(data: {
        orderId: number;
        orderNumber: string;
        shopId: number;
        companyId?: number;
        latitude: number;
        longitude: number;
        speed?: number;
        heading?: number;
        accuracy?: number;
    }): void {
        if (this.isConnected()) {
            this.socket?.emit('driver:updateLocation', data);
        }
    }

    // Subscribe to a specific order's updates
    subscribeToOrder(orderId: number): void {
        if (this.isConnected()) {
            this.socket?.emit('subscribe:order', { orderId });
        } else {
            this.addToQueue('subscribe:order', { orderId });
        }
    }

    // Unsubscribe from a specific order
    unsubscribeFromOrder(orderId: number): void {
        if (this.isConnected()) {
            this.socket?.emit('unsubscribe:order', { orderId });
        }
    }

    // ==================== OFFLINE QUEUE ====================

    private addToQueue(event: string, data: any): void {
        if (this.offlineQueue.length >= this.maxQueueSize) {
            // Remove oldest event
            this.offlineQueue.shift();
        }

        this.offlineQueue.push({
            event,
            data,
            timestamp: new Date(),
        });

    }

    private processOfflineQueue(): void {
        if (this.offlineQueue.length === 0) return;


        while (this.offlineQueue.length > 0) {
            const queuedEvent = this.offlineQueue.shift();
            if (queuedEvent && this.isConnected()) {
                // Only process events that are less than 5 minutes old
                const age = Date.now() - queuedEvent.timestamp.getTime();
                if (age < 5 * 60 * 1000) {
                    this.socket?.emit(queuedEvent.event, queuedEvent.data);
                }
            }
        }
    }

    // ==================== ONLINE/OFFLINE HANDLERS ====================

    private handleOnline(): void {
        if (this.socket && !this.socket.connected) {
            this.socket.connect();
        }
    }

    private handleOffline(): void {
        this.connectionState$.next(ConnectionState.DISCONNECTED);
    }

    // ==================== CLEANUP ====================

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.disconnect();

        if (typeof window !== 'undefined') {
            window.removeEventListener('online', () => this.handleOnline());
            window.removeEventListener('offline', () => this.handleOffline());
        }
    }
}
