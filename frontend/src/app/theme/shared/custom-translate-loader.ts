// project import
import en from '../../../../../shared/translation/en.json';
import ar from '../../../../../shared/translation/ar.json';

// third party
import { TranslateLoader } from '@ngx-translate/core';

// angular import
import { of } from 'rxjs';

export class CustomTranslateLoader implements TranslateLoader {
	readonly LANGUAGES = { en, ar };

	// public method
	getTranslation(lang: string) {
		return of(this.LANGUAGES[lang]);
	}
}
