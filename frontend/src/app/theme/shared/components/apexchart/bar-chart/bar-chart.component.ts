// angular import
import { Component, effect } from '@angular/core';

// project import
import { SharedModule } from '../../../shared.module';
import { ThemeService } from '../../../service/theme.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
	selector: 'app-bar-chart',
	standalone: true,
	imports: [NgApexchartsModule, SharedModule],
	templateUrl: './bar-chart.component.html',
	styleUrl: './bar-chart.component.scss'
})
export class BarChartComponent {
	// public props
	chartOptions!: ApexOptions;

	// Constructor
	constructor(private themeService: ThemeService) {
		this.chartOptions = {
			series: [
				{
					name: 'Investment',
					data: [35, 125, 35, 35, 35, 80, 35, 20, 35, 45, 15, 75]
				},
				{
					name: 'Loss',
					data: [35, 15, 15, 35, 65, 40, 80, 25, 15, 85, 25, 75]
				},
				{
					name: 'Profit',
					data: [35, 145, 35, 35, 20, 105, 100, 10, 65, 45, 30, 10]
				},
				{
					name: 'Maintenance',
					data: [0, 0, 75, 0, 0, 115, 0, 0, 0, 0, 150, 0]
				}
			],
			dataLabels: {
				enabled: false
			},
			chart: {
				type: 'bar',
				height: 480,
				stacked: true,
				toolbar: {
					show: true
				},
				background: 'transparent'
			},
			colors: ['#d3eafd', '#2196f3', '#673ab7', '#ede7f6'],
			responsive: [
				{
					breakpoint: 480,
					options: {
						legend: {
							position: 'bottom',
							offsetX: -10,
							offsetY: 0
						}
					}
				}
			],
			plotOptions: {
				bar: {
					horizontal: false,
					columnWidth: '50%'
				}
			},
			xaxis: {
				type: 'category',
				categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
			},
			tooltip: {
				theme: 'light'
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
				this.chartOptions.colors = ['#90caf9', '#1e88e5', '#673ab7', '#ede7f6'];
				break;
			case 'preset-2':
				this.chartOptions.colors = ['#b0bec5', '#587583', '#009688', '#e0f2f1'];
				break;
			case 'preset-3':
				this.chartOptions.colors = ['#b0b6c4', '#586580', '#ec407a', '#fde8ef'];
				break;
			case 'preset-4':
				this.chartOptions.colors = ['#8fbbbc', '#1b6f70', '#c77e23', '#f8f0e5'];
				break;
			case 'preset-5':
				this.chartOptions.colors = ['#8b9fa1', '#14383d', '#3fb0ac', '#e8f6f5'];
				break;
			case 'preset-6':
				this.chartOptions.colors = ['#8591a1', '#091f3c', '#2ca58d', '#e6f4f1'];
				break;
			case 'preset-7':
				this.chartOptions.colors = ['#9FA8DA', '#3949AB', '#3F51B5', '#E8EAF6'];
				break;
		}
	}

	private isDarkTheme(isDark: boolean) {
		const tooltip = { ...this.chartOptions.tooltip };
		let colors: string[] = this.chartOptions.colors || [];
		colors = isDark ? ['#90caf9', '#1e88e5', '#7c4dff', '#d1c4e9'] : ['#90caf9', '#1e88e5', '#673ab7', '#ede7f6'];
		tooltip.theme = isDark ? 'dark' : 'light';
		this.chartOptions = { ...this.chartOptions, tooltip, colors };
	}

	private rerenderChartOnContainerResize(isBoxLayout: boolean) {
		const chart = { ...this.chartOptions.chart };
		chart.redrawOnWindowResize = !isBoxLayout;
		this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
	}
}
