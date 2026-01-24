import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CompaniesService } from '../companies.service';
import { ActivatedRoute, Router, RouterEvent } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Company } from '../company.interface';
import { CommonService } from 'src/app/shared/services/common.service';
import { FormBuilderComponent } from 'src/app/shared/form-builder/form-builder.component';
import { Shop } from '../../shops/shop.interface';

@Component({
	selector: 'app-create-company',
	standalone: true,
	imports: [ReactiveFormsModule, TranslateModule, FormBuilderComponent],
	templateUrl: './create-company.component.html',
})
export class CreateCompanyComponent {

	company: Company = {
		id: null,
		name: "",
		shop_ids: [],
		city: "",
		address: "",
		phone: "",
		email: "",
		website: "",
		company_type: "",
		license_number: "",
		license_expiry_date: "",
	}

	shops: Shop[] = [];

	cityOptions: { value: string, label: string }[] = [];

	fields: any = {
		name: { type: "text", is_required: true },
		shop_ids: { type: "multi-select", items: [], bindLabel: 'name', bindValue: 'id', addTag: false },
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
		private route: ActivatedRoute,
		private router: Router,
		private notificationMessageService: NotificationMessageService,
		private commonService: CommonService,
		private translate: TranslateService,
	) { }

	ngOnInit() {
		this.initCityOptions();

		this.firstFormGroup = this._formBuilder.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			shop_ids: [[]],
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
		this.loadShops();
		this.checkAndFillCompanyData();
	}

	initCityOptions() {
		this.cityOptions = this.commonService.getCityOptions();
		this.fields = {
			...this.fields,
			city: { ...this.fields.city, options: this.cityOptions }
		};
	}

	loadShops() {
		this.companiesService.listShops({ is_active: true }).subscribe((res: { data: Shop[] }) => {
			this.shops = res.data;
			this.fields = {
				...this.fields,
				shop_ids: { ...this.fields.shop_ids, items: this.shops }
			};
		});
	}

	checkAndFillCompanyData() {
		this.company.id = this.route.snapshot.paramMap.get('id') || '';

		if (this.company.id) {
			this.companiesService.list({ id: this.company.id }).subscribe((res: { data: Company[] }) => {
				if (res.data.length) {
					this.company = res.data[0];
					this.firstFormGroup.patchValue({
						name: this.company.name,
						shop_ids: this.company.shop_ids || [],
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
				}
			});
		}
	}

	onSubmit() {
		if (this.firstFormGroup.valid) {
			const company: Partial<Company> = this.getCompanyDirtyFields(this.company.id, this.firstFormGroup);
			this.companiesService.addCompany(this.company.id, company).subscribe((res) => {
				this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
				this.router.navigate(['/companies']);
			});
		} else {
			console.log('Form is invalid');
			this.firstFormGroup.markAllAsTouched();
		}
	}

	onCancel() {
		this.router.navigate(['/companies']);
	}

	getCompanyDirtyFields(companyId: number, form: FormGroup) {
		let company: Partial<Company> = {};
		if (companyId) {
			Object.keys(form.controls).forEach(key => {
				const control = form.get(key);
				if (control?.dirty)
					company[key] = control.value;
			});

			return company;
		} else
			company = this.firstFormGroup.value as Company;

		return company;
	}
}
