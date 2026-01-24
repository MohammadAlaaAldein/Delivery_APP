import { Component } from '@angular/core';
import { ShopRequestsService } from '../shop-requests.service';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SCTTableModule } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/sct-table.module';
import { ColumnsConfig, TableConfig, TableData } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/custom-table-interface';
import moment from 'moment';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { ShopRequest } from '../shop-request.interface';

@Component({
    selector: 'app-my-shop-requests',
    standalone: true,
    imports: [CommonModule, SCTTableModule, TranslateModule, FormsModule],
    templateUrl: './my-shop-requests.component.html'
})
export class MyShopRequestsComponent {

    shopRequests: ShopRequest[] = [];

    columnConfig: ColumnsConfig[] = [
        { key: 'name', name: this.translate.instant('shop_requests.name'), type: 'string' },
        { key: 'city', name: this.translate.instant('shop_requests.city'), type: 'string' },
        { key: 'status', name: this.translate.instant('g.status'), type: 'string' },
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
        private shopRequestsService: ShopRequestsService,
        private translate: TranslateService,
        private router: Router,
        private notificationService: NotificationMessageService,
    ) { }

    ngOnInit() {
        this.getRequestsList();
    }

    getRequestsList() {
        this.shopRequestsService.getMyRequests().subscribe((res) => {
            const requests = res.data;
            const data = [];
            for (const request of requests) {
                const options = this.getActionOptions(request);

                data.push({
                    id: request.id,
                    name: { value: request.name },
                    city: { value: request.city || '-' },
                    status: {
                        value: this.translate.instant(`shop_requests.${request.status}`),
                        class: this.getStatusClass(request.status)
                    },
                    created_at: { value: moment(request.created_at).format('YYYY-MM-DD') },
                    actions: { value: null, options: options }
                });
            }

            this.tableData = data;
        });
    }

    getActionOptions(request: ShopRequest) {
        const options = [];

        // Edit action for all requests
        options.push({ text: this.translate.instant('g.edit'), action: () => { this.edit(request) } });

        // Allow delete for pending or rejected requests
        if (request.status === 'pending' || request.status === 'rejected') {
            options.push({ text: this.translate.instant('g.delete'), action: () => { this.deleteRequest(request) } });
        }

        return options;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'pending': return 'badge bg-warning';
            case 'approved': return 'badge bg-success';
            case 'rejected': return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    }

    edit(request: ShopRequest) {
        this.router.navigate(['/my-shop-requests/edit', request.id]);
    }

    deleteRequest(request: ShopRequest) {
        if (!confirm(this.translate.instant('g.confirm_delete'))) {
            return;
        }

        this.shopRequestsService.deleteMyRequest(request.id).subscribe({
            next: () => {
                this.notificationService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                this.getRequestsList();
            },
            error: (err) => {
                this.notificationService.setMessage(err.error?.message || 'g.something_went_wrong', { clearOnXTimeNavigate: 1 });
            }
        });
    }

    addNew() {
        this.router.navigate(['/my-shop-requests/create']);
    }
}
