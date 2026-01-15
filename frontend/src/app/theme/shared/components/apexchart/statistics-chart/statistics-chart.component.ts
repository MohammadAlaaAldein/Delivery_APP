// angular import
import { Component, Input, OnInit, effect } from '@angular/core';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { ThemeService } from 'src/app/theme/shared/service/theme.service';

// apexChart
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
	selector: 'app-statistics-chart',
	standalone: true,
	imports: [SharedModule, NgApexchartsModule],
	templateUrl: './statistics-chart.component.html',
	styleUrl: './statistics-chart.component.scss'
})
export class StatisticsChartComponent implements OnInit {
	// public props
	chartOptions!: ApexOptions;
	selectType: string = 'today';
	@Input() height!: number;

	// constructor
	constructor(private themeService: ThemeService) {
		effect(() => {
			this.isDarkTheme(this.themeService.isDarkTheme());
			this.updateThemeColor(this.themeService.theme());
			this.rerenderChartOnContainerResize(this.themeService.isBoxLayout());
		});
	}

	// life cycle hook
	ngOnInit() {
		this.chartOptions = {
			chart: {
				type: 'area',
				height: this.height,
				toolbar: {
					show: false
				}
			},
			colors: ['#FFC107', '#2196f3'],
			dataLabels: {
				enabled: false
			},
			legend: {
				show: true,
				position: 'top'
			},
			markers: {
				size: 1,
				colors: ['#fff', '#fff', '#fff'],
				strokeColors: ['#2196f3', '#673ab7'],
				strokeWidth: 1,
				shape: 'circle',
				hover: {
					size: 4
				}
			},
			stroke: {
				width: 2,
				curve: 'smooth'
			},
			fill: {
				type: 'gradient',
				gradient: {
					shadeIntensity: 1,
					type: 'vertical',
					inverseColors: false,
					opacityFrom: 0.5,
					opacityTo: 0
				}
			},
			grid: {
				strokeDashArray: 4,
				borderColor: '#f5f5f5'
			},
			series: [
				{
					name: 'Revenue',
					data: [200, 320, 320, 275, 275, 400, 400, 300, 440, 320, 320, 275, 275, 400, 300, 440]
				},
				{
					name: 'Sales',
					data: [200, 250, 240, 300, 340, 320, 320, 400, 350, 250, 240, 300, 340, 320, 400, 350]
				}
			],
			xaxis: {
				tooltip: {
					enabled: false
				},
				labels: {
					hideOverlappingLabels: true
				},
				axisBorder: {
					show: false
				},
				axisTicks: {
					show: false
				}
			}
		};
	}

	// private methods
	private isDarkTheme(isDark: boolean) {
		const tooltipTheme = isDark === true ? 'dark' : 'light';
		const tooltip = { theme: tooltipTheme };
		const grid = { ...this.chartOptions.grid };
		grid.borderColor = isDark === true ? '#fafafa0d' : '#eef2f6';
		this.chartOptions = { ...this.chartOptions, tooltip, grid };
	}

	private rerenderChartOnContainerResize(isBox: boolean) {
		const chart = { ...this.chartOptions.chart };
		chart.redrawOnWindowResize = !isBox;
		this.chartOptions = { ...this.chartOptions, chart } as ApexOptions;
	}

	private updateThemeColor(theme: string) {
		switch (theme) {
			case 'preset-1':
			default:
				this.chartOptions.colors = ['#2196f3', '#673ab7'];
				this.chartOptions.markers!.strokeColors = ['#2196f3', '#673ab7'];
				break;
			case 'preset-2':
				this.chartOptions.colors = ['#607d8b', '#009688'];
				this.chartOptions.markers!.strokeColors = ['#607d8b', '#009688'];
				break;
			case 'preset-3':
				this.chartOptions.colors = ['#203461', '#ec407a'];
				this.chartOptions.markers!.strokeColors = ['#203461', '#ec407a'];
				break;
			case 'preset-4':
				this.chartOptions.colors = ['#16595a', '#c77e23'];
				this.chartOptions.markers!.strokeColors = ['#16595a', '#c77e23'];
				break;
			case 'preset-5':
				this.chartOptions.colors = ['#173e43', '#3fb0ac'];
				this.chartOptions.markers!.strokeColors = ['#173e43', '#3fb0ac'];
				break;
			case 'preset-6':
				this.chartOptions.colors = ['#0a2342', '#2ca58d'];
				this.chartOptions.markers!.strokeColors = ['#0a2342', '#2ca58d'];
				break;
			case 'preset-7':
				this.chartOptions.colors = ['#3f51b5', '#3f51b5'];
				this.chartOptions.markers!.strokeColors = ['#3f51b5', '#3f51b5'];
				break;
		}
	}

	// public methods
	onOptionSelected() {
		switch (this.selectType) {
			case 'today':
				this.chartOptions.series = [
					{
						name: 'Revenue',
						data: [200, 320, 320, 275, 275, 400, 400, 300, 440, 320, 320, 275, 275, 400, 300, 440]
					},
					{
						name: 'Sales',
						data: [200, 250, 240, 300, 340, 320, 320, 400, 350, 250, 240, 300, 340, 320, 400, 350]
					}
				];
				break;
			case 'week':
				this.chartOptions.series = [
					{
						name: 'Revenue',
						data: [350, 400, 320, 340, 300, 240, 250, 350, 400, 320, 320, 340, 300, 240, 200, 440]
					},
					{
						name: 'Sales',
						data: [440, 300, 400, 275, 275, 320, 320, 440, 300, 400, 275, 275, 320, 320, 200, 300]
					}
				];
				break;
			case 'month':
				this.chartOptions.series = [
					{
						name: 'Revenue',
						data: [200, 320, 320, 275, 275, 400, 400, 300, 440, 320, 320, 275, 275, 400, 300, 440]
					},
					{
						name: 'Sales',
						data: [200, 250, 240, 300, 340, 320, 320, 400, 350, 250, 240, 300, 340, 320, 400, 350]
					}
				];
				break;
		}
	}
}
