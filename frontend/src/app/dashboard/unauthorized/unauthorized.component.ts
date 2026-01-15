import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { AuthService } from '../users/login/auth.service';

@Component({
	selector: 'app-unauthorized',
	standalone: true,
	imports: [RouterModule, SharedModule],
	templateUrl: './unauthorized.component.html',
	styleUrl: './unauthorized.component.scss'
})
export class UnauthorizedComponent {
	backUrl = [];

	constructor(
		private authService: AuthService,
	) { }

	ngOnInit() {
		this.backUrl = ['/'];
	}

	logout() {
		this.authService.logoutUser();
	}
}
