// angular import
import { Component, effect } from '@angular/core';

// project import
import { SharedModule } from '../../../shared.module';
import { ThemeService } from '../../../service/theme.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
	selector: 'app-market-share-chart',
	standalone: true,
	imports: [SharedModule, NgApexchartsModule],
	templateUrl: './market-share-chart.component.html',
	styleUrl: './market-share-chart.component.scss'
})
export class MarketShareChartComponent {
	// public props
	chartOptions!: ApexOptions;
	ChartOptionsColor = ['#673ab7', '#2196f3', '#f44336'];

	// Constructor
	constructor(private themeService: ThemeService) {
		this.chartOptions = {
			chart: {
				type: 'area',
				height: 215,
				sparkline: {
					enabled: true
				},
				background: 'transparent'
			},
			stroke: {
				curve: 'smooth',
				width: 2
			},
			fill: {
				type: 'gradient',
				gradient: {
					shadeIntensity: 1,
					opacityFrom: 0.5,
					opacityTo: 0
				}
			},
			series: [
				{
					name: 'Youtube',
					data: [10, 90, 65, 85, 40, 80, 30]
				},
				{
					name: 'Facebook',
					data: [50, 30, 25, 15, 60, 10, 25]
				},
				{
					name: 'Twitter',
					data: [5, 50, 40, 55, 20, 40, 20]
				}
			],
			tooltip: {
				theme: 'light',
				fixed: {
					enabled: false
				},
				x: {
					show: true
				},
				marker: {
					show: true
				}
			}
		};

		effect(() => {
			this.updateThemeColor(this.themeService.theme());
			this.rerenderChartOnContainerResize(this.themeService.isBoxLayout());
			this.isDarkTheme(this.themeService.isDarkTheme());
		});
	}

	// private methods
	private updateThemeColor(theme: string) {
		switch (theme) {
			case 'preset-1':
			default:
				this.ChartOptionsColor = ['#673ab7', '#f44336', '#1e88e5'];
				break;
			case 'preset-2':
				this.ChartOptionsColor = ['#009688', '#d9534f', '#546e7a'];
				break;
			case 'preset-3':
				this.ChartOptionsColor = ['#ec407a', '#d9534f', '#1c2f59'];
				break;
			case 'preset-4':
				this.ChartOptionsColor = ['#c77e23', '#f44336', '#135152'];
				break;
			case 'preset-5':
				this.ChartOptionsColor = ['#3fb0ac', '#f44336', '#14383d'];
				break;
			case 'preset-6':
				this.ChartOptionsColor = ['#2ca58d', '#f44336', '#091f3c'];
				break;
			case 'preset-7':
				this.ChartOptionsColor = ['#3f51b5', '#f44336', '#3949ab'];
				break;
		}
	}

	private isDarkTheme(isDark: boolean) {
		const tooltip = { ...this.chartOptions.tooltip };
		tooltip.theme = isDark ? 'dark' : 'light';
		this.chartOptions = { ...this.chartOptions, tooltip };
	}

	private rerenderChartOnContainerResize(isBox: boolean) {
		const chart = { ...this.chartOptions.chart };
		chart.redrawOnWindowResize = !isBox;
		this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
	}
}
