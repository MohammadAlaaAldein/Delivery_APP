import { Component } from '@angular/core';
import { LogsService } from '../logs.service';
import { SCTTableModule } from "../../../../../node_modules/sct-custom-table/sct-table/projects/sct-table/src/lib/sct-table.module";
import { ColumnsConfig, TableConfig, TableData } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/custom-table-interface';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import moment from 'moment';
import { CardComponent } from "../../../theme/shared/components/card/card.component";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiLog } from '../api-logs.interface';

@Component({
  selector: 'app-api-logs',
  standalone: true,
  imports: [CommonModule, SCTTableModule, CardComponent, TranslateModule, FormsModule],
  templateUrl: './api-logs.component.html',
  styleUrl: './api-logs.component.scss'
})
export class ApiLogsComponent {
	columnConfig: ColumnsConfig[] = [
		{key: 'user_id', name: this.translate.instant('api_logs.user_id'), type: 'number'},
		{key: 'end_point', name: this.translate.instant('api_logs.end_point'), type: 'string'},
		{key: 'request_params', name: this.translate.instant('api_logs.request_params'), type: 'string'},
		{key: 'created_at', name: this.translate.instant('api_logs.created_at'), type: 'date'}
	];
	tableData: TableData[] = [];
	tableConfig: TableConfig = {
		hasExport: false,
		hasPagination: true,
		pageSize: 100,
		pageSizeOptions: [20, 50, 100, 200],
		fitScreen: true,
		hideNoData: true,
		draggable: true
	};

	filterColumns = [
		{key: 'user_id', title: this.translate.instant('api_logs.user_id'), type: "number"},
		{key: 'end_point', title: this.translate.instant('api_logs.end_point'), type: "text"},
	];

	filters = {
		user_id: null,
		end_point: ""
	};

	constructor(
		private logService: LogsService,
		private translate: TranslateService
	) {}

	ngOnInit() {
		this.getApiLogs();
	}

	search() {
		this.getApiLogs();
	}

	resetData() {
		this.filters = {
			user_id: null,
			end_point: ""
		};
		this.getApiLogs();
	}

	getApiLogs() {

		let criteria = {};

		for(const filter in this.filters) {
			const value = this.filters[filter];
			if (value !== null && value !== undefined && value !== '' && value !== 0)
				criteria[filter] = value;
		}

		this.logService.listAPILogs(criteria).subscribe((req: {data: ApiLog[]}) => {
			const logs = req.data || [];
			const tableData = [];

			for (const log of logs) {
				tableData.push({
					user_id: {value: log.user_id},
					end_point: {value: log?.end_point?.split('?')[0].trim() || ""},
					request_params: {value: Object.keys(log.body_request || {}).length ? log.body_request: log.query_request, forceWrap: true},
					created_at: {value: moment(log.created_at).format('YYYY-MM-DD hh:mm:ss') , sortValue: moment(log.created_at).unix()}
				});
			}

			this.tableData = tableData;
		});
	}

	isFiltersFilled() {
		return Object.values(this.filters).some(value => value !== 0 && value !== "");
	}
}
