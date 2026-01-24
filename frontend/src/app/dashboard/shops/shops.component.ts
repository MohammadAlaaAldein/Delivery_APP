import { Component, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { ShopsService } from './shops.service';
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
import { Shop } from './shop.interface';
import { Company } from '../companies/company.interface';

@Component({
	selector: 'app-shops',
	standalone: true,
	imports: [CommonModule, SCTTableModule, TranslateModule, CardComponent, FormsModule,],
	templateUrl: './shops.component.html'
})
export class ShopsComponent {

	shops: Shop[] = [];
	companies: Company[] = [];
	companiesMap: { [key: number]: Company } = {};

	columnConfig: ColumnsConfig[] = [
		{ key: 'name', name: this.translate.instant('shops.name'), type: 'string' },
		{ key: 'companies', name: this.translate.instant('shops.companies'), type: 'string' },
		{ key: 'create_date', name: this.translate.instant('g.creation_date'), type: 'date' },
		{ key: 'actions', name: this.translate.instant('g.actions'), type: 'dropdown' }
	];

	filterColumns = [
		{ key: 'name', title: this.translate.instant('shops.name'), type: "text" },
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
			{ text: this.translate.instant('shops.add_shop'), link: ['/', 'shops', 'create'], enable: true },
		],
	};

	constructor(
		private shopsService: ShopsService,
		private translate: TranslateService,
		private router: Router,
		private notificationService: NotificationMessageService,
		private viewContainerRef: ViewContainerRef,
	) { }

	ngOnInit() {
		this.loadCompanies();
	}

	loadCompanies() {
		this.shopsService.listCompanies({}).subscribe((res: { data: Company[] }) => {
			this.companies = res.data;
			this.companiesMap = _keyBy(this.companies, 'id');
			this.getShopsList(this.filters);
		});
	}

	search() {
		this.getShopsList(this.filters);
	}

	getShopsList(filters: { name?: string; email?: string; id?: number; }) {
		this.shopsService.list(filters).subscribe((res: { data: Shop[] }) => {
			const shops = res.data;
			const data = [];
			for (const shop of shops) {
				const options = [
					{ text: this.translate.instant('g.edit'), action: () => { this.edit(shop) } },
					{ text: this.translate.instant('g.delete'), action: () => { this.confirmDeleteShop(shop) } },
				];

				const companyNames = (shop.company_ids || [])
					.map(id => this.companiesMap[id]?.name)
					.filter(name => name)
					.join(', ');

				data.push({
					id: shop.id,
					name: { value: shop.name },
					companies: { value: companyNames || '-' },
					create_date: { value: moment(shop.created_at).format('YYYY-MM-DD') },
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

		this.getShopsList({});
	}

	isFiltersFilled() {
		return Object.values(this.filters).some((v) => v);
	}

	confirmDeleteShop(shop: Shop) {
		Swal.fire({
			title: this.translate.instant('shops.delete_shop'),
			text: this.translate.instant('shops.delete_shop_confirm_msg'),
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: this.translate.instant('g.confirm'),
			cancelButtonText: this.translate.instant('g.cancel')
		}).then(result => {
			if (result.isConfirmed)
				return this.deleteShop(shop);
		});
	}

	edit(shop: Shop) {
		this.router.navigate(['/shops/edit', shop.id]);
	}

	deleteShop(shop: Shop) {
		this.shopsService.delete(shop.id).subscribe(() => {
			this.tableData = this.tableData.filter((u) => u['id'] !== shop.id);
			this.notificationService.setMessage('globalSuccessMsg');
		});
	}

}
