// angular import
import { Component, effect } from '@angular/core';

// project import
import { SharedModule } from '../../../shared.module';
import { ThemeService } from '../../../service/theme.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
	selector: 'app-bajaj-chart',
	standalone: true,
	imports: [SharedModule, NgApexchartsModule],
	templateUrl: './bajaj-chart.component.html',
	styleUrl: './bajaj-chart.component.scss'
})
export class BajajChartComponent {
	// public props
	chartOptions!: ApexOptions;

	// constructor
	constructor(private themeService: ThemeService) {
		this.chartOptions = {
			chart: {
				type: 'area',
				height: 95,
				stacked: true,
				sparkline: {
					enabled: true
				},
				background: 'transparent'
			},
			stroke: {
				curve: 'smooth',
				width: 1
			},
			series: [
				{
					data: [0, 15, 10, 50, 30, 40, 25]
				}
			],
			tooltip: {
				theme: 'light',
				fixed: {
					enabled: false
				},
				x: {
					show: false
				},
				y: {
					title: {
						formatter: () => 'Ticket '
					}
				},
				marker: {
					show: false
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
				this.chartOptions.colors = ['#673ab7'];
				break;
			case 'preset-2':
				this.chartOptions.colors = ['#009688'];
				break;
			case 'preset-3':
				this.chartOptions.colors = ['#ec407a'];
				break;
			case 'preset-4':
				this.chartOptions.colors = ['#c77e23'];
				break;
			case 'preset-5':
				this.chartOptions.colors = ['#3fb0ac'];
				break;
			case 'preset-6':
				this.chartOptions.colors = ['#2ca58d'];
				break;
			case 'preset-7':
				this.chartOptions.colors = ['#3F51B5'];
				break;
		}
	}

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
