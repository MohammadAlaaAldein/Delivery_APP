// project import
import en from '../../../../../shared/translation/en.json';

// third party
import { TranslateLoader } from '@ngx-translate/core';

// angular import
import { of } from 'rxjs';

export class CustomTranslateLoader implements TranslateLoader {
	// public method
	getTranslation(lang: string) {
		return of(en);
	}
}
