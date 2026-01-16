import * as en from '../../../shared/translation/en.json';

export const translate = (text: string): string => {
    const category = text.split('.')[0];
    const key = text.split('.');

    return en[category] && en[category][key[1]] ? en[category][key[1]] : text;
}