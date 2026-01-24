import { Component } from '@angular/core';
import { DriverRequestsService } from './driver-requests.service';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { SCTTableModule } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/sct-table.module';
import { ColumnsConfig, TableConfig, TableData } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/custom-table-interface';
import moment from 'moment';
import { CardComponent } from "../../theme/shared/components/card/card.component";
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { DriverRequest } from './driver-request.interface';

@Component({
    selector: 'app-driver-requests',
    standalone: true,
    imports: [CommonModule, SCTTableModule, TranslateModule, CardComponent, FormsModule],
    templateUrl: './driver-requests.component.html'
})
export class DriverRequestsComponent {

    driverRequests: DriverRequest[] = [];

    columnConfig: ColumnsConfig[] = [
        { key: 'name', name: this.translate.instant('driver_requests.name'), type: 'string' },
        { key: 'company_name', name: this.translate.instant('driver_requests.requesting_company'), type: 'string' },
        { key: 'phone', name: this.translate.instant('driver_requests.phone'), type: 'string' },
        { key: 'city', name: this.translate.instant('driver_requests.city'), type: 'string' },
        { key: 'vehicle_type', name: this.translate.instant('driver_requests.vehicle_type'), type: 'string' },
        { key: 'status', name: this.translate.instant('g.status'), type: 'string' },
        { key: 'created_at', name: this.translate.instant('g.creation_date'), type: 'date' },
        { key: 'actions', name: this.translate.instant('g.actions'), type: 'dropdown' }
    ];

    filters = {
        name: "",
        status: "",
    }

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
        private driverRequestsService: DriverRequestsService,
        private translate: TranslateService,
        private router: Router,
        private notificationService: NotificationMessageService,
    ) { }

    ngOnInit() {
        this.getRequestsList(this.filters);
    }

    search() {
        this.getRequestsList(this.filters);
    }

    getRequestsList(filters: { name?: string; status?: string }) {
        this.driverRequestsService.list(filters as any).subscribe((res) => {
            const requests = res.data;
            const data = [];
            for (const request of requests) {
                const options = this.getActionOptions(request);

                data.push({
                    id: request.id,
                    name: { value: request.name },
                    company_name: { value: request.company_name || '-' },
                    phone: { value: request.phone || '-' },
                    city: { value: request.city || '-' },
                    vehicle_type: { value: request.vehicle_type ? this.translate.instant(`driver_requests.vehicle_types.${request.vehicle_type}`) : '-' },
                    status: {
                        value: this.translate.instant(`driver_requests.${request.status}`),
                        class: this.getStatusClass(request.status)
                    },
                    created_at: { value: moment(request.created_at).format('YYYY-MM-DD') },
                    actions: { value: null, options: options }
                });
            }

            this.tableData = data;
        });
    }

    getActionOptions(request: DriverRequest) {
        const options = [];

        // Edit action for all requests
        options.push({ text: this.translate.instant('g.edit'), action: () => { this.edit(request) } });

        // Approve/Reject for pending/rejected requests
        if (request.status === 'pending' || request.status === 'rejected') {
            options.push({ text: this.translate.instant('driver_requests.approve'), action: () => { this.confirmApprove(request) } });
            options.push({ text: this.translate.instant('driver_requests.reject'), action: () => { this.confirmReject(request) } });
        }

        options.push({ text: this.translate.instant('g.delete'), action: () => { this.confirmDelete(request) } });

        return options;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'pending':
                return 'badge bg-warning';
            case 'approved':
                return 'badge bg-success';
            case 'rejected':
                return 'badge bg-danger';
            default:
                return 'badge bg-secondary';
        }
    }

    resetData() {
        this.filters = {
            name: "",
            status: "",
        };
        this.getRequestsList({});
    }

    isFiltersFilled() {
        return Object.values(this.filters).some((v) => v);
    }

    edit(request: DriverRequest) {
        this.router.navigate(['/driver-requests/edit', request.id]);
    }

    view(request: DriverRequest) {
        this.router.navigate(['/driver-requests/view', request.id]);
    }

    confirmApprove(request: DriverRequest) {
        Swal.fire({
            title: this.translate.instant('driver_requests.approve_request'),
            text: this.translate.instant('driver_requests.approve_confirm_msg'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('driver_requests.approve'),
            cancelButtonText: this.translate.instant('g.cancel')
        }).then(result => {
            if (result.isConfirmed) {
                this.approveRequest(request);
            }
        });
    }

    approveRequest(request: DriverRequest) {
        this.driverRequestsService.approve(request.id).subscribe((res) => {
            // Show the temporary password if returned
            if (res.data?.temp_password) {
                Swal.fire({
                    title: this.translate.instant('driver_requests.driver_created'),
                    html: `
                        <p>${this.translate.instant('driver_requests.temp_password_msg')}</p>
                        <div class="alert alert-info">
                            <strong>${res.data.temp_password}</strong>
                        </div>
                        <p class="text-muted small">${this.translate.instant('driver_requests.temp_password_note')}</p>
                    `,
                    icon: 'success'
                });
            } else {
                this.notificationService.setMessage('globalSuccessMsg');
            }
            this.getRequestsList(this.filters);
        });
    }

    confirmReject(request: DriverRequest) {
        Swal.fire({
            title: this.translate.instant('driver_requests.reject_request'),
            input: 'textarea',
            inputLabel: this.translate.instant('driver_requests.rejection_reason'),
            inputPlaceholder: this.translate.instant('driver_requests.enter_rejection_reason'),
            showCancelButton: true,
            confirmButtonText: this.translate.instant('driver_requests.reject'),
            cancelButtonText: this.translate.instant('g.cancel')
        }).then(result => {
            if (result.isConfirmed) {
                this.rejectRequest(request, result.value);
            }
        });
    }

    rejectRequest(request: DriverRequest, adminNotes?: string) {
        this.driverRequestsService.reject(request.id, adminNotes).subscribe(() => {
            this.notificationService.setMessage('globalSuccessMsg');
            this.getRequestsList(this.filters);
        });
    }

    confirmDelete(request: DriverRequest) {
        Swal.fire({
            title: this.translate.instant('driver_requests.delete_request'),
            text: this.translate.instant('driver_requests.delete_confirm_msg'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('g.confirm'),
            cancelButtonText: this.translate.instant('g.cancel')
        }).then(result => {
            if (result.isConfirmed) {
                this.deleteRequest(request);
            }
        });
    }

    deleteRequest(request: DriverRequest) {
        this.driverRequestsService.delete(request.id).subscribe(() => {
            this.tableData = this.tableData.filter((r) => r['id'] !== request.id);
            this.notificationService.setMessage('globalSuccessMsg');
        });
    }
}
