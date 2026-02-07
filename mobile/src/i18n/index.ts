import { I18n } from 'i18n-js';
import * as SecureStore from '../services/secure-store';
import { I18nManager } from 'react-native';
import { STORAGE_KEYS } from '../constants';
import en from './locales/en';
import ar from './locales/ar';

// Create i18n instance
const i18n = new I18n({
    en,
    ar,
});

// Set default locale
i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.enableFallback = true;

// RTL state
let isRTL = false;

// Initialize i18n
export const initI18n = async (): Promise<void> => {
    try {
        const savedLanguage = await SecureStore.getItemAsync(STORAGE_KEYS.language);
        if (savedLanguage) {
            await setLanguage(savedLanguage);
        }
    } catch (error) {
        console.error('Error initializing i18n:', error);
    }
};

// Get current language
export const getCurrentLanguage = (): string => {
    return i18n.locale;
};

// Check if current language is RTL
export const getIsRTL = (): boolean => {
    return isRTL;
};

// Set language
export const setLanguage = async (language: string): Promise<void> => {
    try {
        i18n.locale = language;
        isRTL = language === 'ar';

        // Update RTL layout
        if (I18nManager.isRTL !== isRTL) {
            I18nManager.allowRTL(isRTL);
            I18nManager.forceRTL(isRTL);
        }

        // Save preference
        await SecureStore.setItemAsync(STORAGE_KEYS.language, language);
    } catch (error) {
        console.error('Error setting language:', error);
    }
};

// Toggle language
export const toggleLanguage = async (): Promise<string> => {
    const newLanguage = i18n.locale === 'en' ? 'ar' : 'en';
    await setLanguage(newLanguage);
    return newLanguage;
};

// Translate function
export const t = (key: string, options?: Record<string, any>): string => {
    const result = i18n.t(key, options);
    if (typeof result === 'string')
        return result;

    if (Array.isArray(result))
        return (result as string[]).join(', ');

    return String(result ?? key);
};

// Export i18n instance
export { i18n };

// Export default
export default {
    i18n,
    initI18n,
    getCurrentLanguage,
    getIsRTL,
    setLanguage,
    toggleLanguage,
    t,
};
