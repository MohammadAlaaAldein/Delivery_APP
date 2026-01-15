import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CompaniesService } from '../companies.service';
import { ActivatedRoute, Router, RouterEvent } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Company } from '../company.interface';
import { CommonService } from 'src/app/shared/services/common.service';
import { FormBuilderComponent } from 'src/app/shared/form-builder/form-builder.component';

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
	}

	fields = {
		name: { type: "text", is_required: true },
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
	) { }

	ngOnInit() {
		const requiredFieldsValidator = this.commonService.getRequireFieldsValidator(true);
		this.firstFormGroup = this._formBuilder.group({
			name: ['', [...requiredFieldsValidator, Validators.minLength(2)]],
		}, { validator: '' });

		this.formFieldsList = Object.keys(this.fields);
		this.checkAndFillCompanyData();
	}

	checkAndFillCompanyData() {
		this.company.id = this.route.snapshot.paramMap.get('id') || '';

		if (this.company.id) {
			this.companiesService.list({ id: this.company.id }).subscribe((res: { data: Company[] }) => {
				if (res.data.length) {
					this.company = res.data[0];
					this.firstFormGroup.patchValue({
						name: this.company.name,
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
