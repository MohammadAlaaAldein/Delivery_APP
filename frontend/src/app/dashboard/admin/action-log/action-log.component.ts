import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ColumnsConfig, TableConfig, TableData } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/custom-table-interface';
import { SCTCustomTable } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/sct-table.component';
import { SCTTableModule } from "sct-custom-table/sct-table/projects/sct-table/src/lib/sct-table.module";
import { CardComponent } from "src/app/theme/shared/components/card/card.component";
import { AdminService } from '../admin.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import moment from 'moment';

@Component({
	selector: 'app-action-log',
	standalone: true,
	imports: [SCTTableModule, CardComponent, CommonModule, TranslateModule, NgSelectModule, FormsModule],
	templateUrl: './action-log.component.html',
	styleUrl: './action-log.component.scss'
})
export class ActionLogComponent {
	@ViewChild("sctCustomTable", { static: true }) sctCustomTable!: SCTCustomTable;

	// table
	tableData: TableData[] = [];
	columnConfig: ColumnsConfig[] = [
		{ key: 'action_name', name: this.translate.instant('action_logs.action_name'), type: 'string', hasFilter: false, hasSort: false },
		{ key: 'related_id', name: this.translate.instant('action_logs.related_id_name'), type: 'string', hasFilter: false, hasSort: false },
		{ key: 'additional_related_id', name: this.translate.instant('action_logs.additional_related_id_name'), type: 'string', hasFilter: false, hasSort: false },
		{ key: 'old_values', name: this.translate.instant('action_logs.old_values'), type: 'string', hasFilter: false, hasSort: false },
		{ key: 'new_values', name: this.translate.instant('action_logs.new_values'), type: 'string', hasFilter: false, hasSort: false },
		{ key: 'action_user_id', name: this.translate.instant('action_logs.action_user_id_name'), type: 'string', hasFilter: false, hasSort: false },
		{ key: 'action_time', name: this.translate.instant('action_logs.action_time') + " (UTC)", type: 'date', hasFilter: false, hasSort: false },
		{ key: 'ip_address', name: this.translate.instant('action_logs.ip_address'), type: 'string', hasFilter: false, hasSort: false },
		{ key: 'user_agent', name: this.translate.instant('action_logs.user_agent'), type: 'string', hasFilter: false, hasSort: false },
		{ key: 'git_info', name: this.translate.instant('action_logs.git_info'), type: 'string', hasFilter: false, hasSort: false },
	];
	tableConfig: TableConfig = {
		hasExport: true,
		hideNoData: false,
		draggable: true,
		fileName: this.translate.instant('nav.action_log'),
		hasPagination: true,
		pageSize: 20,
		isBackendPagination: true,
	};
	actionsLog = <any>[];

	// filter
	filterColumns = [];

	filters = {
		log_month: "",
		action_name: "",
		related_id: "",
		action_user_id: 0,
		generic_id_search: "",
	}

	actions: { value: string, label: string }[] = [];
	logMonths = [];

	actionLogList = [
		'update_device',
		'create_device',
		'add_model_notes',
		'update_model_note_visibility',
		'delete_device_note',
		'update_device_queued',
		'move_device',
		'restart_device',
		'reset_device_data',
		'delete_device',
		'push_device_fw',
		'receive_device_shipment',
		'check_shipment_quality',
		'ship_out_device',
		'create_order',
		'edit_order',
		'update_shipping_info',
		'user_login',
		'add_user',
		'edit_user',
		'delete_user',
		'update_fw_devices_category',
		'change_user_password',
		'order_add_attachment',
		'order_delete_attachment',
		'update_cm_fw_versions'
	];

	constructor(
		private translate: TranslateService,
		private adminService: AdminService,
	) { }

	ngOnInit() {
		this.actions = this.actionLogList
			.map(action => ({ value: action, label: this.translate.instant('action_logs.' + action) }))
			.sort((item1, item2) => item1.label.toLowerCase() > item2.label.toLowerCase() ? 1 : -1);

		let startMonth = 7;
		let startYear = 2025;
		let currDate = new Date();
		let currMonth = currDate.getMonth() + 1;
		let currYear = currDate.getFullYear();

		for (let i = currYear; i >= startYear; i--) {
			for (let j = 12; j > 0; j--) {
				if (i == currYear && j > currMonth)
					continue;

				this.logMonths.push(i.toString() + '_' + String(j).padStart(2, '0'));
				if (i == startYear && j == startMonth)
					break;
			};
		};

		this.logMonths = this.logMonths.map(month => ({ value: month, label: month }));
		this.filterColumns = [
			{ key: 'log_month', title: this.translate.instant('action_logs.log_month'), filter_type: "dropdown", options: this.logMonths },
			{ key: 'action_name', title: this.translate.instant('action_logs.action_name'), filter_type: "dropdown", options: this.actions },
			{ key: 'related_id', title: this.translate.instant('action_logs.related_id'), filter_type: "number" },
			{ key: 'action_user_id', title: this.translate.instant('action_logs.action_user_id'), filter_type: "number" },
			{ key: 'generic_id_search', title: this.translate.instant('action_logs.generic_id_search'), filter_type: "number" },
		];

		this.getActionLogs({ currentPage: 1 });
	}

	getActionLogs(paginationData) {
		if (!this.sctCustomTable)
			return;

		if (paginationData.currentPage == 1)
			this.sctCustomTable.backendPaginationInit();

		const limit = this.sctCustomTable.config.pageSize;

		const options = {
			current_page: paginationData.currentPage,
			limit,
			...this.filters
		}

		this.adminService.getActionLogs(options).subscribe((res: { data: { data: Object[], totalDataCount: number, overallItemsCount: number } }) => {
			const returnData = res.data || { data: [], totalDataCount: 0, overallItemsCount: 0 };
			this.actionsLog = [...returnData.data];
			const tableData: TableData[] = [];

			for (const log of this.actionsLog) {
				tableData.push({
					action_name: { value: this.translate.instant('action_logs.' + log.action_name) },
					related_id: { value: log.related_name || log.related_id },
					additional_related_id: { value: log.additional_related_id || '' },
					old_values: { value: JSON.stringify(log.old_values), forceWrap: true },
					new_values: { value: JSON.stringify(log.new_values), forceWrap: true },
					action_user_id: { value: log.action_user_name || log.action_user_id },
					action_time: { value: moment(log.action_time).utc().format('YYYY-MM-DD HH:mm:ss') },
					ip_address: { value: log.ip_address },
					user_agent: { value: log.user_agent, forceWrap: true },
					git_info: { value: log.git_info, forceWrap: true },
				});
			}

			this.tableData = tableData;
			this.sctCustomTable.updatePagination(returnData.totalDataCount, returnData.overallItemsCount);
		});
	}

	search() {
		this.getActionLogs({ currentPage: 1 });
	}

	resetData() {
		this.filters = {
			log_month: "",
			action_name: "",
			related_id: "",
			action_user_id: 0,
			generic_id_search: "",
		};
		this.getActionLogs({ currentPage: 1 });
	}

	isFiltersFilled() {
		return Object.values(this.filters).some(value => value !== 0 && value !== '');
	}
}
