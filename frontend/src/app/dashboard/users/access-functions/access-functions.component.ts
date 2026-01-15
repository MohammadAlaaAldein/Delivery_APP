import { Component } from '@angular/core';
import { UsersService } from '../users.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SafePipe } from 'src/app/shared/pipes/safe.pipe';
import { AccessFunction, AccessFunctionData } from '../user.interface';

@Component({
  selector: 'app-access-functions',
  standalone: true,
  imports: [FormsModule, TranslateModule, CommonModule, SafePipe],
  templateUrl: './access-functions.component.html',
  styleUrl: './access-functions.component.scss'
})
export class AccessFunctionsComponent {
	userId = null;
	userAccessFunctions: AccessFunction = {};
	accessFunctions: AccessFunctionData = {};
	accessOptionsToAdd: {label: string, value: string}[] = [];
	newAccessFunction: AccessFunction = {};
	docAccessFunction;

	accessOptions = [
		{'id': 'read', 'text': this.translateService.instant('g.read')},
		{'id': 'write', 'text': this.translateService.instant('g.write')}
	];

	boolAccessOptions = [
		{'id': 'yes', 'text': this.translateService.instant('g.yes')},
		{'id': 'no', 'text': this.translateService.instant('g.no')}
	];

	constructor(
		private usersService: UsersService,
		private route: ActivatedRoute,
		private router: Router,
		private translateService: TranslateService,
	) {}

	ngOnInit() {
		this.userId = this.route.snapshot.paramMap.get('id') || '';

		if (!this.userId)
			return this.router.navigate(['/users']);

		this.getAccessFunctions();
	}

	getAccessFunctions() {
		this.usersService.getAccessFunctions(this.userId).subscribe((response: {data?: {access_functions: AccessFunction, access_functions_data: AccessFunctionData}}) => {
			if (response.data) {
				this.userAccessFunctions = response.data.access_functions;
				this.accessFunctions = response.data.access_functions_data;

				let accessOptionsToAdd = [];

				for(let func in this.accessFunctions) {
					if(!this.userAccessFunctions.hasOwnProperty(func))
						accessOptionsToAdd.push(func)

					if(!this.accessFunctions[func].hasReadOption && this.userAccessFunctions.hasOwnProperty(func)){
						if(this.userAccessFunctions[func] == 'write')
							this.userAccessFunctions[func] = 'yes';
						else
							this.userAccessFunctions[func] = 'no';
					}
				}

				this.accessOptionsToAdd = accessOptionsToAdd.map((item) => ({'label': this.translateService.instant("access_func."+item), 'value': item}));
			}
		});
	}

	editAccessFunction(mode, data) {
		if(mode == 'del') {
			let functionKey = data;
			delete this.userAccessFunctions[functionKey];

			// add removed access function to list of available access functions
			this.accessOptionsToAdd.push({'label': this.translateService.instant("access_func."+ functionKey), 'value': functionKey});
			return;
		}

		//mode == 'add'
		let functionKey = data.key;

		// remove added access function from list of available access functions
		let idx = this.accessOptionsToAdd.findIndex(option =>
			option.value === functionKey
		);

		if(idx != -1)
			this.accessOptionsToAdd.splice(idx, 1)

		this.userAccessFunctions[functionKey] = data.access;

		this.newAccessFunction = {};
	};

	updateUserAccessFunctions() {
		let tempAccess = {};

		for(let func in this.userAccessFunctions) {
			tempAccess[func] = this.userAccessFunctions[func];

			if(this.userAccessFunctions[func] == 'yes')
				tempAccess[func] = 'write';

			if(this.userAccessFunctions[func] == 'no')
				tempAccess[func] = '';
		}

		this.usersService.updateUserAccessFunctions(+this.userId, tempAccess).subscribe((data) => {
			this.goBack();
		});
	}

	goBack() {
		this.router.navigate(['/users']);
	}

	getKeys(obj) {
		return Object.keys(obj);
	}
}
