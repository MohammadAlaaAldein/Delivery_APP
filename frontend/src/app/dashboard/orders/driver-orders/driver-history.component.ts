import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrdersService } from '../orders.service';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SCTTableModule } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/sct-table.module';
import { ColumnsConfig, TableConfig, TableData } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/custom-table-interface';
import moment from 'moment';
import { Router } from '@angular/router';
import { OrderHistory, OrderStatus } from '../order.interface';
import { SocketService, OrderEventPayload } from 'src/app/shared/services/socket.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-driver-history',
    standalone: true,
    imports: [CommonModule, SCTTableModule, TranslateModule],
    templateUrl: './driver-history.component.html'
})
export class DriverHistoryComponent implements OnInit, OnDestroy {

    private destroy$ = new Subject<void>();

    columnConfig: ColumnsConfig[] = [
        { key: 'order_number', name: this.translate.instant('orders.order_number'), type: 'string' },
        { key: 'shop', name: this.translate.instant('orders.shop'), type: 'string' },
        { key: 'customer_name', name: this.translate.instant('orders.customer_name'), type: 'string' },
        { key: 'delivery_city', name: this.translate.instant('orders.delivery_city'), type: 'string' },
        { key: 'total_amount', name: this.translate.instant('orders.total_amount'), type: 'number' },
        { key: 'status', name: this.translate.instant('g.status'), type: 'string' },
        { key: 'delivered_at', name: this.translate.instant('orders.delivered_at'), type: 'date' },
        { key: 'actions', name: this.translate.instant('g.actions'), type: 'dropdown' }
    ];

    tableData: TableData[] = [];
    tableConfig: TableConfig = {
        hasExport: true,
        hasPagination: true,
        pageSize: 100,
        pageSizeOptions: [20, 50, 100, 200],
        fitScreen: true,
        hideNoData: true,
        hasActionButtons: false,
    };

    constructor(
        private ordersService: OrdersService,
        private translate: TranslateService,
        private router: Router,
        private socketService: SocketService,
    ) { }

    ngOnInit() {
        this.getHistory();
        this.subscribeToRealTimeUpdates();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private subscribeToRealTimeUpdates() {
        // Listen for delivered orders
        this.socketService.onOrderDelivered()
            .pipe(takeUntil(this.destroy$))
            .subscribe((payload: OrderEventPayload) => {
                console.log('[Driver History] Order delivered:', payload.eventType);
                this.getHistory();
            });

        // Listen for cancelled orders
        this.socketService.onOrderCancelled()
            .pipe(takeUntil(this.destroy$))
            .subscribe((payload: OrderEventPayload) => {
                console.log('[Driver History] Order cancelled:', payload.eventType);
                this.getHistory();
            });
    }

    getHistory() {
        this.ordersService.getDriverHistory().subscribe((res) => {
            const orders = res.data;
            const data = [];
            for (const order of orders) {
                data.push({
                    id: order.id,
                    order_number: { value: order.order_number },
                    shop: { value: order.shop?.name || '-' },
                    customer_name: { value: order.customer_name },
                    delivery_city: { value: order.delivery_city || '-' },
                    total_amount: { value: order.total_amount },
                    status: {
                        value: this.translate.instant(`orders.status.${order.status}`),
                        class: this.getStatusClass(order.status)
                    },
                    delivered_at: { value: order.delivered_at ? moment(order.delivered_at).format('YYYY-MM-DD HH:mm') : '-' },
                    actions: {
                        value: null,
                        options: [
                            { text: this.translate.instant('g.view'), action: () => { this.viewOrder(order) } }
                        ]
                    }
                });
            }

            this.tableData = data;
        });
    }

    getStatusClass(status: OrderStatus): string {
        switch (status) {
            case OrderStatus.DELIVERED: return 'badge bg-success';
            case OrderStatus.CANCELLED: return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    }

    viewOrder(order: OrderHistory) {
        // Note: For history orders, we may need a separate view route
        // For now, we'll show a message that this is a completed order
        this.router.navigate(['/delivery-history/view', order.id]);
    }

    goBack() {
        this.router.navigate(['/my-deliveries']);
    }
}
