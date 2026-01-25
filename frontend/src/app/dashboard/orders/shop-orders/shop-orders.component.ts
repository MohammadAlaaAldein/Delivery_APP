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
    selector: 'app-shop-orders',
    standalone: true,
    imports: [CommonModule, SCTTableModule, TranslateModule, FormsModule],
    templateUrl: './shop-orders.component.html'
})
export class ShopOrdersComponent {

    orders: Order[] = [];
    selectedStatus: string = '';

    statusOptions = [
        { value: '', label: 'All' },
        { value: OrderStatus.PENDING, label: 'Pending' },
        { value: OrderStatus.ASSIGNED_TO_COMPANY, label: 'Assigned to Company' },
        { value: OrderStatus.ASSIGNED_TO_DRIVER, label: 'Assigned to Driver' },
        { value: OrderStatus.PICKED_UP, label: 'Picked Up' },
        { value: OrderStatus.IN_TRANSIT, label: 'In Transit' },
        { value: OrderStatus.DELIVERED, label: 'Delivered' },
        { value: OrderStatus.CANCELLED, label: 'Cancelled' },
    ];

    columnConfig: ColumnsConfig[] = [
        { key: 'order_number', name: this.translate.instant('orders.order_number'), type: 'string' },
        { key: 'customer_name', name: this.translate.instant('orders.customer_name'), type: 'string' },
        { key: 'delivery_city', name: this.translate.instant('orders.delivery_city'), type: 'string' },
        { key: 'total_amount', name: this.translate.instant('orders.total_amount'), type: 'number' },
        { key: 'status', name: this.translate.instant('g.status'), type: 'string' },
        { key: 'company', name: this.translate.instant('orders.company'), type: 'string' },
        { key: 'driver', name: this.translate.instant('orders.driver'), type: 'string' },
        { key: 'created_at', name: this.translate.instant('g.creation_date'), type: 'date' },
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
        private notificationService: NotificationMessageService,
    ) { }

    ngOnInit() {
        this.getOrdersList();
    }

    getOrdersList() {
        const status = this.selectedStatus as OrderStatus || undefined;
        this.ordersService.getShopOrders(status).subscribe((res) => {
            const orders = res.data;
            const data = [];
            for (const order of orders) {
                const options = this.getActionOptions(order);

                data.push({
                    id: order.id,
                    order_number: { value: order.order_number },
                    customer_name: { value: order.customer_name },
                    delivery_city: { value: order.delivery_city || '-' },
                    total_amount: { value: order.total_amount },
                    status: {
                        value: this.translate.instant(`orders.status.${order.status}`),
                        class: this.getStatusClass(order.status)
                    },
                    company: { value: order.company?.name || '-' },
                    driver: { value: order.driver?.user?.name || '-' },
                    created_at: { value: moment(order.created_at).format('YYYY-MM-DD HH:mm') },
                    actions: { value: null, options: options }
                });
            }

            this.tableData = data;
        });
    }

    getActionOptions(order: Order) {
        const options = [];

        options.push({ text: this.translate.instant('g.view'), action: () => { this.view(order) } });

        // Can only edit if pending or assigned to company
        if ([OrderStatus.PENDING, OrderStatus.ASSIGNED_TO_COMPANY].includes(order.status)) {
            options.push({ text: this.translate.instant('g.edit'), action: () => { this.edit(order) } });
        }

        // Can cancel if not yet picked up or delivered
        if (![OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status)) {
            options.push({ text: this.translate.instant('g.cancel'), action: () => { this.cancelOrder(order) } });
        }

        return options;
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

    view(order: Order) {
        this.router.navigate(['/my-orders/view', order.id]);
    }

    edit(order: Order) {
        this.router.navigate(['/my-orders/edit', order.id]);
    }

    cancelOrder(order: Order) {
        Swal.fire({
            title: this.translate.instant('orders.cancel_order'),
            input: 'textarea',
            inputLabel: this.translate.instant('orders.enter_cancellation_reason'),
            inputPlaceholder: this.translate.instant('orders.cancellation_reason'),
            showCancelButton: true,
            confirmButtonText: this.translate.instant('g.confirm'),
            cancelButtonText: this.translate.instant('g.cancel'),
            inputValidator: (value) => {
                if (!value || !value.trim()) {
                    return this.translate.instant('orders.cancellation_reason_required');
                }
                return null;
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                this.ordersService.cancelShopOrder(order.id, result.value).subscribe({
                    next: () => {
                        Swal.fire({
                            title: this.translate.instant('orders.order_cancelled_successfully'),
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

    createOrder() {
        this.router.navigate(['/my-orders/create']);
    }

    onStatusChange() {
        this.getOrdersList();
    }
}
