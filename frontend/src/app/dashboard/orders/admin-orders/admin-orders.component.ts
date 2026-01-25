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
    selector: 'app-admin-orders',
    standalone: true,
    imports: [CommonModule, SCTTableModule, TranslateModule, FormsModule],
    templateUrl: './admin-orders.component.html'
})
export class AdminOrdersComponent {

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
        { key: 'shop', name: this.translate.instant('orders.shop'), type: 'string' },
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
        const filters: any = {};
        if (this.selectedStatus) {
            filters.status = this.selectedStatus as OrderStatus;
        }

        this.ordersService.getAllOrders(filters).subscribe((res) => {
            const orders = res.data;
            const data = [];
            for (const order of orders) {
                const options = this.getActionOptions(order);

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

        options.push({ text: this.translate.instant('g.view'), action: () => { this.viewOrder(order) } });
        options.push({ text: this.translate.instant('g.edit'), action: () => { this.editOrder(order) } });

        // Status is not delivered or cancelled
        if (![OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status)) {
            if (!order.company_id) {
                options.push({ text: this.translate.instant('orders.assign_company'), action: () => { this.assignCompany(order) } });
            }
            if (order.company_id && !order.driver_id) {
                options.push({ text: this.translate.instant('orders.assign_driver'), action: () => { this.assignDriver(order) } });
            }
        }

        options.push({ text: this.translate.instant('g.delete'), action: () => { this.deleteOrder(order) } });

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

    viewOrder(order: Order) {
        this.router.navigate(['/orders/view', order.id]);
    }

    editOrder(order: Order) {
        this.router.navigate(['/orders/edit', order.id]);
    }

    assignCompany(order: Order) {
        this.router.navigate(['/orders/assign-company', order.id]);
    }

    assignDriver(order: Order) {
        this.router.navigate(['/orders/assign-driver', order.id]);
    }

    deleteOrder(order: Order) {
        Swal.fire({
            title: this.translate.instant('g.confirm_action'),
            text: this.translate.instant('orders.confirm_delete'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('g.yes'),
            cancelButtonText: this.translate.instant('g.cancel')
        }).then((result) => {
            if (result.isConfirmed) {
                this.ordersService.deleteOrder(order.id).subscribe({
                    next: () => {
                        Swal.fire({
                            title: this.translate.instant('orders.order_deleted_successfully'),
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

    onStatusChange() {
        this.getOrdersList();
    }
}
