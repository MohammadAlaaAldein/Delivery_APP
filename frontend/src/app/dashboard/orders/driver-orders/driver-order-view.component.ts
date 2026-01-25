import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../orders.service';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Order, OrderStatus } from '../order.interface';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-driver-order-view',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './driver-order-view.component.html'
})
export class DriverOrderViewComponent {

    order: Order | null = null;
    orderId: number | null = null;

    constructor(
        private ordersService: OrdersService,
        private route: ActivatedRoute,
        private router: Router,
        private notificationService: NotificationMessageService,
        private translate: TranslateService,
    ) { }

    ngOnInit() {
        this.orderId = +this.route.snapshot.paramMap.get('id');
        this.loadOrder();
    }

    loadOrder() {
        this.ordersService.getDriverOrder(this.orderId).subscribe({
            next: (res) => {
                this.order = res.data;
            },
            error: () => {
                this.notificationService.setMessage('g.global_err');
                this.goBack();
            }
        });
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

    canPickup(): boolean {
        return this.order?.status === OrderStatus.ASSIGNED_TO_DRIVER;
    }

    canStartDelivery(): boolean {
        return this.order?.status === OrderStatus.PICKED_UP;
    }

    canDeliver(): boolean {
        return this.order?.status === OrderStatus.IN_TRANSIT;
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

    goBack() {
        this.router.navigate(['/my-deliveries']);
    }
}
