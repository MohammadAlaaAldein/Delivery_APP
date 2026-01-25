import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrdersService } from '../orders.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Order, OrderStatus } from '../order.interface';
import { CommonModule } from '@angular/common';
import { CompaniesService } from '../../companies/companies.service';
import { Driver } from '../../drivers/driver.interface';
import { FormBuilderComponent } from 'src/app/shared/form-builder/form-builder.component';

@Component({
    selector: 'app-company-assign-driver',
    standalone: true,
    imports: [ReactiveFormsModule, TranslateModule, CommonModule, FormBuilderComponent],
    templateUrl: './company-assign-driver.component.html',
})
export class CompanyAssignDriverComponent {

    order: Order | null = null;
    orderId: number | null = null;
    drivers: Driver[] = [];
    assignForm!: FormGroup;

    fields: any = {
        driver_id: { type: 'select', options: [], is_required: true },
        company_notes: { type: 'text' },
    };
    formFieldsList: string[] = ['driver_id', 'company_notes'];

    constructor(
        private _formBuilder: FormBuilder,
        private ordersService: OrdersService,
        private companiesService: CompaniesService,
        private route: ActivatedRoute,
        private router: Router,
        private notificationMessageService: NotificationMessageService,
        private translate: TranslateService,
    ) { }

    ngOnInit() {
        this.assignForm = this._formBuilder.group({
            driver_id: [null, [Validators.required]],
            company_notes: [''],
        });

        this.orderId = +this.route.snapshot.paramMap.get('id');
        this.loadOrderData();
        this.loadDrivers();
    }

    loadOrderData() {
        if (this.orderId) {
            this.ordersService.getCompanyOrder(this.orderId).subscribe((res) => {
                this.order = res.data;
            });
        }
    }

    loadDrivers() {
        this.companiesService.getMyCompanyDrivers().subscribe((res) => {
            this.drivers = res.data.filter(d => d.is_active);
            // Update driver options for form-builder
            this.fields = {
                ...this.fields,
                driver_id: {
                    ...this.fields.driver_id,
                    options: this.drivers.map(d => ({
                        value: d.user_id,
                        label: `${d.name} - ${d.vehicle_type || ''} ${d.phone ? '(' + d.phone + ')' : ''}`
                    }))
                }
            };
        });
    }

    onSubmit() {
        if (this.assignForm.valid && this.orderId) {
            const { driver_id, company_notes } = this.assignForm.value;
            this.ordersService.assignDriver(this.orderId, +driver_id, company_notes).subscribe({
                next: () => {
                    this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                    this.router.navigate(['/company-orders']);
                },
                error: (err) => {
                    this.notificationMessageService.setMessage(err.error?.message || 'g.something_went_wrong', { clearOnXTimeNavigate: 1 });
                }
            });
        } else {
            this.assignForm.markAllAsTouched();
        }
    }

    onCancel() {
        this.router.navigate(['/company-orders']);
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
}
