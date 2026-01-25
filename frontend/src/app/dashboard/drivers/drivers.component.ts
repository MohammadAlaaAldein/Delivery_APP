import { Component, OnInit } from '@angular/core';
import { DriversService, VehicleType } from './drivers.service';
import { CommonModule } from '@angular/common';
import { keyBy as _keyBy } from 'lodash';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { SCTTableModule } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/sct-table.module';
import { ColumnsConfig, TableConfig, TableData } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/custom-table-interface';

import moment from 'moment';
import { CardComponent } from "../../theme/shared/components/card/card.component";
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { Driver } from './driver.interface';
import { Company } from '../companies/company.interface';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
    selector: 'app-drivers',
    standalone: true,
    imports: [CommonModule, SCTTableModule, TranslateModule, CardComponent, FormsModule, NgSelectModule],
    templateUrl: './drivers.component.html'
})
export class DriversComponent implements OnInit {

    drivers: Driver[] = [];
    companies: Company[] = [];
    companiesMap: { [key: number]: Company } = {};

    columnConfig: ColumnsConfig[] = [
        { key: 'name', name: this.translate.instant('drivers.name'), type: 'string' },
        { key: 'company', name: this.translate.instant('drivers.company'), type: 'string' },
        { key: 'phone', name: this.translate.instant('drivers.phone'), type: 'string' },
        { key: 'city', name: this.translate.instant('drivers.city'), type: 'string' },
        { key: 'vehicle_type', name: this.translate.instant('drivers.vehicle_type'), type: 'string' },
        { key: 'plate_number', name: this.translate.instant('drivers.plate_number'), type: 'string' },
        { key: 'is_active', name: this.translate.instant('g.status'), type: 'string' },
        { key: 'create_date', name: this.translate.instant('g.creation_date'), type: 'date' },
        { key: 'actions', name: this.translate.instant('g.actions'), type: 'dropdown' }
    ];

    filterColumns = [
        { key: 'name', title: this.translate.instant('drivers.name'), type: "text" },
        { key: 'phone', title: this.translate.instant('drivers.phone'), type: "text" },
        { key: 'company_id', title: this.translate.instant('drivers.company'), type: "dropdown", filter_type: 'dropdown', filter_data: [] },
        {
            key: 'is_active', title: this.translate.instant('g.status'), type: "dropdown", filter_type: 'dropdown', filter_data: [
                { label: this.translate.instant('g.all'), value: null },
                { label: this.translate.instant('g.active'), value: true },
                { label: this.translate.instant('g.inactive'), value: false },
            ]
        },
    ];

    filters: any = {
        name: "",
        phone: "",
        company_id: null,
        is_active: null,
    }

    tableData: TableData[] = [];
    tableConfig: TableConfig = {
        hasExport: false,
        hasPagination: true,
        pageSize: 100,
        pageSizeOptions: [20, 50, 100, 200],
        fitScreen: true,
        hideNoData: true,
        hasActionButtons: false,
        actionButtonsList: [],
    };

    vehicleTypeLabels = {
        [VehicleType.CAR]: this.translate.instant('drivers.vehicle_types.car'),
        [VehicleType.MOTORCYCLE]: this.translate.instant('drivers.vehicle_types.motorcycle'),
        [VehicleType.TRUCK]: this.translate.instant('drivers.vehicle_types.truck'),
        [VehicleType.VAN]: this.translate.instant('drivers.vehicle_types.van'),
        [VehicleType.BICYCLE]: this.translate.instant('drivers.vehicle_types.bicycle'),
    };

    constructor(
        private driversService: DriversService,
        private translate: TranslateService,
        private router: Router,
        private route: ActivatedRoute,
        private notificationService: NotificationMessageService,
    ) { }

    ngOnInit() {
        this.loadCompanies();

        // Check for company_id from route params
        const companyIdParam = this.route.snapshot.queryParamMap.get('company_id');
        if (companyIdParam) {
            this.filters.company_id = parseInt(companyIdParam, 10);
        }
    }

    loadCompanies() {
        this.driversService.listCompanies({}).subscribe((res: { data: Company[] }) => {
            this.companies = res.data;
            this.companiesMap = _keyBy(this.companies, 'id');

            // Update filter dropdown options
            const companyFilterCol = this.filterColumns.find(c => c.key === 'company_id');
            if (companyFilterCol) {
                companyFilterCol.filter_data = [
                    { label: this.translate.instant('g.all'), value: null },
                    ...this.companies.map(c => ({ label: c.name, value: c.id }))
                ];
            }

            this.getDriversList(this.filters);
        });
    }

    search() {
        this.getDriversList(this.filters);
    }

    getDriversList(filters: any) {
        const cleanFilters = {};
        for (const key in filters) {
            if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                cleanFilters[key] = filters[key];
            }
        }

        this.driversService.list(cleanFilters).subscribe((res: { data: Driver[] }) => {
            const drivers = res.data;
            const data = [];
            for (const driver of drivers) {
                const options = [
                    { text: this.translate.instant('g.edit'), action: () => { this.edit(driver) } },
                    {
                        text: driver.is_active ? this.translate.instant('g.deactivate') : this.translate.instant('g.activate'),
                        action: () => { this.toggleActive(driver) }
                    },
                    { text: this.translate.instant('g.delete'), action: () => { this.confirmDeleteDriver(driver) } },
                ];

                data.push({
                    id: driver.user_id,
                    name: { value: driver.name },
                    company: { value: this.companiesMap[driver.company_id]?.name || '-' },
                    phone: { value: driver.phone || '-' },
                    city: { value: driver.city || '-' },
                    vehicle_type: { value: driver.vehicle_type ? this.vehicleTypeLabels[driver.vehicle_type] : '-' },
                    plate_number: { value: driver.plate_number || '-' },
                    is_active: {
                        value: driver.is_active ? this.translate.instant('g.active') : this.translate.instant('g.inactive'),
                        class: driver.is_active ? 'badge bg-success' : 'badge bg-danger'
                    },
                    create_date: { value: moment(driver.created_at).format('YYYY-MM-DD') },
                    actions: { value: null, options: options }
                });
            }

            this.tableData = data;
        });
    }

    resetData() {
        this.filters = {
            name: "",
            phone: "",
            company_id: null,
            is_active: null,
        };

        this.getDriversList({});
    }

    isFiltersFilled() {
        return Object.values(this.filters).some((v) => v !== null && v !== undefined && v !== '');
    }

    confirmDeleteDriver(driver: Driver) {
        Swal.fire({
            title: this.translate.instant('drivers.delete_driver'),
            text: this.translate.instant('drivers.delete_driver_confirm_msg'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: this.translate.instant('g.confirm'),
            cancelButtonText: this.translate.instant('g.cancel')
        }).then(result => {
            if (result.isConfirmed)
                return this.deleteDriver(driver);
        });
    }

    edit(driver: Driver) {
        this.router.navigate(['/drivers/edit', driver.user_id]);
    }

    toggleActive(driver: Driver) {
        this.driversService.toggleActive(driver.user_id).subscribe(() => {
            this.notificationService.setMessage('globalSuccessMsg');
            this.getDriversList(this.filters);
        });
    }

    deleteDriver(driver: Driver) {
        this.driversService.delete(driver.user_id).subscribe(() => {
            this.tableData = this.tableData.filter((u) => u['id'] !== driver.user_id);
            this.notificationService.setMessage('globalSuccessMsg');
        });
    }
}
