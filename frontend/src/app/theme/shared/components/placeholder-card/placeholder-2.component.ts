import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-placeholder-card-2',
	standalone: true,
	imports: [CommonModule],
	template: `
		<div>
			@if (showH1 === true) {
				<h1 class="placeholder-glow">
					<span class="placeholder w-100 col-12"></span>
				</h1>
			}
			<p class="placeholder-glow">
				@for (item of lines; track item) {
					<span class="placeholder w-100 col-12 mb-2" style="height: {{ height }}px;"></span>
				}
			</p>
		</div>
	`
})
export class PlaceholderCard2Component {
	@Input() height!: number;
	@Input() showH1: boolean = false;
	@Input() ShowLine: number = 0;

	get lines(): number[] {
		return Array.from({ length: this.ShowLine }, (_, index) => index);
	}
}
