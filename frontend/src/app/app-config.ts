import { LANGUAGES } from "./shared/services/language.service";

export class DeliveryAppConfig {
	static layout = 'vertical'; // vertical, horizontal, compact
	static isCollapse_menu = false; // true, false
	static isDarkMode = false; // true, false;
	static sidebar_caption_hide = false; // true, false
	static theme_color = 'preset-1'; // present-1, present-2, present-3, present-4, present-5, present-6, present-7
	static font_family = 'Roboto'; // Roboto, Poppins, Inter
	static isRtl_layout = true; // true, false
	static isBox_container = false; // true, false
	static isLanding = true; // true
	static i18n = LANGUAGES.AR; // en, fr, ro, cn
	static isMenuShown = false; // true, false
}
