// Angular Imports
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// project import
import { TodoListRemoveDirective } from './directive/todo-list-remove.directive';
import { TodoCardCompleteDirective } from './directive/todo-card-complete.directive';
import { ProductCompleteDirective } from './directive/product-complete.directive';
import { ProductRemoveDirective } from './directive/product-remove.service';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { AlertComponent } from './components/alert/alert.component';
import { CardComponent } from './components/card/card.component';
import { TrimTextDirective } from './directive/trim-text.directive';

// third party
import { NgScrollbarModule } from 'ngx-scrollbar';
import 'hammerjs';
import 'mousetrap';
import { GalleryModule } from '@ks89/angular-modal-gallery';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';

// feather icons
import { allIcons } from 'angular-feather/icons';
import { FeatherModule } from 'angular-feather';

// bootstrap import
import {
	NgbDropdownModule,
	NgbNavModule,
	NgbTooltipModule,
	NgbModule,
	NgbAccordionModule,
	NgbCollapseModule,
	NgbDatepickerModule
} from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { KeysPipe } from 'src/app/shared/pipes/keys.pipe';
import { EmailLinkComponent } from './components/email-link/email-link.component';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		FormsModule,
		GalleryModule,
		NgbDropdownModule,
		NgbNavModule,
		NgbTooltipModule,
		NgbModule,
		NgbAccordionModule,
		NgbCollapseModule,
		NgbDatepickerModule,
		NgScrollbarModule,
		AlertComponent,
		CardComponent,
		TranslateModule,
		FeatherModule.pick(allIcons),
		FontAwesomeModule
	],
	exports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		GalleryModule,
		TodoListRemoveDirective,
		TodoCardCompleteDirective,
		ProductCompleteDirective,
		ProductRemoveDirective,
		SpinnerComponent,
		NgbModule,
		NgbDropdownModule,
		NgbNavModule,
		NgbTooltipModule,
		NgbAccordionModule,
		NgbCollapseModule,
		NgbDatepickerModule,
		NgScrollbarModule,
		AlertComponent,
		CardComponent,
		TranslateModule,
		FeatherModule,
		LoaderComponent,
		KeysPipe,
		TrimTextDirective,
		EmailLinkComponent
	],
	declarations: [
		LoaderComponent,
		TodoListRemoveDirective,
		TodoCardCompleteDirective,
		ProductCompleteDirective,
		ProductRemoveDirective,
		SpinnerComponent,
		KeysPipe,
		TrimTextDirective,
		EmailLinkComponent
	]
})
export class SharedModule {
	constructor(library: FaIconLibrary) {
		// Add an icon to the library for convenient access in other components
		library.addIconPacks(fas, far, fab);
	}
}
