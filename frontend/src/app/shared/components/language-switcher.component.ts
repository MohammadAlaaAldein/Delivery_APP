import { Component, OnInit, inject } from '@angular/core';
import { I18nService, Language } from '../services/i18n.service';

@Component({
    selector: 'app-language-switcher',
    template: `
    <div class="language-switcher">
      <button 
        class="lang-btn"
        [class.active]="currentLanguage === 'en'"
        (click)="setLanguage('en')"
        title="English">
        EN
      </button>
      <span class="separator">|</span>
      <button 
        class="lang-btn"
        [class.active]="currentLanguage === 'ar'"
        (click)="setLanguage('ar')"
        title="العربية">
        AR
      </button>
    </div>
  `,
    styles: [`
    .language-switcher {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .lang-btn {
      background: transparent;
      border: none;
      padding: 4px 8px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-secondary, #6c757d);
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .lang-btn:hover {
      background: var(--hover-bg, #f0f0f0);
      color: var(--text-primary, #212529);
    }

    .lang-btn.active {
      background: var(--primary-color, #007bff);
      color: white;
    }

    .separator {
      color: var(--text-secondary, #6c757d);
    }
  `]
})
export class LanguageSwitcherComponent implements OnInit {
    private i18nService = inject(I18nService);
    currentLanguage: Language = 'en';

    ngOnInit(): void {
        this.i18nService.currentLanguage$.subscribe(lang => {
            this.currentLanguage = lang;
        });
    }

    setLanguage(language: Language): void {
        this.i18nService.setLanguage(language);
    }
}

@Component({
    selector: 'app-language-dropdown',
    template: `
    <div class="language-dropdown" [class.open]="isOpen">
      <button class="dropdown-trigger" (click)="toggleDropdown()">
        <span class="current-lang">{{ getLanguageName(currentLanguage) }}</span>
        <i class="dropdown-icon" [class.rotated]="isOpen">▼</i>
      </button>
      
      <div class="dropdown-menu" *ngIf="isOpen">
        <button 
          *ngFor="let lang of languages"
          class="dropdown-item"
          [class.active]="lang === currentLanguage"
          (click)="selectLanguage(lang)">
          {{ getLanguageName(lang) }}
        </button>
      </div>
    </div>
  `,
    styles: [`
    .language-dropdown {
      position: relative;
      display: inline-block;
    }

    .dropdown-trigger {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: transparent;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }

    .dropdown-trigger:hover {
      border-color: var(--primary-color, #007bff);
    }

    .dropdown-icon {
      font-size: 10px;
      transition: transform 0.2s ease;
    }

    .dropdown-icon.rotated {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 4px;
      background: white;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      overflow: hidden;
    }

    :host-context(.rtl) .dropdown-menu {
      left: auto;
      right: 0;
    }

    .dropdown-item {
      width: 100%;
      padding: 10px 12px;
      background: transparent;
      border: none;
      text-align: left;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease;
    }

    :host-context(.rtl) .dropdown-item {
      text-align: right;
    }

    .dropdown-item:hover {
      background: var(--hover-bg, #f8f9fa);
    }

    .dropdown-item.active {
      background: var(--primary-light, #e7f1ff);
      color: var(--primary-color, #007bff);
    }
  `]
})
export class LanguageDropdownComponent implements OnInit {
    private i18nService = inject(I18nService);
    currentLanguage: Language = 'en';
    languages: Language[] = ['en', 'ar'];
    isOpen = false;

    ngOnInit(): void {
        this.i18nService.currentLanguage$.subscribe(lang => {
            this.currentLanguage = lang;
        });
    }

    toggleDropdown(): void {
        this.isOpen = !this.isOpen;
    }

    selectLanguage(language: Language): void {
        this.i18nService.setLanguage(language);
        this.isOpen = false;
    }

    getLanguageName(language: Language): string {
        return this.i18nService.getLanguageDisplayName(language);
    }
}
