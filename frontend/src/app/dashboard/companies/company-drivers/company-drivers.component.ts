import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CompaniesService } from '../companies.service';
import { Driver } from '../../drivers/driver.interface';

@Component({
    selector: 'app-company-drivers',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './company-drivers.component.html',
})
export class CompanyDriversComponent implements OnInit {

    drivers: Driver[] = [];
    isLoading = true;

    constructor(
        private companiesService: CompaniesService,
    ) { }

    ngOnInit() {
        this.loadMyDrivers();
    }

    loadMyDrivers() {
        this.isLoading = true;
        this.companiesService.getMyCompanyDrivers().subscribe({
            next: (res: { data: Driver[] }) => {
                this.drivers = res.data;
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Error loading drivers:', err);
            }
        });
    }
}
