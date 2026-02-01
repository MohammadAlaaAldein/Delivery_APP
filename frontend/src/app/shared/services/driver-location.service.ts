import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { SocketService } from './socket.service';

export interface LocationData {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
}

export interface ActiveOrder {
    id: number;
    order_number: string;
    shop_id: number;
    company_id?: number;
}

@Injectable({
    providedIn: 'root'
})
export class DriverLocationService implements OnDestroy {
    private watchId: number | null = null;
    private activeOrder: ActiveOrder | null = null;
    private updateInterval: any = null;
    private lastLocation: LocationData | null = null;

    // Location update interval in milliseconds (5 seconds)
    private readonly UPDATE_INTERVAL = 5000;

    // Status subjects
    private isTracking$ = new BehaviorSubject<boolean>(false);
    private locationError$ = new Subject<string>();
    private currentLocation$ = new BehaviorSubject<LocationData | null>(null);

    constructor(private socketService: SocketService) { }

    /**
     * Start tracking driver location for an active order
     * Call this when order status changes to PICKED_UP or IN_TRANSIT
     */
    startTracking(order: ActiveOrder): void {
        if (this.watchId !== null) {
            console.log('[DriverLocation] Already tracking, stopping previous tracking');
            this.stopTracking();
        }

        this.activeOrder = order;
        console.log('[DriverLocation] Starting tracking for order:', order.order_number);

        // Check if geolocation is available
        if (!navigator.geolocation) {
            this.locationError$.next('Geolocation is not supported by this browser');
            return;
        }

        // Request permission and start watching position
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Initial position obtained, start watching
                this.startWatching();
            },
            (error) => {
                this.handleGeolocationError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    /**
     * Stop tracking driver location
     * Call this when order is delivered or cancelled
     */
    stopTracking(): void {
        console.log('[DriverLocation] Stopping tracking');

        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.activeOrder = null;
        this.lastLocation = null;
        this.isTracking$.next(false);
    }

    /**
     * Check if currently tracking
     */
    get isTracking(): boolean {
        return this.isTracking$.value;
    }

    /**
     * Observable for tracking status
     */
    get trackingStatus$() {
        return this.isTracking$.asObservable();
    }

    /**
     * Observable for location errors
     */
    get errors$() {
        return this.locationError$.asObservable();
    }

    /**
     * Observable for current location
     */
    get location$() {
        return this.currentLocation$.asObservable();
    }

    private startWatching(): void {
        this.isTracking$.next(true);

        // Watch position with high accuracy
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.lastLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    speed: position.coords.speed ? position.coords.speed * 3.6 : undefined, // Convert m/s to km/h
                    heading: position.coords.heading || undefined,
                    accuracy: position.coords.accuracy,
                };
                this.currentLocation$.next(this.lastLocation);
            },
            (error) => {
                this.handleGeolocationError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 1000
            }
        );

        // Send location updates at regular intervals
        this.updateInterval = setInterval(() => {
            this.sendLocationUpdate();
        }, this.UPDATE_INTERVAL);

        // Send initial location immediately
        setTimeout(() => this.sendLocationUpdate(), 500);
    }

    private sendLocationUpdate(): void {
        if (!this.lastLocation || !this.activeOrder) {
            return;
        }

        console.log('[DriverLocation] Sending location update:', this.lastLocation);

        this.socketService.sendDriverLocation({
            orderId: this.activeOrder.id,
            orderNumber: this.activeOrder.order_number,
            shopId: this.activeOrder.shop_id,
            companyId: this.activeOrder.company_id,
            latitude: this.lastLocation.latitude,
            longitude: this.lastLocation.longitude,
            speed: this.lastLocation.speed,
            heading: this.lastLocation.heading,
            accuracy: this.lastLocation.accuracy,
        });
    }

    private handleGeolocationError(error: GeolocationPositionError): void {
        let message = 'Unknown error occurred';

        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location permission denied. Please enable location access.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information is unavailable.';
                break;
            case error.TIMEOUT:
                message = 'Location request timed out.';
                break;
        }

        console.error('[DriverLocation] Error:', message);
        this.locationError$.next(message);
    }

    ngOnDestroy(): void {
        this.stopTracking();
    }
}
