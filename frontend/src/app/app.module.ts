// Angular Imports
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// project import
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './theme/shared/shared.module';
import { HttpClientModule, HTTP_INTERCEPTORS, HttpClientJsonpModule } from '@angular/common/http';
import { BreadcrumbComponent } from './theme/shared/components/breadcrumb/breadcrumb.component';

// third party
import { ToastrModule } from 'ngx-toastr';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';

// bootstrap import
import { NgbDropdownModule, NgbNavModule, NgbTooltipModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { QuillModule } from 'ngx-quill';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { ValidateFormDirective } from './shared/directives/validate-form';
import { FormsModule } from '@angular/forms';
import { CaptchaModule } from './captcha/captcha.module';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { LoaderService } from './shared/loader/loader.service';
import { LoaderInterceptorService } from './shared/loader/loader-interceptor.service';
import { NotifierModule } from 'angular-notifier';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { CustomTranslateLoader } from './theme/shared/custom-translate-loader';

@NgModule({
	declarations: [AppComponent],
	imports: [
		BrowserModule,
		AppRoutingModule,
		SharedModule,
		NgbDropdownModule,
		NgbNavModule,
		NgbTooltipModule,
		NgbModule,
		BreadcrumbComponent,
		CaptchaModule,
		ToastrModule.forRoot(),
		BrowserAnimationsModule,
		HttpClientModule,
		ValidateFormDirective,
		// HttpClientXsrfModule.withOptions({//todo check this
		//   cookieName: 'XSRF-TOKEN',
		//   headerName: 'X-XSRF-Token',
		// }),

		NgxMapboxGLModule.withConfig({
			accessToken: 'pk.eyJ1IjoidHNocmVhaCIsImEiOiJja2phZ2dlbTkwc2gzMnluMGRiNXc3NXpzIn0.oRz9X880rKvLMlfzU5jUGg',
			//@ts-ignore
			geocoderAccessToken: 'pk.eyJ1IjoidHNocmVhaCIsImEiOiJja2phZ2dlbTkwc2gzMnluMGRiNXc3NXpzIn0.oRz9X880rKvLMlfzU5jUGg'
		}),
		QuillModule.forRoot(),
		SweetAlert2Module.forRoot(),
		NgSelectModule,
		CommonModule,
		RouterModule,
		FormsModule,
		HttpClientJsonpModule,
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useClass: CustomTranslateLoader
			}
		}),
		NotifierModule,
		FontAwesomeModule
	],
	providers: [
		LoaderService,
		TranslateService,
		{
			provide: HTTP_INTERCEPTORS,
			useClass: LoaderInterceptorService,
			multi: true
		}
	],
	bootstrap: [AppComponent]
})
export class AppModule {
	constructor(library: FaIconLibrary) {
		// Add an icon to the library for convenient access in other components
		library.addIconPacks(fas, far, fab);
	}
}
