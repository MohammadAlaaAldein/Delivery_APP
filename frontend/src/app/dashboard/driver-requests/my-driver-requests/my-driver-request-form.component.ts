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

@Component({
    selector: 'app-my-driver-request-form',
    standalone: true,
    imports: [ReactiveFormsModule, TranslateModule, FormBuilderComponent, CommonModule],
    templateUrl: './my-driver-request-form.component.html',
})
export class MyDriverRequestFormComponent {

    request: DriverRequest | null = null;
    requestId: number | null = null;
    isCreateMode: boolean = false;

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
        email: { type: "email", is_required: true, section: 'personal_info' },
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
        this.isCreateMode = this.route.snapshot.url.some(segment => segment.path === 'create');

        this.firstFormGroup = this._formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
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
        });

        this.formFieldsList = Object.keys(this.fields);

        if (!this.isCreateMode) {
            this.loadRequestData();
        }
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
            this.driverRequestsService.getMyRequests().subscribe((res) => {
                const request = res.data.find(r => r.id === this.requestId);
                if (request) {
                    this.request = request;
                    this.firstFormGroup.patchValue({
                        name: this.request.name,
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
                    });

                    this.firstFormGroup.markAsPristine();
                }
            });
        }
    }

    onSubmit() {
        if (this.firstFormGroup.valid) {
            const data = this.firstFormGroup.value;

            if (this.isCreateMode) {
                this.driverRequestsService.createRequest(data).subscribe(() => {
                    this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                    this.router.navigate(['/my-driver-requests']);
                });
            } else if (this.requestId) {
                this.driverRequestsService.updateMyRequest(this.requestId, data).subscribe(() => {
                    this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                    this.router.navigate(['/my-driver-requests']);
                });
            }
        } else {
            this.firstFormGroup.markAllAsTouched();
        }
    }

    deleteRequest() {
        if (!confirm(this.translate.instant('g.confirm_delete'))) {
            return;
        }

        this.driverRequestsService.deleteMyRequest(this.requestId).subscribe({
            next: () => {
                this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                this.router.navigate(['/my-driver-requests']);
            },
            error: (err) => {
                this.notificationMessageService.setMessage(err.error?.message || 'g.something_went_wrong', { clearOnXTimeNavigate: 1 });
            }
        });
    }

    onCancel() {
        this.router.navigate(['/my-driver-requests']);
    }
}
