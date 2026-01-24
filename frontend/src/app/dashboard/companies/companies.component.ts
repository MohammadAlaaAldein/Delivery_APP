import { Component } from '@angular/core';
import { CompaniesService } from './companies.service';
import { CommonModule } from '@angular/common';
import { keyBy as _keyBy } from 'lodash';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { SCTTableModule } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/sct-table.module';
import { ColumnsConfig, TableConfig, TableData } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/custom-table-interface';

import moment from 'moment';
import { CardComponent } from "../../theme/shared/components/card/card.component";
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Company } from './company.interface';
import { Shop } from '../shops/shop.interface';

@Component({
	selector: 'app-companies',
	standalone: true,
	imports: [CommonModule, SCTTableModule, TranslateModule, CardComponent, FormsModule,],
	templateUrl: './companies.component.html'
})
export class CompaniesComponent {

	companies: Company[] = [];
	shops: Shop[] = [];
	shopsMap: { [key: number]: Shop } = {};

	columnConfig: ColumnsConfig[] = [
		{ key: 'name', name: this.translate.instant('companies.name'), type: 'string' },
		{ key: 'shops', name: this.translate.instant('companies.shops'), type: 'string' },
		{ key: 'create_date', name: this.translate.instant('g.creation_date'), type: 'date' },
		{ key: 'actions', name: this.translate.instant('g.actions'), type: 'dropdown' }
	];

	filterColumns = [
		{ key: 'name', title: this.translate.instant('companies.name'), type: "text" },
		{ key: 'id', title: this.translate.instant('g.id'), type: "number" },
	];

	filters = {
		name: "",
		id: 0,
	}

	tableData: TableData[] = [];
	tableConfig: TableConfig = {
		hasExport: false,
		hasPagination: true,
		pageSize: 100,
		pageSizeOptions: [20, 50, 100, 200],
		fitScreen: true,
		hideNoData: true,
		hasActionButtons: true,
		actionButtonsList: [
			{ text: this.translate.instant('companies.add_company'), link: ['/', 'companies', 'create'], enable: true },
		],
	};

	constructor(
		private companiesService: CompaniesService,
		private translate: TranslateService,
		private router: Router,
		private notificationService: NotificationMessageService,
	) { }

	ngOnInit() {
		this.loadShops();
	}

	loadShops() {
		this.companiesService.listShops({}).subscribe((res: { data: Shop[] }) => {
			this.shops = res.data;
			this.shopsMap = _keyBy(this.shops, 'id');
			this.getCompaniesList(this.filters);
		});
	}

	search() {
		this.getCompaniesList(this.filters);
	}

	getCompaniesList(filters: { name?: string; email?: string; id?: number; }) {
		this.companiesService.list(filters).subscribe((res: { data: Company[] }) => {
			const companies = res.data;
			const data = [];
			for (const company of companies) {
				const options = [
					{ text: this.translate.instant('g.edit'), action: () => { this.edit(company) } },
					{ text: this.translate.instant('g.delete'), action: () => { this.confirmDeleteCompany(company) } },
				];

				const shopNames = (company.shop_ids || [])
					.map(id => this.shopsMap[id]?.name)
					.filter(name => name)
					.join(', ');

				data.push({
					id: company.id,
					name: { value: company.name },
					shops: { value: shopNames || '-' },
					create_date: { value: moment(company.created_at).format('YYYY-MM-DD') },
					actions: { value: null, options: options }
				});
			}

			this.tableData = data;
		});
	}

	resetData() {
		this.filters = {
			name: null,
			id: null,
		};

		this.getCompaniesList({});
	}

	isFiltersFilled() {
		return Object.values(this.filters).some((v) => v);
	}

	confirmDeleteCompany(company: Company) {
		Swal.fire({
			title: this.translate.instant('companies.delete_company'),
			text: this.translate.instant('companies.delete_company_confirm_msg'),
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: this.translate.instant('g.confirm'),
			cancelButtonText: this.translate.instant('g.cancel')
		}).then(result => {
			if (result.isConfirmed)
				return this.deleteCompany(company);
		});
	}

	edit(company: Company) {
		this.router.navigate(['/companies/edit', company.id]);
	}

	deleteCompany(company: Company) {
		this.companiesService.delete(company.id).subscribe(() => {
			this.tableData = this.tableData.filter((u) => u['id'] !== company.id);
			this.notificationService.setMessage('globalSuccessMsg');
		});
	}

}
