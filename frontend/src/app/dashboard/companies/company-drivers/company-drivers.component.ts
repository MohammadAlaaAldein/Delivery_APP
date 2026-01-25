import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CompaniesService } from '../companies.service';
import { Driver } from '../../drivers/driver.interface';
import { SCTTableModule } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/sct-table.module';
import { ColumnsConfig, TableConfig, TableData } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/custom-table-interface';

@Component({
    selector: 'app-company-drivers',
    standalone: true,
    imports: [CommonModule, TranslateModule, SCTTableModule],
    templateUrl: './company-drivers.component.html',
})
export class CompanyDriversComponent implements OnInit {

    drivers: Driver[] = [];
    isLoading = true;

    columnConfig: ColumnsConfig[] = [];
    tableData: TableData[] = [];
    tableConfig: TableConfig = {
        hasExport: false,
        hasPagination: true,
        pageSize: 100,
        pageSizeOptions: [20, 50, 100, 200],
        fitScreen: true,
        hideNoData: true,
        hasActionButtons: false,
    };

    constructor(
        private companiesService: CompaniesService,
        private translate: TranslateService,
    ) {
        this.initColumnConfig();
    }

    ngOnInit() {
        this.loadMyDrivers();
    }

    initColumnConfig() {
        this.columnConfig = [
            { key: 'name', name: this.translate.instant('drivers.name'), type: 'string' },
            { key: 'phone', name: this.translate.instant('drivers.phone'), type: 'string' },
            { key: 'city', name: this.translate.instant('drivers.city'), type: 'string' },
            { key: 'vehicle_type', name: this.translate.instant('drivers.vehicle_type'), type: 'string' },
            { key: 'plate_number', name: this.translate.instant('drivers.plate_number'), type: 'string' },
            { key: 'status', name: this.translate.instant('g.status'), type: 'string' },
        ];
    }

    loadMyDrivers() {
        this.isLoading = true;
        this.companiesService.getMyCompanyDrivers().subscribe({
            next: (res: { data: Driver[] }) => {
                this.drivers = res.data;
                this.buildTableData();
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Error loading drivers:', err);
            }
        });
    }

    buildTableData() {
        const data = [];
        for (const driver of this.drivers) {
            data.push({
                id: driver.user_id,
                name: { value: driver.name },
                phone: { value: driver.phone || '-' },
                city: { value: driver.city || '-' },
                vehicle_type: {
                    value: driver.vehicle_type
                        ? this.translate.instant(`drivers.vehicle_types.${driver.vehicle_type}`)
                        : '-'
                },
                plate_number: { value: driver.plate_number || '-' },
                status: {
                    value: this.translate.instant(driver.is_active ? 'g.active' : 'g.inactive'),
                    class: driver.is_active ? 'badge bg-success' : 'badge bg-danger'
                }
            });
        }
        this.tableData = data;
    }
}
