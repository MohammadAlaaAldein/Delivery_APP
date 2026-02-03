import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { DOCUMENT } from '@angular/common';

// Import translations
import * as enTranslations from '../../../../../shared/translation/en.json';
import * as arTranslations from '../../../../../shared/translation/ar.json';

export type Language = 'en' | 'ar';

export interface TranslationData {
    [key: string]: string | TranslationData;
}

@Injectable({
    providedIn: 'root'
})
export class I18nService {
    private readonly STORAGE_KEY = 'app_language';
    private readonly DEFAULT_LANGUAGE: Language = 'en';

    private currentLanguageSubject = new BehaviorSubject<Language>(this.DEFAULT_LANGUAGE);
    public currentLanguage$ = this.currentLanguageSubject.asObservable();

    private translations: Record<Language, TranslationData> = {
        en: enTranslations,
        ar: arTranslations
    };

    constructor(
        @Inject(DOCUMENT) private document: Document,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        this.initializeLanguage();
    }

    /**
     * Initialize language from storage or browser preference
     */
    private initializeLanguage(): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        const savedLanguage = localStorage.getItem(this.STORAGE_KEY) as Language;

        if (savedLanguage && this.isValidLanguage(savedLanguage)) {
            this.setLanguage(savedLanguage);
        } else {
            // Detect browser language
            const browserLang = navigator.language.split('-')[0] as Language;
            const language = this.isValidLanguage(browserLang) ? browserLang : this.DEFAULT_LANGUAGE;
            this.setLanguage(language);
        }
    }

    /**
     * Check if language is valid
     */
    private isValidLanguage(lang: string): lang is Language {
        return ['en', 'ar'].includes(lang);
    }

    /**
     * Get current language
     */
    get currentLanguage(): Language {
        return this.currentLanguageSubject.value;
    }

    /**
     * Check if current language is RTL
     */
    get isRTL(): boolean {
        return this.currentLanguage === 'ar';
    }

    /**
     * Set the application language
     */
    setLanguage(language: Language): void {
        if (!this.isValidLanguage(language)) {
            console.warn(`Invalid language: ${language}`);
            return;
        }

        this.currentLanguageSubject.next(language);

        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.STORAGE_KEY, language);
            this.applyLanguageToDocument(language);
        }
    }

    /**
     * Toggle between languages
     */
    toggleLanguage(): void {
        const newLanguage = this.currentLanguage === 'en' ? 'ar' : 'en';
        this.setLanguage(newLanguage);
    }

    /**
     * Apply language settings to document
     */
    private applyLanguageToDocument(language: Language): void {
        const isRTL = language === 'ar';
        const html = this.document.documentElement;

        // Set language attribute
        html.setAttribute('lang', language);

        // Set direction
        html.setAttribute('dir', isRTL ? 'rtl' : 'ltr');

        // Add/remove RTL class
        if (isRTL) {
            html.classList.add('rtl');
            html.classList.remove('ltr');
        } else {
            html.classList.add('ltr');
            html.classList.remove('rtl');
        }

        // Update body class for styling
        this.document.body.classList.toggle('rtl', isRTL);
        this.document.body.classList.toggle('ltr', !isRTL);
    }

    /**
     * Translate a key with optional interpolation
     */
    translate(key: string, params?: Record<string, string | number>): string {
        const translation = this.getNestedTranslation(key);

        if (!translation) {
            console.warn(`Translation not found for key: ${key}`);
            return key;
        }

        if (params) {
            return this.interpolate(translation, params);
        }

        return translation;
    }

    /**
     * Shorthand for translate
     */
    t(key: string, params?: Record<string, string | number>): string {
        return this.translate(key, params);
    }

    /**
     * Get nested translation value using dot notation
     */
    private getNestedTranslation(key: string): string | undefined {
        const keys = key.split('.');
        let value: any = this.translations[this.currentLanguage];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }

        return typeof value === 'string' ? value : undefined;
    }

    /**
     * Interpolate translation with parameters
     */
    private interpolate(text: string, params: Record<string, string | number>): string {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key]?.toString() ?? match;
        });
    }

    /**
     * Get all translations for current language
     */
    getTranslations(): TranslationData {
        return this.translations[this.currentLanguage];
    }

    /**
     * Get available languages
     */
    getAvailableLanguages(): Language[] {
        return ['en', 'ar'];
    }

    /**
     * Get language display name
     */
    getLanguageDisplayName(language: Language): string {
        const names: Record<Language, string> = {
            en: 'English',
            ar: 'العربية'
        };
        return names[language] || language;
    }
}
