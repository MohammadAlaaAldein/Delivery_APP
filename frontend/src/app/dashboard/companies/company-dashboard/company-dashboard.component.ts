import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CompaniesService } from '../companies.service';
import { Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Company } from '../company.interface';
import { CommonService } from 'src/app/shared/services/common.service';
import { FormBuilderComponent } from 'src/app/shared/form-builder/form-builder.component';

@Component({
    selector: 'app-company-dashboard',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslateModule, FormBuilderComponent],
    templateUrl: './company-dashboard.component.html',
})
export class CompanyDashboardComponent implements OnInit {

    company: Company = {
        id: null,
        name: "",
        shop_ids: [],
        shop_names: [],
        city: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        company_type: "",
        license_number: "",
        license_expiry_date: "",
    }

    isLoading = true;

    cityOptions: { value: string, label: string }[] = [];

    fields: any = {
        name: { type: "text", is_required: true },
        shop_names: { type: "text", disabled: true },
        city: { type: "select", options: [], section: 'location_info' },
        address: { type: "textarea", section: 'location_info' },
        phone: { type: "text", section: 'contact_info' },
        email: { type: "email", section: 'contact_info' },
        website: { type: "text", section: 'contact_info' },
        company_type: { type: "text", section: 'company_info' },
        license_number: { type: "text", section: 'license_info' },
        license_expiry_date: { type: "date", section: 'license_info' },
    }
    formFieldsList = [];

    firstFormGroup = new FormGroup({});

    constructor(
        private _formBuilder: FormBuilder,
        private companiesService: CompaniesService,
        private router: Router,
        private notificationMessageService: NotificationMessageService,
        private commonService: CommonService,
        private translate: TranslateService,
    ) { }

    ngOnInit() {
        this.initCityOptions();

        this.firstFormGroup = this._formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            shop_names: [{ value: '', disabled: true }],
            city: [''],
            address: [''],
            phone: [''],
            email: ['', [Validators.email]],
            website: [''],
            company_type: [''],
            license_number: [''],
            license_expiry_date: [''],
        }, { validator: '' });

        this.formFieldsList = Object.keys(this.fields);
        this.loadMyCompany();
    }

    initCityOptions() {
        this.cityOptions = this.commonService.getCityOptions();
        this.fields = {
            ...this.fields,
            city: { ...this.fields.city, options: this.cityOptions }
        };
    }

    loadMyCompany() {
        this.isLoading = true;
        this.companiesService.getMyCompany().subscribe({
            next: (res: { data: Company }) => {
                this.company = res.data;
                this.firstFormGroup.patchValue({
                    name: this.company.name,
                    shop_names: (this.company.shop_names || []).join(', '),
                    city: this.company.city || '',
                    address: this.company.address || '',
                    phone: this.company.phone || '',
                    email: this.company.email || '',
                    website: this.company.website || '',
                    company_type: this.company.company_type || '',
                    license_number: this.company.license_number || '',
                    license_expiry_date: this.commonService.formatDateForInput(this.company.license_expiry_date),
                });

                this.firstFormGroup.markAsPristine();
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Error loading company data:', err);
            }
        });
    }

    onSubmit() {
        if (this.firstFormGroup.valid) {
            const company: Partial<Company> = this.getCompanyDirtyFields(this.firstFormGroup);
            if (Object.keys(company).length === 0) {
                this.notificationMessageService.setMessage('g.no_changes', { clearOnXTimeNavigate: 1 });
                return;
            }

            this.companiesService.updateMyCompany(company).subscribe({
                next: (res) => {
                    this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
                    this.loadMyCompany(); // Reload to get fresh data
                },
                error: (err) => {
                    console.error('Error updating company:', err);
                }
            });
        } else {
            console.log('Form is invalid');
            this.firstFormGroup.markAllAsTouched();
        }
    }

    getCompanyDirtyFields(form: FormGroup) {
        let company: Partial<Company> = {};
        Object.keys(form.controls).forEach(key => {
            const control = form.get(key);
            // Skip shop_names as company users cannot edit it
            if (key === 'shop_names') return;

            if (control?.dirty) {
                company[key] = control.value;
            }
        });

        return company;
    }

    onCancel() {
        this.router.navigate(['/']);
    }
}
