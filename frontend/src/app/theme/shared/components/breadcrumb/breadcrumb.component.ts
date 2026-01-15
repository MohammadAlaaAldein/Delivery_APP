// Angular Import
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule, Event } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

// project import
import { getNavigationItems, NavigationItem } from 'src/app/theme/layout/admin/navigation/navigation';
import { SharedModule } from '../../shared.module';
import { UsersService } from 'src/app/dashboard/users/users.service';
import { filter, Subscription } from 'rxjs';

interface titleType {
    // eslint-disable-next-line
    url: string | boolean | any | undefined;
    title: string;
    breadcrumbs: unknown;
    type: string;
}

@Component({
    selector: 'app-breadcrumb',
    standalone: true,
    imports: [CommonModule, RouterModule, SharedModule],
    templateUrl: './breadcrumb.component.html'
})
export class BreadcrumbComponent {
    // public props
    @Input() type: string;

    navigations: NavigationItem[];
    breadcrumbList: Array<string> = [];
    navigationList!: titleType[];
    private routerSubscription!: Subscription;

    // constructor
    constructor(
        private route: Router,
        private titleService: Title,
        private translate: TranslateService,
        public userService: UsersService
    ) {
        this.navigations = getNavigationItems();
        this.type = 'icon';
        this.setBreadcrumb();
    }

    ngOnDestroy(): void {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
    }


    matchUrl(navItem: NavigationItem, activeLink: string): boolean {
        if ('url' in navItem) return navItem.url === activeLink;

        if ('urlPattern' in navItem) {
            const lastSegment = activeLink.substring(activeLink.lastIndexOf('/') + 1);

            if (navItem.urlPattern === lastSegment) {
                return true;
            }

            return new RegExp(navItem.urlPattern).test(activeLink);
        }
        return false;
    }




    setBreadcrumb() {
        this.routerSubscription = this.route.events.pipe(
            filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
        ).subscribe((router: NavigationEnd) => {
            let activeLink = router.url.split('?')[0].split('#')[0];

            const defaultRoutePattern = new RegExp('/device-page/[^/]+/[^/]+$');
            if (defaultRoutePattern.test(activeLink)) {
                activeLink = activeLink + '/define';
            }
            const breadcrumbList = this.filterNavigation(this.navigations, activeLink);

            let title = breadcrumbList[breadcrumbList.length - 1]?.title;

            this.navigationList = breadcrumbList;

            if (title)
                this.titleService.setTitle(`${this.translate.instant('g.delivery_app')} - ${this.translate.instant(title)}`);
        });
    }

    filterNavigation(navItems: NavigationItem[], activeLink: string): titleType[] {
        for (const navItem of navItems) {

            if (navItem.type === 'item' && this.matchUrl(navItem, activeLink)) {
                return [
                    {
                        url: false,
                        title: navItem.title,
                        breadcrumbs: 'breadcrumbs' in navItem ? navItem.breadcrumbs : true,
                        type: navItem.type
                    }
                ];
            }

            if ('children' in navItem) {
                const breadcrumbList = this.filterNavigation(navItem.children!, activeLink);

                if (breadcrumbList.length > 0) {

                    if (navItem.id === 'device-page') {
                        let finalBreadcrumbs: titleType[] = [];

                        finalBreadcrumbs.push({
                            url: undefined,
                            title: navItem.title,
                            breadcrumbs: 'breadcrumbs' in navItem ? navItem.breadcrumbs : true,
                            type: navItem.type
                        });

                        const segments = activeLink.split('/').filter(s => s.length > 0);
                        const devicePageIndex = segments.indexOf('device-page');

                        if (devicePageIndex !== -1 && segments.length > devicePageIndex + 1) {
                            const categorySegment = segments[devicePageIndex + 1];

                            finalBreadcrumbs.push({
                                url: `/devices/${categorySegment}`,
                                title: categorySegment,
                                breadcrumbs: true,
                                type: 'dynamic'
                            });
                        }
                        return [...finalBreadcrumbs, ...breadcrumbList];
                    }

                    breadcrumbList.unshift({
                        url: 'url' in navItem ? navItem.url : false,
                        title: navItem.title,
                        breadcrumbs: 'breadcrumbs' in navItem ? navItem.breadcrumbs : true,
                        type: navItem.type
                    });
                    return breadcrumbList;
                }
            }
        }
        return [];
    }
}
