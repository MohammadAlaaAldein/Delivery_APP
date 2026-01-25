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
    selector: 'app-company-available-orders',
    standalone: true,
    imports: [CommonModule, SCTTableModule, TranslateModule, FormsModule],
    templateUrl: './company-available-orders.component.html'
})
export class CompanyAvailableOrdersComponent {

    orders: Order[] = [];

    columnConfig: ColumnsConfig[] = [
        { key: 'order_number', name: this.translate.instant('orders.order_number'), type: 'string' },
        { key: 'shop', name: this.translate.instant('orders.shop'), type: 'string' },
        { key: 'customer_name', name: this.translate.instant('orders.customer_name'), type: 'string' },
        { key: 'delivery_city', name: this.translate.instant('orders.delivery_city'), type: 'string' },
        { key: 'total_amount', name: this.translate.instant('orders.total_amount'), type: 'number' },
        { key: 'priority', name: this.translate.instant('orders.priority'), type: 'number' },
        { key: 'created_at', name: this.translate.instant('g.creation_date'), type: 'date' },
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
        this.ordersService.getAvailableOrders().subscribe((res) => {
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
                    priority: {
                        value: order.priority,
                        class: order.priority > 0 ? 'badge bg-danger' : ''
                    },
                    created_at: { value: moment(order.created_at).format('YYYY-MM-DD HH:mm') },
                    actions: {
                        value: null,
                        options: [
                            { text: this.translate.instant('g.view'), action: () => { this.viewOrder(order) } },
                            { text: this.translate.instant('orders.take_order'), action: () => { this.takeOrder(order) } },
                        ]
                    }
                });
            }

            this.tableData = data;
        });
    }

    viewOrder(order: Order) {
        this.router.navigate(['/available-orders/view', order.id]);
    }

    takeOrder(order: Order) {
        Swal.fire({
            title: this.translate.instant('orders.take_order'),
            text: this.translate.instant('orders.confirm_take_order'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('g.confirm'),
            cancelButtonText: this.translate.instant('g.cancel')
        }).then(result => {
            if (result.isConfirmed) {
                this.ordersService.takeOrder(order.id).subscribe({
                    next: () => {
                        Swal.fire({
                            title: this.translate.instant('g.global_success_msg'),
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        this.getOrdersList();
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

    refresh() {
        this.getOrdersList();
    }
}
