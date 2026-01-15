import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-placeholder-card-3',
	standalone: true,
	imports: [CommonModule],
	template: `
		<div class="card" aria-hidden="true">
			<svg class="bd-placeholder-img card-img-top" style="height: {{ imgHeight }}px;">
				<rect width="100%" height="100%" fill="#868e96"></rect>
			</svg>
			<div class="card-body">
				@if (showTitle) {
					<h5 class="card-title placeholder-glow">
						<span class="placeholder col-6"></span>
					</h5>
				}
				<p class="card-text placeholder-glow">
					@for (item of lines; track item) {
						<span class="placeholder col-12 mb-2" style="height: {{ height }}px;"></span>
					}
				</p>
			</div>
		</div>
	`
})
export class PlaceholderCard3Component {
	@Input() height!: number;
	@Input() imgHeight!: number;
	@Input() showH1: boolean = false;
	@Input() showTitle: boolean = false;
	@Input() ShowLine: number = 0;

	get lines(): number[] {
		return Array.from({ length: this.ShowLine }, (_, index) => index);
	}
}
