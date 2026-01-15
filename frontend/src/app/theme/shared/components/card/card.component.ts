// Angular import
import { Component, ContentChild, ElementRef, Input, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxPrintModule } from 'ngx-print';
export type TPrintOptions = {
	printElementId: string;
	title: string;
};

@Component({
	selector: 'app-card',
	standalone: true,
	imports: [CommonModule, NgxPrintModule],
	templateUrl: './card.component.html',
	styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {
	// public props
	/**
	 * Title of card. It will be visible at left side of card header
	 */
	@Input() cardTitle!: string;

	@Input() titleClass: string = 'h5';

	/**
	 * Class to be applied at card level
	 */
	@Input() cardClass!: string;

	/**
	 * To hide content from card
	 */
	@Input() showContent = true;

	/**
	 * Class to be applied at card content.
	 */
	@Input() blockClass!: string;

	/**
	 * Class to be applied on card header
	 */
	@Input() headerClass!: string;

	/**
	 * To hide header from card
	 */
	@Input() showHeader = true;

	/**
	 * Class to be applied on footer section of custom card
	 */
	@Input() footerClass!: string;

	/**
	 * padding around card content. default in px
	 */
	@Input() padding!: number; // set default to 24 px

	/**
	 * Template reference of header actions on custom header
	 */
	@ContentChild('headerOptionsTemplate') headerOptionsTemplate!: TemplateRef<ElementRef>;

	/**
	 * Template reference of header actions besides title at left
	 */
	@ContentChild('headerTitleTemplate') headerTitleTemplate!: TemplateRef<ElementRef>;

	/**
	 * Template reference for footer at bottom
	 */
	@ContentChild('footerTemplate') footerTemplate!: TemplateRef<ElementRef>;

	@Input() printOptions: TPrintOptions = null;
	@Input() supportExpand = false;
	expandIcon = 'ti ti-arrows-maximize f-28';
	expandTitle = 'Maximize';

	toggleExpand() {
		//this function used, don't remove it.
		if (!this.supportExpand) return false;
		this.showContent = !this.showContent;
		this.setExpandIcon();
	}

	setExpandIcon() {
		this.expandIcon = this.showContent ? 'ti ti-arrows-minimize f-28' : 'ti ti-arrows-maximize f-28';
		this.expandTitle = this.showContent ? 'Minimize' : 'Maximize';
	}

	ngOnInit(): void {
		if (!this.supportExpand) {
			this.headerClass = this.headerClass ? this.headerClass + ' justify-content-between' : 'justify-content-between';
		}
	}
}
