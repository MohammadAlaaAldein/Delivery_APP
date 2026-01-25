import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../orders.service';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Order, OrderStatus } from '../order.interface';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-company-order-view',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './company-order-view.component.html'
})
export class CompanyOrderViewComponent {

    order: Order | null = null;
    orderId: number | null = null;
    isAvailableOrder: boolean = false;

    constructor(
        private ordersService: OrdersService,
        private route: ActivatedRoute,
        private router: Router,
        private notificationService: NotificationMessageService,
        private translate: TranslateService,
    ) { }

    ngOnInit() {
        this.orderId = +this.route.snapshot.paramMap.get('id');
        this.isAvailableOrder = this.route.snapshot.url.some(segment => segment.path === 'available-orders');
        this.loadOrder();
    }

    loadOrder() {
        if (this.isAvailableOrder) {
            // For available orders, we need a different endpoint or use the list to find it
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

    goBack() {
        if (this.isAvailableOrder) {
            this.router.navigate(['/available-orders']);
        } else {
            this.router.navigate(['/company-orders']);
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

    canTakeOrder(): boolean {
        return this.isAvailableOrder && this.order?.status === OrderStatus.PENDING;
    }

    canAssignDriver(): boolean {
        return !this.isAvailableOrder &&
            (this.order?.status === OrderStatus.ASSIGNED_TO_COMPANY || this.order?.status === OrderStatus.ASSIGNED_TO_DRIVER);
    }
}
