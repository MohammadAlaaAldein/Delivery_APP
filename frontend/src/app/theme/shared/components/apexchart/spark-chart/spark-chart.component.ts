// angular import
import { Component, Input, OnInit, effect } from '@angular/core';

// project import
import { SharedModule } from '../../../shared.module';
import { ThemeService } from '../../../service/theme.service';

// third party
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
	selector: 'app-spark-chart',
	standalone: true,
	imports: [SharedModule, NgApexchartsModule],
	templateUrl: './spark-chart.component.html',
	styleUrl: './spark-chart.component.scss'
})
export class SparkChartComponent implements OnInit {
	// public props
	chartOptions!: ApexOptions;
	@Input() data!: [];
	@Input() yaxis!: number;
	@Input() color!: [];
	@Input() value!: string;
	@Input() title!: string;

	// constructor
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
				height: 30,
				sparkline: {
					enabled: true
				}
			},
			stroke: {
				curve: 'straight',
				width: 2
			},
			series: [
				{
					data: this.data
				}
			],
			yaxis: {
				min: this.yaxis,
				max: 5
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
			},
			colors: this.color
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
