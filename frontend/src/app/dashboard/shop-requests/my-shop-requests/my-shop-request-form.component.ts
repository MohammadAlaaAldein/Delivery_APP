import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ShopRequestsService } from '../shop-requests.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { ShopRequest } from '../shop-request.interface';
import { CommonService } from 'src/app/shared/services/common.service';
import { FormBuilderComponent } from 'src/app/shared/form-builder/form-builder.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-my-shop-request-form',
    standalone: true,
    imports: [ReactiveFormsModule, TranslateModule, FormBuilderComponent, CommonModule],
    templateUrl: './my-shop-request-form.component.html',
})
export class MyShopRequestFormComponent {

    request: ShopRequest | null = null;
    requestId: number | null = null;
    isCreateMode: boolean = false;

    cityOptions: { value: string, label: string }[] = [];

    fields: any = {
        name: { type: "text", is_required: true },
        city: { type: "select", options: [], section: 'location_info' },
        area: { type: "text", section: 'location_info' },
        street: { type: "text", section: 'location_info' },
        building: { type: "text", section: 'location_info' },
        latitude: { type: "number", section: 'location_info' },
        longitude: { type: "number", section: 'location_info' },
        address: { type: "textarea", section: 'location_info' },
        phone: { type: "text", section: 'contact_info' },
        whatsapp: { type: "text", section: 'contact_info' },
        email: { type: "email", section: 'contact_info' },
        license_number: { type: "text", section: 'license_info' },
        license_type: { type: "text", section: 'license_info' },
        license_expiry_date: { type: "date", section: 'license_info' },
    }
    formFieldsList = [];

    firstFormGroup!: FormGroup;

    constructor(
        private _formBuilder: FormBuilder,
        private shopRequestsService: ShopRequestsService,
        private route: ActivatedRoute,
        private router: Router,
        private notificationMessageService: NotificationMessageService,
        private commonService: CommonService,
        private translate: TranslateService,
    ) { }

    ngOnInit() {
        this.initCityOptions();
        this.isCreateMode = this.route.snapshot.url.some(segment => segment.path === 'create');

        this.firstFormGroup = this._formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            city: [''],
            area: [''],
            street: [''],
            building: [''],
            latitude: [null],
            longitude: [null],
            address: [''],
            phone: [''],
            whatsapp: [''],
            email: ['', [Validators.email]],
            license_number: [''],
            license_type: [''],
            license_expiry_date: [''],
        });

        this.formFieldsList = Object.keys(this.fields);

        if (!this.isCreateMode) {
            this.loadRequestData();
        }
    }

    initCityOptions() {
        this.cityOptions = this.commonService.getCityOptions();
        this.fields = {
            ...this.fields,
            city: { ...this.fields.city, options: this.cityOptions }
        };
    }

    loadRequestData() {
        this.requestId = +this.route.snapshot.paramMap.get('id');

        if (this.requestId) {
            this.shopRequestsService.getMyRequests().subscribe((res) => {
                const request = res.data.find(r => r.id === this.requestId);
                if (request) {
                    this.request = request;
                    this.firstFormGroup.patchValue({
                        name: this.request.name,
                        city: this.request.city || '',
                        area: this.request.area || '',
                        street: this.request.street || '',
                        building: this.request.building || '',
                        latitude: this.request.latitude || null,
                        longitude: this.request.longitude || null,
                        address: this.request.address || '',
                        phone: this.request.phone || '',
                        whatsapp: this.request.whatsapp || '',
                        email: this.request.email || '',
                        license_number: this.request.license_number || '',
                        license_type: this.request.license_type || '',
                        license_expiry_date: this.commonService.formatDateForInput(this.request.license_expiry_date),
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
                this.shopRequestsService.createRequest(data).subscribe(() => {
                    this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                    this.router.navigate(['/my-shop-requests']);
                });
            } else if (this.requestId) {
                this.shopRequestsService.updateMyRequest(this.requestId, data).subscribe(() => {
                    this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                    this.router.navigate(['/my-shop-requests']);
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

        this.shopRequestsService.deleteMyRequest(this.requestId).subscribe({
            next: () => {
                this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                this.router.navigate(['/my-shop-requests']);
            },
            error: (err) => {
                this.notificationMessageService.setMessage(err.error?.message || 'g.something_went_wrong', { clearOnXTimeNavigate: 1 });
            }
        });
    }

    onCancel() {
        this.router.navigate(['/my-shop-requests']);
    }
}
