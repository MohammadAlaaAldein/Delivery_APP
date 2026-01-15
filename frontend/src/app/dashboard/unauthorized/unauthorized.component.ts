import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { UsersService } from '../users/users.service';
import { pagesAccessFunctions } from 'src/app/theme/shared/access-functions';
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
		private userService: UsersService,
		private authService: AuthService,
	) { }

	ngOnInit() {
		this.backUrl = ['/'];
	}

	logout() {
		this.authService.logoutUser();
	}
}
