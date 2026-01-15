import { Component, Input, OnInit } from '@angular/core';
import { TTextBoxElement } from '../../form.types';
import { SharedModule } from '../../../../theme/shared/shared.module';

@Component({
	selector: 'app-text-box-element',
	standalone: true,
	imports: [SharedModule],
	templateUrl: './text-box-element.component.html',
	styleUrl: './text-box-element.component.scss'
})
export class TextBoxElementComponent implements OnInit {
	@Input() element: TTextBoxElement;
	@Input() data: any = {};

	ngOnInit(): void {
		if (!this.element) this.element = this.getDefaultElement();
	}

	getDefaultElement(): TTextBoxElement {
		return {
			id: '',
			isValid: true,
			label: '',
			validations: []
		};
	}
}
