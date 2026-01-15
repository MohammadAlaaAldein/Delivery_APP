// Angular import
import { Component, Output, EventEmitter } from '@angular/core';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';

@Component({
	selector: 'app-nav-left',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './nav-left.component.html',
	styleUrl: './nav-left.component.scss'
})
export class NavLeftComponent {
	// public props
	@Output() NavCollapsedMob = new EventEmitter();

	// public method
	navCollapsedMob() {
		this.NavCollapsedMob.emit();
	}
}
