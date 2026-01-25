import { Component } from '@angular/core';
import { OrdersService } from '../orders.service';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SCTTableModule } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/sct-table.module';
import { ColumnsConfig, TableConfig, TableData } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/custom-table-interface';
import moment from 'moment';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Order, OrderStatus } from '../order.interface';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-driver-orders',
    standalone: true,
    imports: [CommonModule, SCTTableModule, TranslateModule, FormsModule],
    templateUrl: './driver-orders.component.html'
})
export class DriverOrdersComponent {

    orders: Order[] = [];

    columnConfig: ColumnsConfig[] = [
        { key: 'order_number', name: this.translate.instant('orders.order_number'), type: 'string' },
        { key: 'shop', name: this.translate.instant('orders.shop'), type: 'string' },
        { key: 'customer_name', name: this.translate.instant('orders.customer_name'), type: 'string' },
        { key: 'customer_phone', name: this.translate.instant('orders.customer_phone'), type: 'string' },
        { key: 'delivery_city', name: this.translate.instant('orders.delivery_city'), type: 'string' },
        { key: 'total_amount', name: this.translate.instant('orders.total_amount'), type: 'number' },
        { key: 'status', name: this.translate.instant('g.status'), type: 'string' },
        { key: 'actions', name: this.translate.instant('g.actions'), type: 'dropdown' }
    ];

    tableData: TableData[] = [];
    tableConfig: TableConfig = {
        hasExport: false,
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
        private notificationService: NotificationMessageService,
    ) { }

    ngOnInit() {
        this.getOrdersList();
    }

    getOrdersList() {
        this.ordersService.getDriverOrders().subscribe((res) => {
            const orders = res.data;
            const data = [];
            for (const order of orders) {
                const options = this.getActionOptions(order);

                data.push({
                    id: order.id,
                    order_number: { value: order.order_number },
                    shop: { value: order.shop?.name || '-' },
                    customer_name: { value: order.customer_name },
                    customer_phone: { value: order.customer_phone },
                    delivery_city: { value: order.delivery_city || '-' },
                    total_amount: { value: order.total_amount },
                    status: {
                        value: this.translate.instant(`orders.status.${order.status}`),
                        class: this.getStatusClass(order.status)
                    },
                    actions: { value: null, options: options }
                });
            }

            this.tableData = data;
        });
    }

    getActionOptions(order: Order) {
        const options = [];

        options.push({ text: this.translate.instant('g.view'), action: () => { this.viewOrder(order) } });

        // Status progression actions
        if (order.status === OrderStatus.ASSIGNED_TO_DRIVER) {
            options.push({ text: this.translate.instant('orders.pickup'), action: () => { this.pickupOrder(order) } });
        }

        if (order.status === OrderStatus.PICKED_UP) {
            options.push({ text: this.translate.instant('orders.start_delivery'), action: () => { this.startDelivery(order) } });
        }

        if ([OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT].includes(order.status)) {
            options.push({ text: this.translate.instant('orders.deliver'), action: () => { this.deliverOrder(order) } });
        }

        return options;
    }

    getStatusClass(status: OrderStatus): string {
        switch (status) {
            case OrderStatus.ASSIGNED_TO_DRIVER: return 'badge bg-primary';
            case OrderStatus.PICKED_UP: return 'badge bg-secondary';
            case OrderStatus.IN_TRANSIT: return 'badge bg-info';
            case OrderStatus.DELIVERED: return 'badge bg-success';
            case OrderStatus.CANCELLED: return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    }

    viewOrder(order: Order) {
        this.router.navigate(['/my-deliveries/view', order.id]);
    }

    pickupOrder(order: Order) {
        Swal.fire({
            title: this.translate.instant('g.confirm_action'),
            text: this.translate.instant('orders.confirm_pickup'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('g.yes'),
            cancelButtonText: this.translate.instant('g.cancel')
        }).then((result) => {
            if (result.isConfirmed) {
                this.ordersService.pickupOrder(order.id).subscribe({
                    next: () => {
                        Swal.fire({
                            title: this.translate.instant('orders.order_picked_up_successfully'),
                            icon: 'success',
                            timer: 2000
                        });
                        this.getOrdersList();
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

    startDelivery(order: Order) {
        Swal.fire({
            title: this.translate.instant('g.confirm_action'),
            text: this.translate.instant('orders.confirm_start_delivery'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('g.yes'),
            cancelButtonText: this.translate.instant('g.cancel')
        }).then((result) => {
            if (result.isConfirmed) {
                this.ordersService.startDelivery(order.id).subscribe({
                    next: () => {
                        Swal.fire({
                            title: this.translate.instant('orders.delivery_started_successfully'),
                            icon: 'success',
                            timer: 2000
                        });
                        this.getOrdersList();
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

    deliverOrder(order: Order) {
        Swal.fire({
            title: this.translate.instant('g.confirm_action'),
            text: this.translate.instant('orders.confirm_delivery'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('g.yes'),
            cancelButtonText: this.translate.instant('g.cancel')
        }).then((result) => {
            if (result.isConfirmed) {
                this.ordersService.deliverOrder(order.id).subscribe({
                    next: () => {
                        Swal.fire({
                            title: this.translate.instant('orders.order_delivered_successfully'),
                            icon: 'success',
                            timer: 2000
                        });
                        this.getOrdersList();
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

    viewHistory() {
        this.router.navigate(['/delivery-history']);
    }
}
