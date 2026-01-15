// angular import
import { Component, Input, OnInit, effect } from '@angular/core';

// project import
import { SharedModule } from '../../../shared.module';
import { ThemeService } from '../../../service/theme.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
	selector: 'app-total-value-chart',
	standalone: true,
	imports: [SharedModule, NgApexchartsModule],
	templateUrl: './total-value-chart.component.html',
	styleUrl: './total-value-chart.component.scss'
})
export class TotalValueChartComponent implements OnInit {
	// public props
	chartOptions!: ApexOptions;
	ChartOptionsColor = ['#fff'];
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
				type: 'area',
				height: 100,
				sparkline: {
					enabled: true
				}
			},
			dataLabels: {
				enabled: false
			},
			fill: {
				type: 'solid',
				opacity: 0.4
			},
			stroke: {
				curve: 'smooth',
				width: 3
			},
			series: [
				{
					name: 'series1',
					data: this.data
				}
			],
			yaxis: {
				min: 0,
				max: 30
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
		this.ChartOptionsColor = ['#fff'];
	}

	private rerenderChartOnContainerResize(isBox: boolean) {
		const chart = { ...this.chartOptions.chart };
		chart.redrawOnWindowResize = !isBox;
		this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
	}
}
