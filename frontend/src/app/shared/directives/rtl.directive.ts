import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { I18nService } from '../services/i18n.service';

/**
 * Directive to apply RTL-specific styles and classes
 * Usage: <div appRtl>Content</div>
 * Or with custom classes: <div appRtl rtlClass="custom-rtl" ltrClass="custom-ltr">Content</div>
 */
@Directive({
    selector: '[appRtl]'
})
export class RtlDirective implements OnInit, OnDestroy {
    @Input() rtlClass = 'rtl-element';
    @Input() ltrClass = 'ltr-element';

    private subscription: Subscription;

    constructor(
        private el: ElementRef,
        private i18nService: I18nService
    ) { }

    ngOnInit(): void {
        this.applyRtlStyles();

        this.subscription = this.i18nService.currentLanguage$.subscribe(() => {
            this.applyRtlStyles();
        });
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    private applyRtlStyles(): void {
        const element = this.el.nativeElement;
        const isRTL = this.i18nService.isRTL;

        if (isRTL) {
            element.classList.add(this.rtlClass);
            element.classList.remove(this.ltrClass);
            element.setAttribute('dir', 'rtl');
        } else {
            element.classList.add(this.ltrClass);
            element.classList.remove(this.rtlClass);
            element.setAttribute('dir', 'ltr');
        }
    }
}

/**
 * Directive to conditionally show/hide elements based on RTL
 * Usage: <div *appShowRtl>Only shown in RTL</div>
 */
@Directive({
    selector: '[appShowRtl]'
})
export class ShowRtlDirective implements OnInit, OnDestroy {
    private subscription: Subscription;

    constructor(
        private el: ElementRef,
        private i18nService: I18nService
    ) { }

    ngOnInit(): void {
        this.updateVisibility();

        this.subscription = this.i18nService.currentLanguage$.subscribe(() => {
            this.updateVisibility();
        });
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    private updateVisibility(): void {
        this.el.nativeElement.style.display = this.i18nService.isRTL ? '' : 'none';
    }
}

/**
 * Directive to conditionally show/hide elements based on LTR
 * Usage: <div *appShowLtr>Only shown in LTR</div>
 */
@Directive({
    selector: '[appShowLtr]'
})
export class ShowLtrDirective implements OnInit, OnDestroy {
    private subscription: Subscription;

    constructor(
        private el: ElementRef,
        private i18nService: I18nService
    ) { }

    ngOnInit(): void {
        this.updateVisibility();

        this.subscription = this.i18nService.currentLanguage$.subscribe(() => {
            this.updateVisibility();
        });
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    private updateVisibility(): void {
        this.el.nativeElement.style.display = this.i18nService.isRTL ? 'none' : '';
    }
}
