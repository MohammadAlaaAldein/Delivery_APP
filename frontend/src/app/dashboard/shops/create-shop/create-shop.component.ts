import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ShopsService } from '../shops.service';
import { ActivatedRoute, Router, RouterEvent } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Shop } from '../shop.interface';
import { CommonService } from 'src/app/shared/services/common.service';
import { FormBuilderComponent } from 'src/app/shared/form-builder/form-builder.component';

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
	}

	fields = {
		name: { type: "text", is_required: true },
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
	) { }

	ngOnInit() {
		const requiredFieldsValidator = this.commonService.getRequireFieldsValidator(true);
		this.firstFormGroup = this._formBuilder.group({
			name: ['', [...requiredFieldsValidator, Validators.minLength(2)]],
		}, { validator: '' });

		this.formFieldsList = Object.keys(this.fields);
		this.checkAndFillShopData();
	}

	checkAndFillShopData() {
		this.shop.id = this.route.snapshot.paramMap.get('id') || '';

		if (this.shop.id) {
			this.shopsService.list({ id: this.shop.id }).subscribe((res: { data: Shop[] }) => {
				if (res.data.length) {
					this.shop = res.data[0];
					this.firstFormGroup.patchValue({
						name: this.shop.name,
					});

					this.firstFormGroup.removeControl('password');
					this.firstFormGroup.removeControl('confirm_password');

					const { ...remainingFields } = this.fields;
					const newFields: any = {};

					Object.keys(remainingFields).forEach(key => { newFields[key] = remainingFields[key] });

					this.fields = newFields;
					this.formFieldsList = Object.keys(this.fields);

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
