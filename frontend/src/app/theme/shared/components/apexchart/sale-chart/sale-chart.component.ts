// angular import
import { Component, Input, OnInit, effect } from '@angular/core';

// project import
import { SharedModule } from '../../../shared.module';
import { ThemeService } from '../../../service/theme.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
	selector: 'app-sale-chart',
	standalone: true,
	imports: [SharedModule, NgApexchartsModule],
	templateUrl: './sale-chart.component.html',
	styleUrl: './sale-chart.component.scss'
})
export class SaleChartComponent implements OnInit {
	// public props
	chartOptions!: ApexOptions;
	@Input() data!: [];

	// Constructor
	constructor(private themeService: ThemeService) {
		effect(() => {
			this.isDarkTheme(this.themeService.isDarkTheme());
			this.rerenderChartOnContainerResize(this.themeService.isBoxLayout());
		});
	}

	// life cycle event
	ngOnInit() {
		this.chartOptions = {
			chart: {
				type: 'line',
				height: 117,
				sparkline: {
					enabled: true
				}
			},
			dataLabels: {
				enabled: false
			},
			stroke: {
				curve: 'smooth',
				width: 3
			},
			colors: ['#fff'],
			series: [
				{
					name: 'series1',
					data: this.data
				}
			],
			yaxis: {
				min: 20,
				max: 100
			},
			tooltip: {
				theme: 'light',
				fixed: {
					enabled: false
				},
				x: {
					show: false
				},
				marker: {
					show: false
				}
			}
		};
	}

	// private methods
	private isDarkTheme(isDark: boolean) {
		const tooltip = { ...this.chartOptions.tooltip };
		tooltip.theme = isDark === true ? 'dark' : 'light';
		this.chartOptions = { ...this.chartOptions, tooltip };
	}

	private rerenderChartOnContainerResize(isBox: boolean) {
		const chart = { ...this.chartOptions.chart };
		chart.redrawOnWindowResize = !isBox;
		this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
	}
}
