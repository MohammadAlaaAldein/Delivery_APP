import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ShopsService } from '../shops.service';
import { Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Shop } from '../shop.interface';
import { CommonService } from 'src/app/shared/services/common.service';
import { FormBuilderComponent } from 'src/app/shared/form-builder/form-builder.component';

@Component({
    selector: 'app-shop-dashboard',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslateModule, FormBuilderComponent],
    templateUrl: './shop-dashboard.component.html',
})
export class ShopDashboardComponent implements OnInit {

    shop: Shop = {
        id: null,
        name: "",
        company_ids: [],
        company_names: [],
        city: "",
        area: "",
        street: "",
        building: "",
        latitude: null,
        longitude: null,
        address: "",
        phone: "",
        whatsapp: "",
        email: "",
        license_number: "",
        license_type: "",
        license_expiry_date: "",
    }

    isLoading = true;

    cityOptions: { value: string, label: string }[] = [];

    fields: any = {
        name: { type: "text", is_required: true },
        company_names: { type: "text", disabled: true },
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

    firstFormGroup = new FormGroup({});

    constructor(
        private _formBuilder: FormBuilder,
        private shopsService: ShopsService,
        private router: Router,
        private notificationMessageService: NotificationMessageService,
        private commonService: CommonService,
        private translate: TranslateService,
    ) { }

    ngOnInit() {
        this.initCityOptions();

        this.firstFormGroup = this._formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            company_names: [{ value: '', disabled: true }],
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
        }, { validator: '' });

        this.formFieldsList = Object.keys(this.fields);
        this.loadMyShop();
    }

    initCityOptions() {
        this.cityOptions = this.commonService.getCityOptions();
        this.fields = {
            ...this.fields,
            city: { ...this.fields.city, options: this.cityOptions }
        };
    }

    loadMyShop() {
        this.isLoading = true;
        this.shopsService.getMyShop().subscribe({
            next: (res: { data: Shop }) => {
                this.shop = res.data;
                this.firstFormGroup.patchValue({
                    name: this.shop.name,
                    company_names: (this.shop.company_names || []).join(', '),
                    city: this.shop.city || '',
                    area: this.shop.area || '',
                    street: this.shop.street || '',
                    building: this.shop.building || '',
                    latitude: this.shop.latitude || null,
                    longitude: this.shop.longitude || null,
                    address: this.shop.address || '',
                    phone: this.shop.phone || '',
                    whatsapp: this.shop.whatsapp || '',
                    email: this.shop.email || '',
                    license_number: this.shop.license_number || '',
                    license_type: this.shop.license_type || '',
                    license_expiry_date: this.commonService.formatDateForInput(this.shop.license_expiry_date),
                });

                this.firstFormGroup.markAsPristine();
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Error loading shop data:', err);
            }
        });
    }

    onSubmit() {
        if (this.firstFormGroup.valid) {
            const shop: Partial<Shop> = this.getShopDirtyFields(this.firstFormGroup);
            if (Object.keys(shop).length === 0) {
                this.notificationMessageService.setMessage('g.no_changes', { clearOnXTimeNavigate: 1 });
                return;
            }

            this.shopsService.updateMyShop(shop).subscribe({
                next: (res) => {
                    this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                    this.loadMyShop(); // Reload to get fresh data
                },
                error: (err) => {
                    console.error('Error updating shop:', err);
                }
            });
        } else {
            console.log('Form is invalid');
            this.firstFormGroup.markAllAsTouched();
        }
    }

    getShopDirtyFields(form: FormGroup) {
        let shop: Partial<Shop> = {};
        Object.keys(form.controls).forEach(key => {
            const control = form.get(key);
            // Skip company_names as shop users cannot edit it
            if (key === 'company_names') return;

            if (control?.dirty) {
                if (key === 'latitude' || key === 'longitude') {
                    shop[key] = control.value !== '' && control.value !== null ? parseFloat(control.value) : null;
                } else {
                    shop[key] = control.value;
                }
            }
        });

        return shop;
    }

    onCancel() {
        this.router.navigate(['/']);
    }
}
