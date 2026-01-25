import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../orders.service';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { OrderHistory, OrderStatus } from '../order.interface';

export type ViewerRole = 'company' | 'driver' | 'shop' | 'admin';

@Component({
    selector: 'app-order-history-view',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './order-history-view.component.html'
})
export class OrderHistoryViewComponent {

    order: OrderHistory | null = null;
    orderId: number | null = null;
    viewerRole: ViewerRole = 'driver';

    constructor(
        private ordersService: OrdersService,
        private route: ActivatedRoute,
        private router: Router,
        private notificationService: NotificationMessageService,
        private translate: TranslateService,
    ) { }

    ngOnInit() {
        this.orderId = +this.route.snapshot.paramMap.get('id');
        this.viewerRole = this.route.snapshot.data['viewerRole'] || 'driver';
        this.loadOrder();
    }

    loadOrder() {
        this.ordersService.getOrderHistoryById(this.orderId).subscribe({
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
            case OrderStatus.DELIVERED: return 'badge bg-success';
            case OrderStatus.CANCELLED: return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    }

    goBack() {
        switch (this.viewerRole) {
            case 'driver':
                this.router.navigate(['/delivery-history']);
                break;
            case 'company':
                this.router.navigate(['/company-orders']);
                break;
            case 'shop':
                this.router.navigate(['/my-orders']);
                break;
            default:
                this.router.navigate(['/orders']);
        }
    }
}
