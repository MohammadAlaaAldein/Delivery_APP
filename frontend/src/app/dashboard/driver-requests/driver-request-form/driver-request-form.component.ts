import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DriverRequestsService } from '../driver-requests.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { DriverRequest } from '../driver-request.interface';
import { CommonService } from 'src/app/shared/services/common.service';
import { FormBuilderComponent } from 'src/app/shared/form-builder/form-builder.component';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-driver-request-form',
    standalone: true,
    imports: [ReactiveFormsModule, TranslateModule, FormBuilderComponent, CommonModule],
    templateUrl: './driver-request-form.component.html',
})
export class DriverRequestFormComponent {

    request: DriverRequest | null = null;
    requestId: number | null = null;
    isViewMode: boolean = false;

    cityOptions: { value: string, label: string }[] = [];
    vehicleTypeOptions = [
        { value: 'car', label: 'Car' },
        { value: 'motorcycle', label: 'Motorcycle' },
        { value: 'truck', label: 'Truck' },
        { value: 'van', label: 'Van' },
        { value: 'bicycle', label: 'Bicycle' },
    ];

    fields: any = {
        name: { type: "text", is_required: true },
        company_name: { type: "text", disabled: true },
        status: { type: "text", disabled: true },
        email: { type: "email", section: 'personal_info' },
        phone: { type: "text", section: 'personal_info' },
        national_id: { type: "text", section: 'personal_info' },
        birth_date: { type: "date", section: 'personal_info' },
        city: { type: "select", options: [], section: 'personal_info' },
        license_number: { type: "text", section: 'license_info' },
        license_expiry_date: { type: "date", section: 'license_info' },
        vehicle_type: { type: "select", options: [], section: 'vehicle_info' },
        vehicle_brand: { type: "text", section: 'vehicle_info' },
        vehicle_model: { type: "text", section: 'vehicle_info' },
        vehicle_year: { type: "number", section: 'vehicle_info' },
        vehicle_color: { type: "text", section: 'vehicle_info' },
        plate_number: { type: "text", section: 'vehicle_info' },
        admin_notes: { type: "textarea", section: 'admin_info' },
    }
    formFieldsList = [];

    firstFormGroup!: FormGroup;

    constructor(
        private _formBuilder: FormBuilder,
        private driverRequestsService: DriverRequestsService,
        private route: ActivatedRoute,
        private router: Router,
        private notificationMessageService: NotificationMessageService,
        private commonService: CommonService,
        private translate: TranslateService,
    ) { }

    ngOnInit() {
        this.initOptions();
        this.isViewMode = this.route.snapshot.url.some(segment => segment.path === 'view');

        this.firstFormGroup = this._formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            company_name: [{ value: '', disabled: true }],
            status: [{ value: '', disabled: true }],
            email: ['', [Validators.email]],
            phone: [''],
            national_id: [''],
            birth_date: [''],
            city: [''],
            license_number: [''],
            license_expiry_date: [''],
            vehicle_type: [''],
            vehicle_brand: [''],
            vehicle_model: [''],
            vehicle_year: [null],
            vehicle_color: [''],
            plate_number: [''],
            admin_notes: [''],
        });

        this.formFieldsList = Object.keys(this.fields);
        this.loadRequestData();
    }

    initOptions() {
        this.cityOptions = this.commonService.getCityOptions();

        // Translate vehicle type labels
        this.vehicleTypeOptions = this.vehicleTypeOptions.map(opt => ({
            ...opt,
            label: this.translate.instant(`driver_requests.vehicle_types.${opt.value}`)
        }));

        this.fields = {
            ...this.fields,
            city: { ...this.fields.city, options: this.cityOptions },
            vehicle_type: { ...this.fields.vehicle_type, options: this.vehicleTypeOptions }
        };
    }

    loadRequestData() {
        this.requestId = +this.route.snapshot.paramMap.get('id');

        if (this.requestId) {
            this.driverRequestsService.list({ id: this.requestId }).subscribe((res) => {
                if (res.data.length) {
                    this.request = res.data[0];
                    this.firstFormGroup.patchValue({
                        name: this.request.name,
                        company_name: this.request.company_name || '',
                        status: this.translate.instant(`driver_requests.${this.request.status}`),
                        email: this.request.email || '',
                        phone: this.request.phone || '',
                        national_id: this.request.national_id || '',
                        birth_date: this.commonService.formatDateForInput(this.request.birth_date),
                        city: this.request.city || '',
                        license_number: this.request.license_number || '',
                        license_expiry_date: this.commonService.formatDateForInput(this.request.license_expiry_date),
                        vehicle_type: this.request.vehicle_type || '',
                        vehicle_brand: this.request.vehicle_brand || '',
                        vehicle_model: this.request.vehicle_model || '',
                        vehicle_year: this.request.vehicle_year || null,
                        vehicle_color: this.request.vehicle_color || '',
                        plate_number: this.request.plate_number || '',
                        admin_notes: this.request.admin_notes || '',
                    });

                    this.firstFormGroup.markAsPristine();
                }
            });
        }
    }

    onSubmit() {
        if (this.firstFormGroup.valid && this.requestId) {
            const data = this.getDirtyFields();
            if (Object.keys(data).length === 0) {
                this.onCancel();
                return;
            }

            this.driverRequestsService.update(this.requestId, data).subscribe(() => {
                this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                this.router.navigate(['/driver-requests']);
            });
        } else {
            this.firstFormGroup.markAllAsTouched();
        }
    }

    onCancel() {
        this.router.navigate(['/driver-requests']);
    }

    getDirtyFields(): Partial<DriverRequest> {
        const data: Partial<DriverRequest> = {};
        Object.keys(this.firstFormGroup.controls).forEach(key => {
            const control = this.firstFormGroup.get(key);
            if (control?.dirty && !['company_name', 'status'].includes(key)) {
                if (key === 'vehicle_year') {
                    data[key] = control.value !== '' && control.value !== null ? parseInt(control.value) : null;
                } else {
                    data[key] = control.value;
                }
            }
        });
        return data;
    }

    confirmApprove() {
        Swal.fire({
            title: this.translate.instant('driver_requests.approve_request'),
            text: this.translate.instant('driver_requests.approve_confirm_msg'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('driver_requests.approve'),
            cancelButtonText: this.translate.instant('g.cancel')
        }).then(result => {
            if (result.isConfirmed) {
                this.approveRequest();
            }
        });
    }

    approveRequest() {
        if (this.requestId) {
            this.driverRequestsService.approve(this.requestId).subscribe((res) => {
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
                    }).then(() => {
                        this.router.navigate(['/driver-requests']);
                    });
                } else {
                    this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                    this.router.navigate(['/driver-requests']);
                }
            });
        }
    }

    confirmReject() {
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
                this.rejectRequest(result.value);
            }
        });
    }

    rejectRequest(adminNotes?: string) {
        if (this.requestId) {
            this.driverRequestsService.reject(this.requestId, adminNotes).subscribe(() => {
                this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                this.router.navigate(['/driver-requests']);
            });
        }
    }
}
