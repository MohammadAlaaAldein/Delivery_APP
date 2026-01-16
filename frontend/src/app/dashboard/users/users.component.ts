import { Component, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { USER_ROLE, UsersService } from './users.service';
import { CommonModule } from '@angular/common';
import { keyBy as _keyBy } from 'lodash';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { SCTTableModule } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/sct-table.module';
import { ColumnsConfig, TableConfig, TableData } from 'sct-custom-table/sct-table/projects/sct-table/src/lib/custom-table-interface';

import moment from 'moment';
import { CardComponent } from "../../theme/shared/components/card/card.component";
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationMessageService } from 'src/app/shared/notification-message/notification-message.service';
import { User } from './user.interface';

@Component({
	selector: 'app-users',
	standalone: true,
	imports: [CommonModule, SCTTableModule, TranslateModule, CardComponent, FormsModule,],
	templateUrl: './users.component.html'
})
export class UsersComponent {
	@ViewChild('updateUserPassword') updateUserPassword!: TemplateRef<any>;
	users: User[] = [];
	columnConfig: ColumnsConfig[] = [
		{ key: 'name', name: this.translate.instant('users.name'), type: 'string' },
		{ key: 'email', name: this.translate.instant('users.email'), type: 'string' },
		{ key: 'role', name: this.translate.instant('users.role'), type: 'string' },
		{ key: 'entity_id', name: this.translate.instant('users.entity_id'), type: 'string' },
		{ key: 'create_date', name: this.translate.instant('g.creation_date'), type: 'date' },
		{ key: 'actions', name: this.translate.instant('g.actions'), type: 'dropdown' }
	];

	filterColumns = [
		{ key: 'name', title: this.translate.instant('users.name'), type: "text" },
		{ key: 'email', title: this.translate.instant('users.email'), type: "email" },
		// {
		// 	key: 'role',
		// 	name: 'role',
		// 	title: this.translate.instant('users.role'),
		// 	type: "text",
		// 	filter_type: "dropdown",
		// 	filter_data: Object.values(USER_ROLE).map(role => ({ value: role, label: this.translate.instant(`g.${role.toLowerCase()}`) }))
		// },
		{ key: 'id', title: this.translate.instant('g.id'), type: "number" },
	];

	filters = {
		name: "",
		email: "",
		// role: null,
		id: 0,
	}

	tableData: TableData[] = [];
	tableConfig: TableConfig = {
		hasExport: false,
		hasPagination: true,
		pageSize: 100,
		pageSizeOptions: [20, 50, 100, 200],
		fitScreen: true,
		hideNoData: true,
		hasActionButtons: true,
		actionButtonsList: [
			{ text: this.translate.instant('users.add_user'), link: ['/', 'users', 'create'], enable: true },
		],
	};

	constructor(
		private usersService: UsersService,
		private translate: TranslateService,
		private router: Router,
		private notificationService: NotificationMessageService,
		private viewContainerRef: ViewContainerRef,
	) { }

	ngOnInit() {
		this.getUserList(this.filters);
	}

	search() {
		this.getUserList(this.filters);
	}

	getUserList(filters: { name?: string; email?: string; id?: number; }) {

		this.usersService.list(filters).subscribe((res: { data: User[] }) => {
			const users = res.data;
			const data = [];
			for (const user of users) {
				const options = [
					{ text: this.translate.instant('g.edit'), action: () => { this.edit(user) } },
					{ text: this.translate.instant('users.change_user_password'), action: () => { this.confirmUpdateUserPassword(user) } },
					{ text: this.translate.instant('g.delete'), action: () => { this.confirmDeleteUser(user) } },
				];

				data.push({
					id: user.id,
					name: { value: user.name },
					email: { value: user.email },
					role: { value: this.translate.instant(`g.${user.role}`) },
					entity_id: { value: user.entity_name },
					// entity_type: { value: user.entity_type },
					create_date: { value: moment(user.created_at).format('YYYY-MM-DD') },
					actions: { value: null, options: options }
				});
			}
			this.tableData = data;
		});
	}

	resetData() {
		this.filters = {
			name: null,
			email: null,
			// role: null,
			id: null,
		};

		this.getUserList({});
	}

	isFiltersFilled() {
		return Object.values(this.filters).some((v) => v);
	}

	confirmDeleteUser(user: User) {
		Swal.fire({
			title: this.translate.instant('users.delete_user'),
			text: this.translate.instant('users.delete_user_confirm_msg'),
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: this.translate.instant('g.confirm'),
			cancelButtonText: this.translate.instant('g.cancel')
		}).then(result => {
			if (result.isConfirmed)
				return this.deleteUser(user);
		});
	}

	edit(user: User) {
		this.router.navigate(['/users/edit', user.id]);
	}

	deleteUser(user: User) {
		this.usersService.delete(user.id).subscribe(() => {
			this.tableData = this.tableData.filter((u) => u['id'] !== user.id);
			this.notificationService.setMessage('globalSuccessMsg');
		});
	}

	confirmUpdateUserPassword(user: User) {
		const userId = user.id;
		const wrapper = document.createElement('div');
		const view = this.viewContainerRef.createEmbeddedView(this.updateUserPassword);
		view.detectChanges();
		view.rootNodes.forEach(node => wrapper.appendChild(node));

		Swal.fire({
			title: this.translate.instant('users.change_user_password'),
			html: wrapper,
			showCancelButton: true,
			cancelButtonText: this.translate.instant('g.cancel'),
			confirmButtonText: this.translate.instant('g.save'),

			didOpen: () => {
				const passwordInput = document.getElementById('password') as HTMLInputElement;
				const confirmInput = document.getElementById('confirm_password') as HTMLInputElement;
				const eye1 = document.getElementById('toggle-password-eye');
				const eye2 = document.getElementById('toggle-confirm-eye');

				if (eye1 && passwordInput) {
					eye1.addEventListener('click', () => {
						const type = passwordInput.type === 'password' ? 'text' : 'password';
						passwordInput.type = type;
						eye1.classList.toggle('icon-eye-off');
					});
				}

				if (eye2 && confirmInput) {
					eye2.addEventListener('click', () => {
						const type = confirmInput.type == 'password' ? 'text' : 'password';
						confirmInput.type = type;
						eye2.classList.toggle('icon-eye-off');
					});
				}

				passwordInput?.focus();
			},
			preConfirm: () => {
				const password = (document.getElementById('password') as HTMLInputElement)?.value;
				const confirmPassword = (document.getElementById('confirm_password') as HTMLInputElement)?.value;

				if (!password || !confirmPassword) {
					Swal.showValidationMessage(this.translate.instant('g.field_is_required'));
					return false;
				}

				if (password !== confirmPassword) {
					Swal.showValidationMessage(this.translate.instant('validation.passwords_not_match'));
					return false;
				}

				return { password, confirmPassword };
			},
		}).then((result => {
			if (result.isConfirmed) {
				const { password, confirmPassword } = result.value;
				this.usersService.updateUserPassword(userId, password, confirmPassword).subscribe(() => {
					Swal.fire('Success', this.translate.instant('users.password_changed_successfully'), 'success');
				});
			}
		}));
	}
}
