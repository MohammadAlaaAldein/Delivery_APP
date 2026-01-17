import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { USER_ROLE, UsersService } from '../users.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { User } from '../user.interface';
import { CommonService } from 'src/app/shared/services/common.service';
import { FormBuilderComponent } from 'src/app/shared/form-builder/form-builder.component';
import { ShopsService } from '../../shops/shops.service';
import { CompaniesService } from '../../companies/companies.service';
import { Shop } from '../../shops/shop.interface';
import { Company } from '../../companies/company.interface';

@Component({
	selector: 'app-create-user',
	standalone: true,
	imports: [ReactiveFormsModule, TranslateModule, FormBuilderComponent],
	templateUrl: './create-user.component.html',
	styleUrl: './create-user.component.scss'
})
export class CreateUserComponent {

	shops: { label: string; value: number }[] = [];
	companies: { label: string; value: number }[] = [];

	user: User = {
		id: null,
		name: "",
		email: "",
		password: "",
		confirm_password: "",
		role: null,
		entity_id: null,
	};

	fields = {
		name: { type: "text", is_required: true },
		email: { type: "email", is_required: true },
		role: {
			type: "select", is_required: true,
			options: Object.keys(USER_ROLE).map(role => ({ label: this.translateService.instant(`g.${role.toLowerCase()}`), value: USER_ROLE[role] })),
			callBack: () => this.handleRoleEntities(),
		},
		entity_id: { type: "select", options: [] },
		password: { type: "password", is_required: true },
		confirm_password: { type: "password", is_required: true },
	};

	formFieldsList = [];

	firstFormGroup = new FormGroup({});

	constructor(
		private _formBuilder: FormBuilder,
		private usersService: UsersService,
		private route: ActivatedRoute,
		private router: Router,
		private notificationMessageService: NotificationMessageService,
		private commonService: CommonService,
		private translateService: TranslateService,
		private shopsService: ShopsService,
		private companiesService: CompaniesService,
	) { }

	ngOnInit() {
		const requiredFieldsValidator = this.commonService.getRequireFieldsValidator(true);
		this.firstFormGroup = this._formBuilder.group({
			name: ['', [...requiredFieldsValidator, Validators.minLength(2)]],
			email: ['', [...requiredFieldsValidator, Validators.email]],
			password: ['', [...requiredFieldsValidator, Validators.minLength(6)]],
			confirm_password: ['', [...requiredFieldsValidator]],
			role: ['', [...requiredFieldsValidator, Validators.minLength(1)]],
			entity_id: ['', []],
		}, { validator: this.passwordMatchValidator });

		this.formFieldsList = Object.keys(this.fields);

		this.getShopsList();
	}

	checkAndFillUserData() {
		this.user.id = this.route.snapshot.paramMap.get('id') || '';
		if (this.user.id) {
			this.usersService.list({ id: this.user.id }).subscribe((res: { data: User[] }) => {
				if (res.data.length) {
					this.user = res.data[0];
					this.firstFormGroup.patchValue({
						name: this.user.name,
						email: this.user.email,
						role: this.user.role,
						entity_id: this.user.entity_id,
					});

					this.firstFormGroup.removeControl('password');
					this.firstFormGroup.removeControl('confirm_password');

					const { password, confirm_password, ...remainingFields } = this.fields;
					const newFields: any = {};

					Object.keys(remainingFields).forEach(key => { newFields[key] = remainingFields[key] });

					this.fields = newFields;
					this.formFieldsList = Object.keys(this.fields);

					this.firstFormGroup.markAsPristine();

					this.handleRoleEntities();
				}
			});
		}
	}

	getShopsList() {
		this.shopsService.list().subscribe((shops: { data: Shop[] }) => {
			this.shops = shops.data.map(shop => ({ label: shop.name, value: shop.id }));

			this.getCompaniesList();
		});
	}

	getCompaniesList() {
		this.companiesService.list().subscribe((companies: { data: Company[] }) => {
			this.companies = companies.data.map(company => ({ label: company.name, value: company.id }));

			this.checkAndFillUserData();
		});
	}

	handleRoleEntities() {
		const role = this.firstFormGroup.get('role')?.value;

		switch (role) {
			case USER_ROLE.SHOP:
				this.fields.entity_id.options = this.shops;
				break;
			case USER_ROLE.COMPANY:
			case USER_ROLE.DRIVER:
				this.fields.entity_id.options = this.companies;
				break;
			default:
				this.fields.entity_id.options = [];
				this.firstFormGroup.get('entity_id')?.setValue(null as never);
				break;
		}
	}

	passwordMatchValidator(group: FormGroup) {
		const password = group.get('password')?.value;
		const confirmPassword = group.get('confirm_password')?.value;
		return password === confirmPassword ? null : { mismatch: true };
	}

	onSubmit() {
		if (this.firstFormGroup.valid) {
			const user: Partial<User> = this.getUserDirtyFields(this.user.id, this.firstFormGroup);
			if ([USER_ROLE.ADMIN, USER_ROLE.DRIVER].includes(user.role) || !user.entity_id)
				user.entity_id = null;

			this.usersService.addUser(this.user.id, user).subscribe((res) => {
				this.notificationMessageService.setMessage('globalSuccessMsg', { clearOnXTimeNavigate: 1 });
				this.router.navigate(['/users']);
			});
		} else {
			console.log('Form is invalid');
			this.firstFormGroup.markAllAsTouched();
		}
	}

	onCancel() {
		this.router.navigate(['/users']);
	}

	getUserDirtyFields(userId: number, form: FormGroup) {
		let user: Partial<User> = {};
		if (userId) {
			Object.keys(form.controls).forEach(key => {
				const control = form.get(key);
				if (control?.dirty)
					user[key] = control.value;
			});
			return user;
		}
		else
			user = this.firstFormGroup.value as User;
		return user;
	}
}
