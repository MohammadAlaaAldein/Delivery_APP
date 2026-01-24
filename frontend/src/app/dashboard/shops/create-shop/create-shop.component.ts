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
	}

	companies: Company[] = [];

	fields: any = {
		name: { type: "text", is_required: true },
		company_ids: { type: "multi-select", items: [], bindLabel: 'name', bindValue: 'id', addTag: false },
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
		this.firstFormGroup = this._formBuilder.group({
			name: ['', [Validators.required, Validators.minLength(2)]],
			company_ids: [[]],
		}, { validator: '' });

		this.formFieldsList = Object.keys(this.fields);
		this.loadCompanies();
		this.checkAndFillShopData();
	}

	loadCompanies() {
		this.shopsService.listCompanies({}).subscribe((res: { data: Company[] }) => {
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
				if (control?.dirty)
					shop[key] = control.value;
			});

			return shop;
		} else
			shop = this.firstFormGroup.value as Shop;

		return shop;
	}
}
