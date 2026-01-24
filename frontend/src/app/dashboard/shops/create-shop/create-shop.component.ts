import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ShopsService } from '../shops.service';
import { ActivatedRoute, Router, RouterEvent } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Shop } from '../shop.interface';
import { CommonService } from 'src/app/shared/services/common.service';
import { FormBuilderComponent } from 'src/app/shared/form-builder/form-builder.component';
import { Company } from '../../companies/company.interface';

@Component({
	selector: 'app-create-shop',
	standalone: true,
	imports: [ReactiveFormsModule, TranslateModule, FormBuilderComponent],
	templateUrl: './create-shop.component.html',
})
export class CreateShopComponent {

	shop: Shop = {
		id: null,
		name: "",
		company_ids: [],
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

	companies: Company[] = [];

	cityOptions: { value: string, label: string }[] = [];

	fields: any = {
		name: { type: "text", is_required: true },
		company_ids: { type: "multi-select", items: [], bindLabel: 'name', bindValue: 'id', addTag: false },
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
			company_ids: [[]],
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
		this.loadCompanies();
		this.checkAndFillShopData();
	}

	initCityOptions() {
		this.cityOptions = this.commonService.getCityOptions();
		this.fields = {
			...this.fields,
			city: { ...this.fields.city, options: this.cityOptions }
		};
	}

	loadCompanies() {
		this.shopsService.listCompanies({ is_active: true }).subscribe((res: { data: Company[] }) => {
			this.companies = res.data;
			this.fields = {
				...this.fields,
				company_ids: { ...this.fields.company_ids, items: this.companies }
			};
		});
	}

	checkAndFillShopData() {
		this.shop.id = this.route.snapshot.paramMap.get('id') || '';

		if (this.shop.id) {
			this.shopsService.list({ id: this.shop.id }).subscribe((res: { data: Shop[] }) => {
				if (res.data.length) {
					this.shop = res.data[0];
					this.firstFormGroup.patchValue({
						name: this.shop.name,
						company_ids: this.shop.company_ids || [],
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
				}
			});
		}
	}

	onSubmit() {
		if (this.firstFormGroup.valid) {
			const shop: Partial<Shop> = this.getShopDirtyFields(this.shop.id, this.firstFormGroup);
			this.shopsService.addShop(this.shop.id, shop).subscribe((res) => {
				this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
				this.router.navigate(['/shops']);
			});
		} else {
			console.log('Form is invalid');
			this.firstFormGroup.markAllAsTouched();
		}
	}

	onCancel() {
		this.router.navigate(['/shops']);
	}

	getShopDirtyFields(shopId: number, form: FormGroup) {
		let shop: Partial<Shop> = {};
		if (shopId) {
			Object.keys(form.controls).forEach(key => {
				const control = form.get(key);
				if (control?.dirty) {
					if (key === 'latitude' || key === 'longitude') {
						shop[key] = control.value !== '' && control.value !== null ? parseFloat(control.value) : null;
					} else {
						shop[key] = control.value;
					}
				}
			});

			return shop;
		} else {
			shop = { ...this.firstFormGroup.value } as Shop;
			// Convert latitude/longitude to numbers
			if (shop.latitude !== null && shop.latitude !== undefined && shop.latitude !== '') {
				shop.latitude = parseFloat(shop.latitude as any);
			} else {
				delete shop.latitude;
			}
			if (shop.longitude !== null && shop.longitude !== undefined && shop.longitude !== '') {
				shop.longitude = parseFloat(shop.longitude as any);
			} else {
				delete shop.longitude;
			}
		}

		return shop;
	}
}
