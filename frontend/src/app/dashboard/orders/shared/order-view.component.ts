import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../orders.service';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Order, OrderStatus } from '../order.interface';
import { OrderTrackingMapComponent } from 'src/app/shared/components/order-tracking-map/order-tracking-map.component';
import { SocketService, OrderEventPayload } from 'src/app/shared/services/socket.service';
import { Subject, takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

export type ViewerRole = 'company' | 'driver' | 'shop';

@Component({
    selector: 'app-order-view',
    standalone: true,
    imports: [CommonModule, TranslateModule, OrderTrackingMapComponent],
    templateUrl: './order-view.component.html'
})
export class OrderViewComponent implements OnInit, OnDestroy {

    private destroy$ = new Subject<void>();
    order: Order | null = null;
    orderId: number | null = null;
    googleMapsApiKey: string = environment.googleMapsApiKey || '';

    // Role-based behavior
    viewerRole: ViewerRole = 'company';
    isAvailableOrder: boolean = false;

    constructor(
        private ordersService: OrdersService,
        private route: ActivatedRoute,
        private router: Router,
        private notificationService: NotificationMessageService,
        private translate: TranslateService,
        private socketService: SocketService,
    ) { }

    ngOnInit() {
        this.orderId = +this.route.snapshot.paramMap.get('id');

        // Determine role based on route
        const url = this.route.snapshot.url.map(s => s.path).join('/');
        if (url.includes('my-deliveries') || this.route.snapshot.data['viewerRole'] === 'driver') {
            this.viewerRole = 'driver';
        } else if (url.includes('shop-orders') || url.includes('my-orders') || this.route.snapshot.data['viewerRole'] === 'shop') {
            this.viewerRole = 'shop';
        } else {
            this.viewerRole = 'company';
            this.isAvailableOrder = url.includes('available-orders');
        }

        this.loadOrder();
        this.subscribeToRealTimeUpdates();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private subscribeToRealTimeUpdates() {
        this.socketService.onOrderUpdate()
            .pipe(takeUntil(this.destroy$))
            .subscribe((payload: OrderEventPayload) => {
                // Only reload if this is the order being viewed
                if (payload.orderId === this.orderId) {
                    this.loadOrder();
                }
            });
    }

    loadOrder() {
        if (this.viewerRole === 'driver') {
            this.ordersService.getDriverOrder(this.orderId).subscribe({
                next: (res) => {
                    this.order = res.data;
                },
                error: () => {
                    this.notificationService.setMessage('g.global_err');
                    this.goBack();
                }
            });
        } else if (this.viewerRole === 'shop') {
            this.ordersService.getShopOrder(this.orderId).subscribe({
                next: (res) => {
                    this.order = res.data;
                },
                error: () => {
                    this.notificationService.setMessage('g.global_err');
                    this.goBack();
                }
            });
        } else if (this.isAvailableOrder) {
            this.ordersService.getAvailableOrders().subscribe({
                next: (res) => {
                    this.order = res.data.find(o => o.id === this.orderId) || null;
                },
                error: () => {
                    this.notificationService.setMessage('g.global_err');
                    this.goBack();
                }
            });
        } else {
            this.ordersService.getCompanyOrder(this.orderId).subscribe({
                next: (res) => {
                    this.order = res.data;
                },
                error: () => {
                    this.notificationService.setMessage('g.global_err');
                    this.goBack();
                }
            });
        }
    }

    getStatusClass(status: OrderStatus): string {
        switch (status) {
            case OrderStatus.PENDING: return 'badge bg-warning';
            case OrderStatus.ASSIGNED_TO_COMPANY: return 'badge bg-info';
            case OrderStatus.ASSIGNED_TO_DRIVER: return 'badge bg-primary';
            case OrderStatus.PICKED_UP: return 'badge bg-secondary';
            case OrderStatus.IN_TRANSIT: return 'badge bg-info';
            case OrderStatus.DELIVERED: return 'badge bg-success';
            case OrderStatus.CANCELLED: return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    }

    // ==================== COMPANY ACTIONS ====================

    canTakeOrder(): boolean {
        return this.viewerRole === 'company' && this.isAvailableOrder && this.order?.status === OrderStatus.PENDING;
    }

    canAssignDriver(): boolean {
        return this.viewerRole === 'company' && !this.isAvailableOrder &&
            (this.order?.status === OrderStatus.ASSIGNED_TO_COMPANY || this.order?.status === OrderStatus.ASSIGNED_TO_DRIVER);
    }

    takeOrder() {
        Swal.fire({
            title: this.translate.instant('orders.take_order'),
            text: this.translate.instant('orders.confirm_take_order'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('g.confirm'),
            cancelButtonText: this.translate.instant('g.cancel')
        }).then(result => {
            if (result.isConfirmed) {
                this.ordersService.takeOrder(this.orderId).subscribe({
                    next: () => {
                        Swal.fire({
                            title: this.translate.instant('g.global_success_msg'),
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        this.router.navigate(['/company-orders']);
                    },
                    error: (err) => {
                        Swal.fire({
                            title: this.translate.instant('g.global_err'),
                            text: err.error?.message || '',
                            icon: 'error'
                        });
                    }
                });
            }
        });
    }

    assignDriver() {
        this.router.navigate(['/company-orders/assign-driver', this.orderId]);
    }

    // ==================== DRIVER ACTIONS ====================

    canPickup(): boolean {
        return this.viewerRole === 'driver' && this.order?.status === OrderStatus.ASSIGNED_TO_DRIVER;
    }

    canStartDelivery(): boolean {
        return this.viewerRole === 'driver' && this.order?.status === OrderStatus.PICKED_UP;
    }

    canDeliver(): boolean {
        return this.viewerRole === 'driver' && this.order?.status === OrderStatus.IN_TRANSIT;
    }

    pickupOrder() {
        Swal.fire({
            title: this.translate.instant('g.confirm_action'),
            text: this.translate.instant('orders.confirm_pickup'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('g.yes'),
            cancelButtonText: this.translate.instant('g.cancel')
        }).then((result) => {
            if (result.isConfirmed) {
                this.ordersService.pickupOrder(this.orderId).subscribe({
                    next: () => {
                        Swal.fire({
                            title: this.translate.instant('orders.order_picked_up_successfully'),
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        this.loadOrder();
                    },
                    error: (err) => {
                        Swal.fire({
                            title: this.translate.instant('g.global_err'),
                            text: err.error?.message || this.translate.instant('g.something_went_wrong'),
                            icon: 'error'
                        });
                    }
                });
            }
        });
    }

    startDelivery() {
        Swal.fire({
            title: this.translate.instant('g.confirm_action'),
            text: this.translate.instant('orders.confirm_start_delivery'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('g.yes'),
            cancelButtonText: this.translate.instant('g.cancel')
        }).then((result) => {
            if (result.isConfirmed) {
                this.ordersService.startDelivery(this.orderId).subscribe({
                    next: () => {
                        Swal.fire({
                            title: this.translate.instant('orders.delivery_started_successfully'),
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        this.loadOrder();
                    },
                    error: (err) => {
                        Swal.fire({
                            title: this.translate.instant('g.global_err'),
                            text: err.error?.message || this.translate.instant('g.something_went_wrong'),
                            icon: 'error'
                        });
                    }
                });
            }
        });
    }

    deliverOrder() {
        Swal.fire({
            title: this.translate.instant('g.confirm_action'),
            text: this.translate.instant('orders.confirm_delivery'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('g.yes'),
            cancelButtonText: this.translate.instant('g.cancel')
        }).then((result) => {
            if (result.isConfirmed) {
                this.ordersService.deliverOrder(this.orderId).subscribe({
                    next: () => {
                        Swal.fire({
                            title: this.translate.instant('orders.order_delivered_successfully'),
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        this.router.navigate(['/delivery-history']);
                    },
                    error: (err) => {
                        Swal.fire({
                            title: this.translate.instant('g.global_err'),
                            text: err.error?.message || this.translate.instant('g.something_went_wrong'),
                            icon: 'error'
                        });
                    }
                });
            }
        });
    }

    // ==================== NAVIGATION ====================

    goBack() {
        if (this.viewerRole === 'driver') {
            this.router.navigate(['/my-deliveries']);
        } else if (this.viewerRole === 'shop') {
            this.router.navigate(['/my-orders']);
        } else if (this.isAvailableOrder) {
            this.router.navigate(['/available-orders']);
        } else {
            this.router.navigate(['/company-orders']);
        }
    }

    // ==================== TRACKING ====================

    /**
     * Check if tracking map should be shown
     * Show for PICKED_UP and IN_TRANSIT statuses
     */
    canShowTracking(): boolean {
        return this.order &&
            [OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(this.order.status) &&
            (this.viewerRole === 'company' || this.viewerRole === 'shop');
    }
}
