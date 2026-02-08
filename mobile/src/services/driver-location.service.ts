import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { socketService, SOCKET_EVENTS } from './socket.service';

const TRACKING_INTERVAL = 5000; // 5 seconds

class DriverLocationService {
    private watchId: Location.LocationSubscription | null = null;
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private isTracking = false;
    private currentOrderId: number | null = null;
    private currentOrderNumber: string | null = null;
    private currentShopId: number | null = null;
    private currentCompanyId: number | null = null;
    private lastLatitude: number | null = null;
    private lastLongitude: number | null = null;
    private lastSpeed: number | null = null;
    private lastHeading: number | null = null;
    private lastAccuracy: number | null = null;

    /**
     * Start tracking driver location for a specific order.
     * Sends location updates via socket every 5 seconds and also updates backend.
     */
    async startTracking(params: {
        orderId: number;
        orderNumber?: string;
        shopId?: number;
        companyId?: number;
    }): Promise<boolean> {
        if (this.isTracking) {
            // Already tracking - update the order context
            this.currentOrderId = params.orderId;
            this.currentOrderNumber = params.orderNumber || null;
            this.currentShopId = params.shopId || null;
            this.currentCompanyId = params.companyId || null;
            return true;
        }

        try {
            // Request permissions
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
            if (foregroundStatus !== 'granted') {
                console.warn('[DriverLocation] Foreground location permission denied');
                return false;
            }

            // Try background permission (optional, for when app is backgrounded)
            if (Platform.OS !== 'web') {
                const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
                if (backgroundStatus !== 'granted') {
                    console.warn('[DriverLocation] Background location permission denied, tracking will only work in foreground');
                }
            }

            this.currentOrderId = params.orderId;
            this.currentOrderNumber = params.orderNumber || null;
            this.currentShopId = params.shopId || null;
            this.currentCompanyId = params.companyId || null;

            // Watch position for real-time location
            this.watchId = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: TRACKING_INTERVAL,
                    distanceInterval: 5, // minimum meters before update
                },
                (location) => {
                    this.lastLatitude = location.coords.latitude;
                    this.lastLongitude = location.coords.longitude;
                    this.lastSpeed = location.coords.speed;
                    this.lastHeading = location.coords.heading;
                    this.lastAccuracy = location.coords.accuracy;
                }
            );

            // Also set up interval to send location via socket
            this.intervalId = setInterval(() => {
                this.sendLocationUpdate();
            }, TRACKING_INTERVAL);

            this.isTracking = true;
            console.log('[DriverLocation] Tracking started for order:', params.orderId);
            return true;
        } catch (error) {
            console.error('[DriverLocation] Failed to start tracking:', error);
            return false;
        }
    }

    /**
     * Stop tracking driver location.
     */
    async stopTracking(): Promise<void> {
        if (this.watchId) {
            this.watchId.remove();
            this.watchId = null;
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isTracking = false;
        this.currentOrderId = null;
        this.currentOrderNumber = null;
        this.currentShopId = null;
        this.currentCompanyId = null;

        console.log('[DriverLocation] Tracking stopped');
    }

    /**
     * Send current location via socket and update backend.
     */
    private async sendLocationUpdate(): Promise<void> {
        if (!this.lastLatitude || !this.lastLongitude) {
            return;
        }

        const locationData = {
            orderId: this.currentOrderId,
            orderNumber: this.currentOrderNumber,
            shopId: this.currentShopId,
            companyId: this.currentCompanyId,
            latitude: this.lastLatitude,
            longitude: this.lastLongitude,
            speed: this.lastSpeed,
            heading: this.lastHeading,
            accuracy: this.lastAccuracy,
            timestamp: new Date().toISOString(),
        };

        // Send via socket for real-time tracking (backend saves to DB)
        socketService.emit(SOCKET_EVENTS.DRIVER_UPDATE_LOCATION, locationData);
    }

    /**
     * Get current tracking status.
     */
    getStatus(): { isTracking: boolean; orderId: number | null; latitude: number | null; longitude: number | null } {
        return {
            isTracking: this.isTracking,
            orderId: this.currentOrderId,
            latitude: this.lastLatitude,
            longitude: this.lastLongitude,
        };
    }

    /**
     * Check if currently tracking.
     */
    isCurrentlyTracking(): boolean {
        return this.isTracking;
    }
}

export const driverLocationService = new DriverLocationService();
export default driverLocationService;
