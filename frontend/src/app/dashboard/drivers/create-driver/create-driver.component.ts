import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DriversService, VehicleType } from '../drivers.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Driver } from '../driver.interface';
import { CommonService } from 'src/app/shared/services/common.service';
import { FormBuilderComponent } from 'src/app/shared/form-builder/form-builder.component';
import { Company } from '../../companies/company.interface';

@Component({
    selector: 'app-create-driver',
    standalone: true,
    imports: [ReactiveFormsModule, TranslateModule, FormBuilderComponent],
    templateUrl: './create-driver.component.html',
})
export class CreateDriverComponent implements OnInit {

    driver: Driver = {
        id: null,
        user_id: null,
        is_active: true,
        company_id: null,
    }

    driverName: string = ''; // Name from users table (read-only)

    companies: Company[] = [];

    vehicleTypeOptions = [];

    fields: any = {
        // Personal Information
        national_id: { type: "text", label: 'drivers.national_id' },
        birth_date: { type: "date", label: 'drivers.birth_date' },
        phone: { type: "text", label: 'drivers.phone' },
        city: { type: "text", label: 'drivers.city' },
        // personal_image: { type: "file", label: 'drivers.personal_image' }, // TODO: Implement file upload

        // License Information
        license_number: { type: "text", label: 'drivers.license_number' },
        license_expiry_date: { type: "date", label: 'drivers.license_expiry_date' },
        // license_image: { type: "file", label: 'drivers.license_image' }, // TODO: Implement file upload

        // Vehicle Information
        vehicle_type: { type: "select", options: [], label: 'drivers.vehicle_type' },
        vehicle_brand: { type: "text", label: 'drivers.vehicle_brand' },
        vehicle_model: { type: "text", label: 'drivers.vehicle_model' },
        vehicle_year: { type: "number", label: 'drivers.vehicle_year' },
        vehicle_color: { type: "text", label: 'drivers.vehicle_color' },
        plate_number: { type: "text", label: 'drivers.plate_number' },
        // vehicle_image: { type: "file", label: 'drivers.vehicle_image' }, // TODO: Implement file upload
    }
    formFieldsList = [];

    firstFormGroup: FormGroup;

    constructor(
        private _formBuilder: FormBuilder,
        private driversService: DriversService,
        private route: ActivatedRoute,
        private router: Router,
        private notificationMessageService: NotificationMessageService,
        private commonService: CommonService,
        private translate: TranslateService,
    ) { }

    ngOnInit() {
        // Redirect if no driver id (create is not allowed, drivers are created via users)
        const driverId = this.route.snapshot.paramMap.get('id');
        if (!driverId) {
            this.router.navigate(['/drivers']);
            return;
        }

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

        // Set vehicle type options (translate here to ensure translations are ready)
        this.vehicleTypeOptions = [
            { value: VehicleType.CAR, label: this.translate.instant('drivers.vehicle_types.car') },
            { value: VehicleType.MOTORCYCLE, label: this.translate.instant('drivers.vehicle_types.motorcycle') },
            { value: VehicleType.TRUCK, label: this.translate.instant('drivers.vehicle_types.truck') },
            { value: VehicleType.VAN, label: this.translate.instant('drivers.vehicle_types.van') },
            { value: VehicleType.BICYCLE, label: this.translate.instant('drivers.vehicle_types.bicycle') },
        ];

        // Set vehicle type options
        this.fields = {
            ...this.fields,
            vehicle_type: { ...this.fields.vehicle_type, options: this.vehicleTypeOptions }
        };

        this.checkAndFillDriverData();
    }

    checkAndFillDriverData() {
        const driverId = this.route.snapshot.paramMap.get('id');

        if (driverId) {
            this.driversService.list({ id: parseInt(driverId) }).subscribe((res: { data: Driver[] }) => {
                if (res.data.length) {
                    this.driver = res.data[0];
                    this.driverName = this.driver.name || ''; // Name from users table
                    this.firstFormGroup.patchValue({
                        national_id: this.driver.national_id || '',
                        birth_date: this.driver.birth_date ? this.driver.birth_date.split('T')[0] : '',
                        phone: this.driver.phone || '',
                        city: this.driver.city || '',
                        license_number: this.driver.license_number || '',
                        license_expiry_date: this.driver.license_expiry_date ? this.driver.license_expiry_date.split('T')[0] : '',
                        vehicle_type: this.driver.vehicle_type || null,
                        vehicle_brand: this.driver.vehicle_brand || '',
                        vehicle_model: this.driver.vehicle_model || '',
                        vehicle_year: this.driver.vehicle_year || null,
                        vehicle_color: this.driver.vehicle_color || '',
                        plate_number: this.driver.plate_number || '',
                    });

                    this.firstFormGroup.markAsPristine();
                }
            });
        }
    }

    onSubmit() {
        if (this.firstFormGroup.valid) {
            const driver: Partial<Driver> = this.getDriverDirtyFields(this.driver.id, this.firstFormGroup);
            this.driversService.addDriver(this.driver.id, driver).subscribe((res) => {
                this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                this.router.navigate(['/drivers']);
            });
        } else {
            console.log('Form is invalid');
            this.firstFormGroup.markAllAsTouched();
        }
    }

    onCancel() {
        this.router.navigate(['/drivers']);
    }

    getDriverDirtyFields(driverId: number, form: FormGroup) {
        let driver: Partial<Driver> = {};
        if (driverId) {
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
        } else
            driver = this.firstFormGroup.value as Driver;

        return driver;
    }
}
