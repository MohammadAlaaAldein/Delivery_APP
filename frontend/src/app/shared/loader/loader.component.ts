import { Component, OnInit } from '@angular/core';
import { LoaderService } from './loader.service';

@Component({
	selector: 'app-loader',
	templateUrl: './loader.component.html',
	styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit {
	show: boolean;

	constructor(private loaderService: LoaderService) {}

	ngOnInit() {
		this.loaderService.isLoading.subscribe((value) => {
			this.show = value;
		});
	}
}
