import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService, OrderEventPayload, OrderEventType } from '../../services/socket.service';
import { Subject, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Extend Window interface for Google Maps
declare global {
    interface Window {
        google: any;
        initMap: () => void;
    }
}

// Order interface for tracking
export interface TrackableOrder {
    id: number;
    order_number: string;
    status: string;
    shop_id: number;
    company_id?: number;
    driver_id?: number;
    delivery_address?: string;
    delivery_city?: string;
    delivery_latitude?: number;
    delivery_longitude?: number;
    shop?: {
        name?: string;
        address?: string;
        city?: string;
        latitude?: number;
        longitude?: number;
    };
    driver?: {
        user_id: number;
        phone?: string;
        vehicle_type?: string;
        vehicle_brand?: string;
        vehicle_model?: string;
        vehicle_color?: string;
        plate_number?: string;
        current_location?: {
            latitude: number;
            longitude: number;
            speed?: number;
            heading?: number;
            accuracy?: number;
            updatedAt?: Date;
        };
        user?: {
            name?: string;
        };
    };
}

@Component({
    selector: 'app-order-tracking-map',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    template: `
        <div class="tracking-container">
            <div class="tracking-header" *ngIf="order">
                <div class="status-badge" [class]="isTrackingActive ? 'active' : 'inactive'">
                    <span class="dot"></span>
                    {{ isTrackingActive ? translate.instant('tracking.live') : translate.instant('tracking.not_available') }}
                </div>
                <div class="driver-info" *ngIf="order.driver && isTrackingActive">
                    <div class="driver-name">{{ order.driver.user?.name }}</div>
                    <div class="vehicle-info">
                        {{ order.driver.vehicle_brand }} {{ order.driver.vehicle_model }} 
                        <span class="plate">{{ order.driver.plate_number }}</span>
                    </div>
                </div>
            </div>
            
            <div class="map-container">
                <div #mapElement class="map" id="tracking-map-{{ order?.id }}"></div>
                
                <div class="loading-overlay" *ngIf="loading">
                    <div class="spinner"></div>
                    <span>{{ translate.instant('tracking.loading_map') }}</span>
                </div>
                
                <div class="no-tracking-overlay" *ngIf="!loading && !isTrackingActive">
                    <div class="message">
                        <i class="fas fa-map-marker-alt"></i>
                        <p>{{ translate.instant('tracking.not_available_message') }}</p>
                    </div>
                </div>
            </div>
            
            <div class="tracking-stats" *ngIf="currentLocation && isTrackingActive">
                <div class="stat" *ngIf="currentLocation.speed !== undefined">
                    <span class="label">{{ translate.instant('tracking.speed') }}</span>
                    <span class="value">{{ currentLocation.speed | number:'1.0-0' }} km/h</span>
                </div>
                <div class="stat">
                    <span class="label">{{ translate.instant('tracking.last_update') }}</span>
                    <span class="value">{{ lastUpdateTime }}</span>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .tracking-container {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
            background: #fff;
        }
        
        .tracking-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #f8f9fa;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .status-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }
        
        .status-badge.active {
            background: #e8f5e9;
            color: #2e7d32;
        }
        
        .status-badge.inactive {
            background: #fafafa;
            color: #757575;
        }
        
        .status-badge .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
        }
        
        .status-badge.active .dot {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .driver-info {
            text-align: right;
        }
        
        .driver-name {
            font-weight: 600;
            color: #333;
        }
        
        .vehicle-info {
            font-size: 13px;
            color: #666;
        }
        
        .vehicle-info .plate {
            background: #e3f2fd;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 500;
        }
        
        .map-container {
            position: relative;
            height: 400px;
        }
        
        .map {
            width: 100%;
            height: 100%;
        }
        
        .loading-overlay, .no-tracking-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.9);
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e0e0e0;
            border-top-color: #1976d2;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 12px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .no-tracking-overlay .message {
            text-align: center;
            color: #666;
        }
        
        .no-tracking-overlay .message i {
            font-size: 48px;
            color: #bdbdbd;
            margin-bottom: 12px;
        }
        
        .tracking-stats {
            display: flex;
            gap: 24px;
            padding: 12px 16px;
            background: #fafafa;
            border-top: 1px solid #e0e0e0;
        }
        
        .stat {
            display: flex;
            flex-direction: column;
        }
        
        .stat .label {
            font-size: 12px;
            color: #666;
        }
        
        .stat .value {
            font-weight: 600;
            color: #333;
        }
    `]
})
export class OrderTrackingMapComponent implements OnInit, OnDestroy, OnChanges {
    @Input() order!: TrackableOrder;
    @Input() apiKey: string = ''; // Google Maps API key

    @ViewChild('mapElement') mapElement!: ElementRef;

    private destroy$ = new Subject<void>();
    private map: any;
    private driverMarker: any;
    private pickupMarker: any;
    private deliveryMarker: any;
    private routePath: any;
    private googleMapsLoaded = false;

    loading = true;
    currentLocation: { latitude: number; longitude: number; speed?: number; heading?: number } | null = null;
    lastUpdateTime: string = '';

    // Tracking is active when order is PICKED_UP or IN_TRANSIT
    get isTrackingActive(): boolean {
        return this.order && ['picked_up', 'in_transit'].includes(this.order.status);
    }

    constructor(
        private socketService: SocketService,
        public translate: TranslateService
    ) { }

    ngOnInit(): void {
        // Socket should already be connected by admin.component.ts
        // Just log connection status for debugging
        console.log('[TrackingMap] Socket connected:', this.socketService.isConnected());
        this.loadGoogleMaps();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['order'] && !changes['order'].firstChange) {
            this.setupTracking();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadGoogleMaps(): void {
        if (window.google && window.google.maps) {
            this.googleMapsLoaded = true;
            this.initializeMap();
            return;
        }

        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&callback=initMap`;
        script.async = true;
        script.defer = true;

        window.initMap = () => {
            this.googleMapsLoaded = true;
            this.initializeMap();
        };

        document.head.appendChild(script);
    }

    private initializeMap(): void {
        if (!this.mapElement?.nativeElement) {
            setTimeout(() => this.initializeMap(), 100);
            return;
        }

        // Default center (can be changed based on tracking data)
        const defaultCenter = { lat: 31.9539, lng: 35.9106 }; // Jordan center

        this.map = new window.google.maps.Map(this.mapElement.nativeElement, {
            center: defaultCenter,
            zoom: 13,
            mapTypeControl: false,
            fullscreenControl: true,
            streetViewControl: false,
        });

        this.setupTracking();
    }

    private setupTracking(): void {
        if (!this.order || !this.map) return;

        this.loading = false;

        // Setup markers for pickup and delivery
        this.setupMapMarkers();

        // If driver has current location, show it
        if (this.order.driver?.current_location) {
            this.currentLocation = this.order.driver.current_location;
            this.updateDriverPosition(this.order.driver.current_location);
            this.updateLastUpdateTime();
        }

        // Subscribe to real-time location updates via existing socket connection
        this.subscribeToLocationUpdates();
    }

    private subscribeToLocationUpdates(): void {
        console.log('[TrackingMap] Subscribing to location updates for order:', this.order.id);

        // Listen for location updates for this specific order
        this.socketService.onOrderLocationUpdate(this.order.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe((payload: OrderEventPayload) => {
                console.log('[TrackingMap] Received location update:', payload);
                if (payload.location) {
                    this.currentLocation = payload.location;
                    this.updateDriverPosition(payload.location);
                    this.updateLastUpdateTime();
                }
            });

        // Also listen for ALL driver location updates (debugging)
        this.socketService.onDriverLocationUpdate()
            .pipe(takeUntil(this.destroy$))
            .subscribe((payload: OrderEventPayload) => {
                console.log('[TrackingMap] Received any driver location update:', payload.orderId, 'my order:', this.order.id);
                // Check if this is our order
                if (payload.orderId === this.order.id && payload.location) {
                    this.currentLocation = payload.location;
                    this.updateDriverPosition(payload.location);
                    this.updateLastUpdateTime();
                }
            });

        // Also listen for order status changes (to update tracking availability)
        this.socketService.onOrderUpdate()
            .pipe(takeUntil(this.destroy$))
            .subscribe((payload: OrderEventPayload) => {
                if (payload.orderId === this.order.id) {
                    console.log('[TrackingMap] Order status update:', payload.eventType);
                    // Update order status if changed
                    if (payload.eventType === OrderEventType.ORDER_DELIVERED ||
                        payload.eventType === OrderEventType.ORDER_CANCELLED) {
                        // Tracking stopped
                        this.order.status = payload.status;
                    }
                }
            });
    }

    private setupMapMarkers(): void {
        // Clear existing markers
        if (this.pickupMarker) this.pickupMarker.setMap(null);
        if (this.deliveryMarker) this.deliveryMarker.setMap(null);

        const bounds = new window.google.maps.LatLngBounds();

        // Pickup marker (shop location)
        if (this.order.shop?.latitude && this.order.shop?.longitude) {
            const pickupPosition = { lat: this.order.shop.latitude, lng: this.order.shop.longitude };
            this.pickupMarker = new window.google.maps.Marker({
                position: pickupPosition,
                map: this.map,
                icon: {
                    url: 'data:image/svg+xml,' + encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                            <circle cx="12" cy="12" r="10" fill="#4CAF50" stroke="#fff" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">P</text>
                        </svg>
                    `),
                    scaledSize: new window.google.maps.Size(32, 32),
                },
                title: 'Pickup: ' + (this.order.shop.address || this.order.shop.name),
            });
            bounds.extend(pickupPosition);
        }

        // Delivery marker
        if (this.order.delivery_latitude && this.order.delivery_longitude) {
            const deliveryPosition = { lat: this.order.delivery_latitude, lng: this.order.delivery_longitude };
            this.deliveryMarker = new window.google.maps.Marker({
                position: deliveryPosition,
                map: this.map,
                icon: {
                    url: 'data:image/svg+xml,' + encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                            <circle cx="12" cy="12" r="10" fill="#F44336" stroke="#fff" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">D</text>
                        </svg>
                    `),
                    scaledSize: new window.google.maps.Size(32, 32),
                },
                title: 'Delivery: ' + this.order.delivery_address,
            });
            bounds.extend(deliveryPosition);
        }

        // Fit map to show all markers
        if (!bounds.isEmpty()) {
            this.map.fitBounds(bounds, { padding: 50 });
        }
    }

    private updateDriverPosition(location: { latitude: number; longitude: number; speed?: number; heading?: number }): void {
        console.log('[TrackingMap] Updating driver position:', location.latitude, location.longitude);
        const position = { lat: location.latitude, lng: location.longitude };

        if (!this.driverMarker) {
            console.log('[TrackingMap] Creating new driver marker');
            // Create driver marker
            this.driverMarker = new window.google.maps.Marker({
                position: position,
                map: this.map,
                icon: this.getDriverIcon(location.heading),
                title: 'Driver',
                zIndex: 1000, // Make sure driver marker is on top
            });
        } else {
            console.log('[TrackingMap] Moving existing driver marker');
            // Update marker position
            this.driverMarker.setPosition(position);
            this.driverMarker.setIcon(this.getDriverIcon(location.heading));
        }

        // Pan map to follow driver
        this.map.panTo(position);

        // Add to route path
        this.addToRoutePath(position);
    }

    private getDriverIcon(heading?: number): any {
        const rotation = heading || 0;
        const vehicleType = this.order?.driver?.vehicle_type || 'car';

        // Get SVG based on vehicle type
        const svgContent = this.getVehicleSvg(vehicleType, rotation);

        return {
            url: 'data:image/svg+xml,' + encodeURIComponent(svgContent),
            scaledSize: new window.google.maps.Size(56, 56),
            anchor: new window.google.maps.Point(28, 28),
        };
    }

    private getVehicleSvg(vehicleType: string, rotation: number): string {
        // Clear, recognizable vehicle icons with distinct colors and shapes
        switch (vehicleType?.toLowerCase()) {
            case 'motorcycle':
                // Pink/Magenta background with motorcycle shape
                return `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" width="56" height="56">
                        <circle cx="28" cy="28" r="26" fill="#E91E63" stroke="#fff" stroke-width="3"/>
                        <g fill="#fff" transform="rotate(${rotation} 28 28)">
                            <!-- Motorcycle body -->
                            <ellipse cx="28" cy="28" rx="8" ry="4"/>
                            <!-- Front wheel -->
                            <circle cx="28" cy="17" r="6" fill="none" stroke="#fff" stroke-width="2"/>
                            <!-- Rear wheel -->
                            <circle cx="28" cy="39" r="6" fill="none" stroke="#fff" stroke-width="2"/>
                            <!-- Handlebars -->
                            <rect x="22" y="14" width="12" height="2" rx="1"/>
                        </g>
                        <text x="28" y="52" text-anchor="middle" font-size="8" fill="#E91E63" font-weight="bold">MOTO</text>
                    </svg>
                `;
            case 'bicycle':
                // Green background with bicycle shape
                return `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" width="56" height="56">
                        <circle cx="28" cy="28" r="26" fill="#4CAF50" stroke="#fff" stroke-width="3"/>
                        <g fill="none" stroke="#fff" stroke-width="2" transform="rotate(${rotation} 28 28)">
                            <!-- Rear wheel -->
                            <circle cx="20" cy="32" r="7"/>
                            <!-- Front wheel -->
                            <circle cx="36" cy="32" r="7"/>
                            <!-- Frame -->
                            <path d="M20 32 L28 22 L36 32 M28 22 L28 32 M23 27 L33 27"/>
                            <!-- Seat -->
                            <line x1="25" y1="20" x2="31" y2="20"/>
                        </g>
                        <text x="28" y="52" text-anchor="middle" font-size="8" fill="#4CAF50" font-weight="bold">BIKE</text>
                    </svg>
                `;
            case 'truck':
                // Orange background with truck shape
                return `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" width="56" height="56">
                        <circle cx="28" cy="28" r="26" fill="#FF9800" stroke="#fff" stroke-width="3"/>
                        <g fill="#fff" transform="rotate(${rotation} 28 28)">
                            <!-- Truck body/cargo -->
                            <rect x="18" y="15" width="20" height="16" rx="2"/>
                            <!-- Cab -->
                            <rect x="20" y="31" width="16" height="10" rx="2"/>
                            <!-- Windows -->
                            <rect x="22" y="33" width="12" height="4" rx="1" fill="#FF9800"/>
                            <!-- Wheels -->
                            <circle cx="22" cy="42" r="3" fill="#FF9800" stroke="#fff" stroke-width="1"/>
                            <circle cx="34" cy="42" r="3" fill="#FF9800" stroke="#fff" stroke-width="1"/>
                        </g>
                        <text x="28" y="52" text-anchor="middle" font-size="7" fill="#FF9800" font-weight="bold">TRUCK</text>
                    </svg>
                `;
            case 'van':
                // Purple background with van shape
                return `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" width="56" height="56">
                        <circle cx="28" cy="28" r="26" fill="#9C27B0" stroke="#fff" stroke-width="3"/>
                        <g fill="#fff" transform="rotate(${rotation} 28 28)">
                            <!-- Van body -->
                            <rect x="17" y="15" width="22" height="22" rx="4"/>
                            <!-- Front window -->
                            <rect x="19" y="17" width="8" height="7" rx="1" fill="#9C27B0"/>
                            <!-- Side window -->
                            <rect x="29" y="17" width="8" height="7" rx="1" fill="#9C27B0"/>
                            <!-- Wheels -->
                            <circle cx="22" cy="40" r="3" fill="#9C27B0" stroke="#fff" stroke-width="1"/>
                            <circle cx="34" cy="40" r="3" fill="#9C27B0" stroke="#fff" stroke-width="1"/>
                        </g>
                        <text x="28" y="52" text-anchor="middle" font-size="8" fill="#9C27B0" font-weight="bold">VAN</text>
                    </svg>
                `;
            case 'car':
            default:
                // Blue background with car shape
                return `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" width="56" height="56">
                        <circle cx="28" cy="28" r="26" fill="#2196F3" stroke="#fff" stroke-width="3"/>
                        <g fill="#fff" transform="rotate(${rotation} 28 28)">
                            <!-- Car body -->
                            <path d="M18 30 L18 25 L22 18 L34 18 L38 25 L38 30 L36 35 L20 35 Z"/>
                            <!-- Roof/Windows -->
                            <rect x="23" y="19" width="10" height="6" rx="1" fill="#2196F3"/>
                            <!-- Front lights -->
                            <rect x="20" y="21" width="2" height="2" rx="0.5" fill="#2196F3"/>
                            <rect x="34" y="21" width="2" height="2" rx="0.5" fill="#2196F3"/>
                            <!-- Wheels -->
                            <circle cx="22" cy="36" r="3" fill="#2196F3" stroke="#fff" stroke-width="1"/>
                            <circle cx="34" cy="36" r="3" fill="#2196F3" stroke="#fff" stroke-width="1"/>
                        </g>
                        <text x="28" y="52" text-anchor="middle" font-size="8" fill="#2196F3" font-weight="bold">CAR</text>
                    </svg>
                `;
        }
    }

    private addToRoutePath(position: { lat: number; lng: number }): void {
        if (!this.routePath) {
            this.routePath = new window.google.maps.Polyline({
                path: [position],
                geodesic: true,
                strokeColor: '#2196F3',
                strokeOpacity: 0.7,
                strokeWeight: 4,
                map: this.map,
            });
        } else {
            const path = this.routePath.getPath();
            path.push(new window.google.maps.LatLng(position.lat, position.lng));
        }
    }

    private updateLastUpdateTime(): void {
        this.lastUpdateTime = new Date().toLocaleTimeString();
    }
}
