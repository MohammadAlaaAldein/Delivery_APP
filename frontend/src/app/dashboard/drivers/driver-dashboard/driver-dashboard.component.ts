import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DriversService, VehicleType } from '../drivers.service';
import { Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Driver } from '../driver.interface';
import { CommonService } from 'src/app/shared/services/common.service';
import { FormBuilderComponent } from 'src/app/shared/form-builder/form-builder.component';

@Component({
    selector: 'app-driver-dashboard',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslateModule, FormBuilderComponent],
    templateUrl: './driver-dashboard.component.html',
})
export class DriverDashboardComponent implements OnInit {

    driver: Driver = {
        user_id: null,
        is_active: true,
        company_id: null,
    }

    driverName: string = ''; // Name from users table (read-only)
    isLoading = true;

    vehicleTypeOptions = [];

    fields: any = {
        // Personal Information Section
        personal_info: { type: "label" },
        national_id: { type: "text" },
        birth_date: { type: "date" },
        phone: { type: "text" },
        city: { type: "text" },

        // License Information Section
        license_info: { type: "label" },
        license_number: { type: "text" },
        license_expiry_date: { type: "date" },

        // Vehicle Information Section
        vehicle_info: { type: "label" },
        vehicle_type: { type: "select", options: [] },
        vehicle_brand: { type: "text" },
        vehicle_model: { type: "text" },
        vehicle_year: { type: "number" },
        vehicle_color: { type: "text" },
        plate_number: { type: "text" },
    }
    formFieldsList = [];

    firstFormGroup: FormGroup;

    constructor(
        private _formBuilder: FormBuilder,
        private driversService: DriversService,
        private router: Router,
        private notificationMessageService: NotificationMessageService,
        private commonService: CommonService,
        private translate: TranslateService,
    ) { }

    ngOnInit() {
        this.firstFormGroup = this._formBuilder.group({
            national_id: [''],
            birth_date: [''],
            phone: [''],
            city: [''],
            license_number: [''],
            license_expiry_date: [''],
            vehicle_type: [null],
            vehicle_brand: [''],
            vehicle_model: [''],
            vehicle_year: [null],
            vehicle_color: [''],
            plate_number: [''],
        });

        this.formFieldsList = Object.keys(this.fields);

        // Set vehicle type options
        this.vehicleTypeOptions = [
            { value: VehicleType.CAR, label: this.translate.instant('drivers.vehicle_types.car') },
            { value: VehicleType.MOTORCYCLE, label: this.translate.instant('drivers.vehicle_types.motorcycle') },
            { value: VehicleType.TRUCK, label: this.translate.instant('drivers.vehicle_types.truck') },
            { value: VehicleType.VAN, label: this.translate.instant('drivers.vehicle_types.van') },
            { value: VehicleType.BICYCLE, label: this.translate.instant('drivers.vehicle_types.bicycle') },
        ];

        this.fields = {
            ...this.fields,
            vehicle_type: { ...this.fields.vehicle_type, options: this.vehicleTypeOptions }
        };

        this.loadMyDriver();
    }

    loadMyDriver() {
        this.isLoading = true;
        this.driversService.getMyDriver().subscribe({
            next: (res: { data: Driver }) => {
                this.driver = res.data;
                this.driverName = this.driver.name || '';
                this.firstFormGroup.patchValue({
                    national_id: this.driver.national_id || '',
                    birth_date: this.commonService.formatDateForInput(this.driver.birth_date as any),
                    phone: this.driver.phone || '',
                    city: this.driver.city || '',
                    license_number: this.driver.license_number || '',
                    license_expiry_date: this.commonService.formatDateForInput(this.driver.license_expiry_date as any),
                    vehicle_type: this.driver.vehicle_type || null,
                    vehicle_brand: this.driver.vehicle_brand || '',
                    vehicle_model: this.driver.vehicle_model || '',
                    vehicle_year: this.driver.vehicle_year || null,
                    vehicle_color: this.driver.vehicle_color || '',
                    plate_number: this.driver.plate_number || '',
                });

                this.firstFormGroup.markAsPristine();
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Error loading driver data:', err);
            }
        });
    }

    onSubmit() {
        if (this.firstFormGroup.valid) {
            const driver: Partial<Driver> = this.getDriverDirtyFields(this.firstFormGroup);
            if (Object.keys(driver).length === 0) {
                this.notificationMessageService.setMessage('g.no_changes', { clearOnXTimeNavigate: 1 });
                return;
            }

            this.driversService.updateMyDriver(driver).subscribe({
                next: (res) => {
                    this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                    this.loadMyDriver(); // Reload to get fresh data
                },
                error: (err) => {
                    console.error('Error updating driver:', err);
                }
            });
        } else {
            console.log('Form is invalid');
            this.firstFormGroup.markAllAsTouched();
        }
    }

    getDriverDirtyFields(form: FormGroup) {
        let driver: Partial<Driver> = {};
        Object.keys(form.controls).forEach(key => {
            const control = form.get(key);
            if (control?.dirty) {
                let value = control.value;
                // Convert vehicle_year to number
                if (key === 'vehicle_year' && value !== null && value !== '') {
                    value = parseInt(value, 10);
                }
                driver[key] = value;
            }
        });

        return driver;
    }

    onCancel() {
        this.router.navigate(['/']);
    }
}
